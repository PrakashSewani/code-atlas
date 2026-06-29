import json
import re
import asyncio
from typing import Any, Dict, List
from app.core.config import settings
from app.core.tools import ToolRegistry
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)


def _extract_json(content: str) -> Dict[str, Any]:
    """Extract JSON from LLM response, handling markdown code blocks and extra text."""
    # Try direct parse first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from markdown code block
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try finding JSON object in the text
    brace_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass
    
    return {}


class PlannerAgent:
    """
    The Planner analyzes the repository and decides which specialist agents to dispatch.
    """
    def __init__(self, tools: ToolRegistry):
        self.tools = tools

    async def plan(self, repo_name: str) -> Dict[str, Any]:
        tree = self.tools.tool_get_repository_tree()
        
        prompt = f"""Analyze this repository file tree and determine which engineering specialists are needed.
Repository: {repo_name}
Tree (first 100 files): {tree[:100]}

Available Specialists:
- architecture: Analysis of modules, boundaries and patterns.
- security: Analysis of JWT, OAuth, Secrets, and vulnerabilities.
- performance: Analysis of bottlenecks and caching.
- dependency: Analysis of package manifests and outdated versions.
- vision: Analysis of architecture diagrams and visual artifacts.

Return a JSON object with:
1. "agents": List of agent IDs to run (e.g., ["architecture", "security", "performance", "dependency"])
2. "reasoning": Brief explanation why.
3. "urgency": High/Medium/Low.

Return ONLY the JSON object, no other text."""

        try:
            response = await client.chat.completions.create(
                model=settings.GEMMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Senior Engineering Planner. Return ONLY a JSON object."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            # Ensure we have a valid agents list
            if not result.get("agents"):
                # Default: run all agents
                result = {
                    "agents": ["architecture", "security", "performance", "dependency"],
                    "reasoning": "Running all specialists for comprehensive analysis",
                    "urgency": "Medium"
                }
            
            return result
            
        except Exception as e:
            # Fallback: run all agents
            return {
                "agents": ["architecture", "security", "performance", "dependency"],
                "reasoning": f"Planner failed ({str(e)}), running all specialists",
                "urgency": "Medium"
            }
