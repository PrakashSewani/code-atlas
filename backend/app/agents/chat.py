import json
import asyncio
from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)

class ChatAgent(BaseAgent):
    """
    The Interactive Chat Agent uses the ToolRegistry and Knowledge Graph
    to answer deep technical questions about the repository.
    """
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        user_message = context.get("message", "")
        repo_name = context.get("repo_name", "unknown")
        
        # System prompt emphasizing the use of tools for grounding
        system_prompt = f"""
        You are the CodeAtlas AI Lead Engineer. You have full access to the repository {repo_name}.
        Use the provided tools to explore the codebase, find symbol definitions, and analyze relationships.
        ALWAYS ground your answers in the actual code. If you don't know, use a tool to find out.
        """
        
        # We use a loop for tool-calling (simplified for this implemention)
        # In a full version, this would be a recursive loop checking for tool calls in the response.
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        response = await client.chat.completions.create(
            model=settings.GEMMA_MODEL,
            messages=messages,
            tools=self.tools.get_tool_definitions()
        )
        
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            # Execute tool calls and feed back to LLM
            for tool_call in response_message.tool_calls:
                tool_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                result = self.tools.execute(tool_name, args)
                
                messages.append(response_message)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": tool_name,
                    "content": json.dumps(result)
                })
            
            # Get final answer after tool results
            final_response = await client.chat.completions.create(
                model=settings.GEMMA_MODEL,
                messages=messages
            )
            return {"response": final_response.choices[0].message.content}

        return {"response": response_message.content}
