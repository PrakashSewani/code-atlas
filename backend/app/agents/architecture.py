import json
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from app.core.providers import provider_manager

def _extract_json(content: str) -> Dict[str, Any]:
    """Extract JSON from LLM response."""
    import re
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


class ArchitectureAgent(BaseAgent):
    async def run(self, context: Dict[str, Any], provider: str = "cerebras") -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        client = provider_manager.get_client(provider)
        model = provider_manager.get_model(provider)
        
        try:
            tree = self.tools.tool_get_repository_tree()
            symbols = self.tools.tool_list_symbols()
            
            # Get directory structure
            dirs = set()
            for f in tree:
                parts = f.split('/')
                if len(parts) > 1:
                    dirs.add(parts[0])
            
            prompt = f"""Analyze the architecture of repository: {repo_name}

Directory structure: {sorted(list(dirs))[:20]}
File count: {len(tree)}
Key symbols found: {len(symbols)}

Sample files: {tree[:30]}
Sample symbols: {symbols[:20]}

Provide a concise architectural analysis as JSON:
{{
    "score": number (0-100),
    "architecture_style": "string (e.g., MVC, Clean Architecture, Monolith, Microservices)",
    "layers": ["list of architectural layers found"],
    "services": ["list of services/modules identified"],
    "patterns": ["design patterns found"],
    "issues": ["architectural issues or violations"],
    "recommendations": ["improvement suggestions"]
}}

Return ONLY the JSON object."""

            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a Principal Software Architect. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            if not result.get("score"):
                result = {
                    "score": 75,
                    "architecture_style": "Modular" if len(dirs) > 3 else "Monolith",
                    "layers": sorted(list(dirs))[:5],
                    "services": sorted(list(dirs))[:10],
                    "patterns": ["Repository Pattern", "Service Layer"],
                    "issues": ["Could not complete deep analysis"],
                    "recommendations": ["Add more documentation", "Improve separation of concerns"]
                }
            
            return result
            
        except Exception as e:
            return {
                "score": 70,
                "architecture_style": "Analysis Error",
                "layers": [],
                "services": [],
                "patterns": [],
                "issues": [f"Analysis failed: {str(e)}"],
                "recommendations": ["Retry analysis"]
            }
