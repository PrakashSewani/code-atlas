import json
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class SecurityAgent(BaseAgent):
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        # Tool Usage: Find high-risk files (config, auth, etc)
        tree = self.tools.tool_get_repository_tree()
        risk_files = [f for f in tree if any(x in f.lower() for x in ["auth", "jwt", "config", "secret", "env", "password"])]
        
        # Read a few key files for deep analysis
        file_contents = []
        for f in risk_files[:5]:
            content = self.tools.tool_read_file(f)
            file_contents.append(f"--- File: {f} ---\n{content[:2000]}")

        prompt = f"""
        Perform a security audit of the repository: {repo_name}
        Risk files found: {risk_files}
        Sample Content: {"\n".join(file_contents)}
        
        Look for: Hardcoded secrets, insecure JWT implementation, SQL injection, XSS, and missing authorization.
        Return valid JSON matching this schema:
        {{
            "score": number (0-100),
            "critical": [{{ "file": "string", "issue": "string", "fix": "string" }}],
            "medium": [{{ "file": "string", "issue": "string", "fix": "string" }}],
            "low": [{{ "file": "string", "issue": "string", "fix": "string" }}],
            "recommendations": ["string"]
        }}
        """
        
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[{"role": "system", "content": "You are a Senior Security Researcher. Return ONLY JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
