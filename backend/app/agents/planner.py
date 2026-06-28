import json
import asyncio
from typing import Any, Dict, List
from app.core.config import settings
from app.core.tools import ToolRegistry
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class PlannerAgent:
    """
    The Planner analyzes the repository and decides which specialist agents to dispatch.
    """
    def __init__(self, tools: ToolRegistry):
        self.tools = tools

    async def plan(self, repo_name: str) -> Dict[str, Any]:
        # Planner uses a very lightweight prompt to decide agent orchestration
        # It uses tools to get a high-level overview of the repo first
        tree = self.tools.tool_get_repository_tree()
        
        prompt = f"""
        Analyze the following repository file tree and determine which engineering specialists are needed.
        Repository: {repo_name}
        Tree: {tree[:100]} # truncated for prompt size
        
        Available Specialists:
        - architecture: Analysis of modules, boundaries and patterns.
        - security: Analysis of JWT, OAuth, Secrets, and vulnerabilities.
        - performance: Analysis of bottlenecks and caching.
        - dependency: Analysis of package manifests and outdated versions.
        - documentation: Analysis of README and guides.
        - quality: Analysis of SOLID and maintainability.
        - testing: Analysis of test coverage and risky paths.

        Return a JSON object with:
        1. "agents": List of agent IDs to run.
        2. "reasoning": Brief explanation why.
        3. "urgency": High/Medium/Low.
        """

        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[{"role": "system", "content": "You are a Senior Engineering Planner. Return ONLY JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
