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
from app.agents.chat import ChatAgent
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
        repo_url = repo_url.strip()
        repo_name = repo_url.split('/')[-1].replace('.git', '')
        
        # Shared queue for all stages (clone, parse, orchestrate)
        queue = asyncio.Queue()
        
        async def queue_callback(agent_id: str, data: dict):
            await queue.put((agent_id, data))

        # Step 1: Clone with progress
        cloner = RepoCloner()
        
        def sync_callback(agent_id, data):
            # Since cloner is synchronous, we use a thread or simple put if we can
            # but we need to be careful with async queues in sync functions.
            # For now, we'll rely on the orchestration wrapper or a simple helper.
            pass

        # To properly stream from synchronous cloner, we run it in a thread
        loop = asyncio.get_event_loop()
        
        def run_clone():
            # We create a local function to bridge sync cloner to async queue
            def progress_wrapper(aid, d):
                # We can't directly await queue.put from sync
                # Using loop.call_soon_threadsafe
                loop.call_soon_threadsafe(queue.put_nowait, (aid, d))
            
            repo_path = cloner.clone_repository(repo_url, repo_name, progress_callback=progress_wrapper)
            cloner.clean_repository(repo_path)
            return repo_path

        repo_path = await loop.run_in_executor(None, run_clone)
        
        # 2. Parse and Build Knowledge Graph
        await queue.put(("planner", {"status": "in_progress", "result": "Parsing repository and building knowledge graph..."}))
        parser = RepoParser(repo_path)
        # Parsing is also typically synchronous/heavy
        graph = await loop.run_in_executor(None, parser.parse)
        await queue.put(("planner", {"status": "completed", "result": "Knowledge graph built successfully"}))
        
        # 3. Setup Tools and Orchestrator
        tools = ToolRegistry(repo_name, graph)
        orchestrator = AgentOrchestrator(repo_name, tools)
        
        # Run orchestration
        orchestration_task = asyncio.create_task(orchestrator.orchestrate(queue_callback))
        
        # Stream from queue
        while not orchestration_task.done() or not queue.empty():
            try:
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
    try:
        repo_name = request.repo_name
        # Recover Knowledge Graph for the repo
        from app.core.config import settings
        from app.engine.parser import RepoParser
        from app.core.tools import ToolRegistry
        
        # Clean path to avoid potential issues with trailing slashes or spaces
        repo_name_cleaned = repo_name.strip()
        repo_path = settings.REPOS_DIR / repo_name_cleaned
        
        if not repo_path.exists():
            raise HTTPException(status_code=404, detail=f"Repository {repo_name} not found in storage")
            
        # We must parse it again to reconstruct the graph from the files on disk
        parser = RepoParser(repo_path)
        graph = parser.parse()
        tools = ToolRegistry(repo_name_cleaned, graph)
        
        chat_agent = ChatAgent("chat_bot", tools)
        result = await chat_agent.run({"repo_name": repo_name_cleaned, "message": request.message})
        
        return result
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
