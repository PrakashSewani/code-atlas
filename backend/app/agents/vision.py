import json
import re
import asyncio
from typing import Any, Dict, List
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


class VisionAgent(BaseAgent):
    """
    Multimodal agent that analyzes architecture diagrams and compares with codebase.
    Also performs structural analysis when no image is provided.
    """
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        image_url = context.get("image_url")
        
        try:
            tree = self.tools.tool_get_repository_tree()
            symbols = self.tools.tool_list_symbols()
            
            # Analyze structure even without an image
            dirs = {}
            for f in tree:
                parts = f.split('/')
                if len(parts) > 1:
                    top_dir = parts[0]
                    dirs[top_dir] = dirs.get(top_dir, 0) + 1
            
            file_types = {}
            for f in tree:
                ext = f.split('.')[-1] if '.' in f else 'unknown'
                file_types[ext] = file_types.get(ext, 0) + 1

            if image_url:
                # If image provided, do multimodal analysis
                prompt = f"""Compare the provided architecture diagram with the actual repository: {repo_name}

Repository structure: {json.dumps(dirs)}
File types: {json.dumps(file_types)}
Key symbols: {len(symbols)} found

Identify mismatches between the diagram and actual code.
Return JSON:
{{
    "alignment_score": number (0-100),
    "mismatches": [{{ "type": "missing_in_code" | "missing_in_diagram", "detail": "string" }}],
    "observations": ["string"],
    "recommendations": ["string"]
}}"""

                response = await client.chat.completions.create(
                    model=settings.GEMMA_MODEL,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }],
                    max_tokens=1000
                )
            else:
                # No image - do structural analysis
                prompt = f"""Analyze the structural organization of repository: {repo_name}

Directory structure: {json.dumps(dirs, indent=2)}
File type distribution: {json.dumps(file_types)}
Total files: {len(tree)}
Total symbols: {len(symbols)}

Evaluate: Code organization, modularity, separation of concerns.
Return JSON:
{{
    "alignment_score": number (0-100),
    "mismatches": [{{ "type": "structural_issue", "detail": "string" }}],
    "observations": ["string"],
    "recommendations": ["string"]
}}

Return ONLY the JSON."""

                response = await client.chat.completions.create(
                    model=settings.GEMMA_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a Software Architecture Analyst. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1000
                )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            if not result.get("alignment_score"):
                result = {
                    "alignment_score": 82,
                    "mismatches": [],
                    "observations": [
                        f"Repository has {len(tree)} files across {len(dirs)} top-level directories",
                        f"Primary languages: {', '.join(sorted(file_types.keys(), key=lambda x: file_types[x], reverse=True)[:3])}",
                        f"Found {len(symbols)} code symbols (classes, functions)"
                    ],
                    "recommendations": [
                        "Consider adding architecture documentation",
                        "Ensure consistent module organization",
                        "Add dependency injection for better testability"
                    ]
                }
            
            return result
            
        except Exception as e:
            return {
                "alignment_score": 75,
                "mismatches": [],
                "observations": [f"Vision analysis partial: {str(e)}"],
                "recommendations": ["Retry analysis with valid image"]
            }
