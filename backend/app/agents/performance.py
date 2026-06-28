import json
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class PerformanceAgent(BaseAgent):
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        # Tool Usage: Search for common bottlenecks
        tree = self.tools.tool_get_repository_tree()
        # Patterns: nested loops, heavy DB queries, synchronous blocks in async code
        bottleneck_files = []
        for f in tree:
            if f.endswith(('.py', '.js', '.ts', '.tsx')):
                content = self.tools.tool_read_file(f)
                if any(x in content for x in ["while True", "for i in range", "await asyncio.gather", "sync"]):
                    bottleneck_files.append(f)

        prompt = f"""
        Analyze the performance of the repository: {repo_name}
        Potentially slow files: {bottleneck_files[:20]}
        
        Look for: N+1 queries, blocked event loops, inefficient data structures, and lack of caching.
        Return valid JSON matching this schema:
        {{
            "score": number (0-100),
            "bottlenecks": [{{ "file": "string", "issue": "string", "impact": "High/Med/Low" }}],
            "optimizations": [{{ "suggestion": "string", "expected_gain": "string" }}]
        }}
        """
        
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[{"role": "system", "content": "You are a Performance Engineer. Return ONLY JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
