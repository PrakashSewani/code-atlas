from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import AsyncGenerator
import asyncio
import json

from app.engine.cloner import RepoCloner
from app.engine.parser import RepoParser
from app.core.tools import ToolRegistry
from app.agents.orchestrator import AgentOrchestrator
from app.core.config import settings

router = APIRouter()

class AnalysisRequest(BaseModel):
    repo_url: str

class ChatRequest(BaseModel):
    repo_name: str
    message: str

async def analysis_streamer(repo_url: str) -> AsyncGenerator[str, None]:
    """
    Streams orchestration updates to the frontend using Server-Sent Events (SSE).
    """
    try:
        # 1. Extract repo name and clone
        repo_name = repo_url.split('/')[-1].replace('.git', '')
        cloner = RepoCloner()
        repo_path = cloner.clone_repository(repo_url, repo_name)
        cloner.clean_repository(repo_path)
        
        # 2. Parse and Build Knowledge Graph
        parser = RepoParser(repo_path)
        graph = parser.parse()
        
        # 3. Setup Tools and Orchestrator
        tools = ToolRegistry(repo_name, graph)
        orchestrator = AgentOrchestrator(repo_name, tools)
        
        async def update_callback(agent_id: str, data: dict):
            yield f"data: {json.dumps({'agent_id': agent_id, **data})}\n\n"
            
        # Since the orchestrator takes a callback, we need a queue to convert it to a generator
        queue = asyncio.Queue()
        
        async def queue_callback(agent_id: str, data: dict):
            await queue.put((agent_id, data))

        # Run orchestration in background
        orchestration_task = asyncio.create_task(orchestrator.orchestrate(queue_callback))
        
        # Stream from queue
        while not orchestration_task.done() or not queue.empty():
            try:
                # Small timeout to check task status
                agent_id, data = await asyncio.wait_for(queue.get(), timeout=1.0)
                yield f"data: {json.dumps({'agent_id': agent_id, **data})}\n\n"
            except asyncio.TimeoutError:
                continue
        
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@router.post("/analyze")
async def analyze_repo(request: AnalysisRequest):
    return StreamingResponse(
        analysis_streamer(request.repo_url), 
        media_type="text/event-stream"
    )

@router.post("/chat")
async def chat(request: ChatRequest):
    # Basic implementation: In a real scenario, this would use a dedicated ChatAgent
    # that utilizes the ToolRegistry and Knowledge Graph.
    return {"response": f"I've analyzed {request.repo_name}. How can I help you with the code?"}
