import json
import asyncio
from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class VisionAgent(BaseAgent):
    """
    Multimodal agent that compares visual artifacts (diagrams, screenshots) 
    with the actual repository structure.
    """
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        image_url = context.get("image_url") # Assume URL or base64
        
        if not image_url:
            return {"error": "No image provided for vision analysis"}

        # Tool Usage: Get ground truth from Knowledge Graph
        tree = self.tools.tool_get_repository_tree()
        symbols = self.tools.tool_list_symbols()
        
        prompt = f"""
        Analyze the provided image (architecture diagram, whiteboard, or screenshot) and compare it 
        with the actual repository structure of {repo_name}.
        
        Actual Repository Tree: {tree[:100]}
        Actual Major Symbols: {symbols[:50]}
        
        Identify:
        1. Components mentioned in the image but missing in code.
        2. Components in code but missing from the diagram.
        3. Mismatches in relationships or data flow.
        
        Return valid JSON matching this schema:
        {{
            "alignment_score": number (0-100),
            "mismatches": [{{ "type": "missing_in_code" | "missing_in_diagram" | "wrong_relationship", "detail": "string" }}],
            "observations": ["string"],
            "recommendations": ["string"]
        }}
        """
        
        # Multimodal request to Gemma 4 (using Vision capabilities)
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
