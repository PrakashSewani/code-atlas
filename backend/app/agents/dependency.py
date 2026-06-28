import json
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class DependencyAgent(BaseAgent):
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        # Tool Usage: Find manifest files
        tree = self.tools.tool_get_repository_tree()
        manifests = [f for f in tree if f in ["package.json", "requirements.txt", "pom.xml", "Cargo.toml", "go.mod", "pyproject.toml"]]
        
        manifest_contents = []
        for m in manifests:
            content = self.tools.tool_read_file(m)
            manifest_contents.append(f"--- {m} ---\n{content}")

        prompt = f"""
        Analyze the dependencies of the repository: {repo_name}
        Manifests: {"\n".join(manifest_contents)}
        
        Identify: Outdated packages, redundant dependencies, and known vulnerable versions.
        Return valid JSON matching this schema:
        {{
            "score": number (0-100),
            "outdated": [{{ "package": "string", "current": "string", "latest": "string" }}],
            "vulnerable": [{{ "package": "string", "severity": "string", "cve": "string" }}],
            "unused": ["string"],
            "recommendations": ["string"]
        }}
        """
        
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[{"role": "system", "content": "You are a Dependency Management Specialist. Return ONLY JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
