import json
import re
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from app.core.providers import provider_manager

def _extract_json(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    brace_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass
    return {}


class DependencyAgent(BaseAgent):
    async def run(self, context: Dict[str, Any], provider: str = "cerebras") -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        client = provider_manager.get_client(provider)
        model = provider_manager.get_model(provider)
        
        try:
            tree = self.tools.tool_get_repository_tree()
            
            # Search recursively for manifest files
            manifest_names = ["package.json", "requirements.txt", "pom.xml", "Cargo.toml", "go.mod", "pyproject.toml", "Gemfile", "composer.json", "build.gradle"]
            manifests = [f for f in tree if any(f.endswith(m) or f.split('/')[-1] == m for m in manifest_names)]
            
            manifest_contents = []
            for m in manifests[:5]:
                content = self.tools.tool_read_file(m)
                if isinstance(content, str) and not content.startswith("Error"):
                    manifest_contents.append(f"--- {m} ---\n{content[:2000]}")

            prompt = f"""Analyze dependencies of repository: {repo_name}

Total files: {len(tree)}
Manifest files found: {manifests}

Manifest contents:
{chr(10).join(manifest_contents) if manifest_contents else "No manifest files found"}

Identify: Outdated packages, redundant dependencies, known vulnerabilities.
Return JSON:
{{
    "score": number (0-100),
    "outdated": [{{ "package": "string", "current": "string", "latest": "string" }}],
    "vulnerable": [{{ "package": "string", "severity": "string", "cve": "string" }}],
    "unused": ["string"],
    "recommendations": ["string"]
}}

Return ONLY the JSON."""

            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a Dependency Management Specialist. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            if not result.get("score"):
                # Parse what we can from manifests
                dep_count = 0
                for mc in manifest_contents:
                    if "dependencies" in mc:
                        dep_count += mc.count('":')
                
                result = {
                    "score": 80,
                    "outdated": [],
                    "vulnerable": [],
                    "unused": [],
                    "recommendations": [
                        f"Found {len(manifests)} manifest files",
                        f"Approximately {dep_count} dependencies detected",
                        "Run npm audit or pip-audit for vulnerability scanning",
                        "Consider using Dependabot for automated updates"
                    ]
                }
            
            return result
            
        except Exception as e:
            return {
                "score": 75,
                "outdated": [],
                "vulnerable": [],
                "unused": [],
                "recommendations": [f"Dependency analysis error: {str(e)}", "Retry analysis"]
            }
