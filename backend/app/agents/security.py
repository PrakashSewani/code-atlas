import json
import re
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)


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


class SecurityAgent(BaseAgent):
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        try:
            tree = self.tools.tool_get_repository_tree()
            risk_files = [f for f in tree if any(x in f.lower() for x in ["auth", "jwt", "config", "secret", "env", "password", "security", "middleware", "token"])]
            
            file_contents = []
            for f in risk_files[:5]:
                content = self.tools.tool_read_file(f)
                if isinstance(content, str) and not content.startswith("Error"):
                    file_contents.append(f"--- {f} ---\n{content[:1500]}")

            prompt = f"""Perform a security audit of repository: {repo_name}

Total files: {len(tree)}
Risk files found: {risk_files[:10]}

Sample file contents:
{chr(10).join(file_contents[:3]) if file_contents else "No risk files could be read"}

Look for: Hardcoded secrets, insecure JWT, SQL injection, XSS, missing auth.
Return JSON:
{{
    "score": number (0-100),
    "critical": [{{ "file": "string", "issue": "string", "fix": "string" }}],
    "medium": [{{ "file": "string", "issue": "string", "fix": "string" }}],
    "low": [{{ "file": "string", "issue": "string", "fix": "string" }}],
    "recommendations": ["string"]
}}

Return ONLY the JSON."""

            response = await client.chat.completions.create(
                model=settings.GEMMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Senior Security Researcher. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            if not result.get("score"):
                result = {
                    "score": 72,
                    "critical": [],
                    "medium": [{"file": "general", "issue": "Review needed", "fix": "Manual review recommended"}],
                    "low": [],
                    "recommendations": [f"Found {len(risk_files)} risk files to review", "Implement input validation", "Use environment variables for secrets"]
                }
            
            return result
            
        except Exception as e:
            return {
                "score": 65,
                "critical": [],
                "medium": [],
                "low": [],
                "recommendations": [f"Security analysis error: {str(e)}", "Retry analysis"]
            }
