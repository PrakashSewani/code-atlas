import json
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class ArchitectureAgent(BaseAgent):
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        # Tool Usage: Get structural overview
        tree = self.tools.tool_get_repository_tree()
        symbols = self.tools.tool_list_symbols()
        
        prompt = f"""
        Analyze the architecture of the repository: {repo_name}
        File Tree: {tree[:100]}
        Major Symbols: {symbols[:50]}
        
        Evaluate the architecture style, layering, patterns, and identify any structural issues.
        Return valid JSON matching this schema:
        {{
            "score": number (0-100),
            "architecture_style": "string",
            "layers": ["string"],
            "services": ["string"],
            "patterns": ["string"],
            "issues": ["string"],
            "recommendations": ["string"]
        }}
        """
        
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[{"role": "system", "content": "You are a Principal Software Architect. Return ONLY JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
