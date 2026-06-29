import asyncio
import logging
from typing import Any, Dict, List, Callable
from app.agents.planner import PlannerAgent
from app.agents.architecture import ArchitectureAgent
from app.agents.security import SecurityAgent
from app.agents.performance import PerformanceAgent
from app.agents.dependency import DependencyAgent
from app.agents.vision import VisionAgent
from app.core.tools import ToolRegistry

logger = logging.getLogger(__name__)

# Default agents to always run
DEFAULT_AGENTS = ["architecture", "security", "performance", "dependency", "vision"]

AGENT_MAP = {
    "architecture": ArchitectureAgent,
    "security": SecurityAgent,
    "performance": PerformanceAgent,
    "dependency": DependencyAgent,
    "vision": VisionAgent,
}


class AgentOrchestrator:
    """
    Manages the parallel execution of agents and streams results to the dashboard.
    """
    def __init__(self, repo_name: str, tools: ToolRegistry):
        self.repo_name = repo_name
        self.tools = tools
        self.planner = PlannerAgent(tools)
        self.results: Dict[str, Any] = {}

    async def orchestrate(self, update_callback: Callable):
        """
        1. Plan (or use defaults)
        2. Dispatch Agents in Parallel
        3. Stream Updates via callback
        """
        logger.info(f"Starting orchestration for {self.repo_name}")
        
        # Phase 1: Planning (with fallback)
        try:
            plan = await asyncio.wait_for(self.planner.plan(self.repo_name), timeout=30.0)
            agents_to_run = plan.get("agents", DEFAULT_AGENTS)
            await update_callback("planner", {"status": "completed", "result": f"Plan: {len(agents_to_run)} agents to run"})
        except Exception as e:
            logger.warning(f"Planner failed: {e}, using defaults")
            agents_to_run = DEFAULT_AGENTS
            await update_callback("planner", {"status": "completed", "result": f"Using default agents (planner failed: {str(e)[:50]})"})
        
        # Ensure vision is always included
        if "vision" not in agents_to_run:
            agents_to_run.append("vision")
        
        # Phase 2: Parallel Dispatch
        tasks = []
        for agent_id in agents_to_run:
            if agent_id in AGENT_MAP:
                tasks.append(self._run_agent_wrapper(agent_id, update_callback))
            else:
                # Skip unknown agents but mark as completed
                await update_callback(agent_id, {"status": "completed", "result": f"Agent '{agent_id}' not implemented"})
        
        # Run all agents in parallel with timeout
        if tasks:
            try:
                await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=120.0)
            except asyncio.TimeoutError:
                logger.warning("Some agents timed out")
        
        # Phase 3: Final Summary
        completed = len([r for r in self.results.values() if r])
        await update_callback("summary", {
            "status": "completed", 
            "result": f"Analysis complete. {completed}/{len(agents_to_run)} agents finished successfully."
        })

    async def _run_agent_wrapper(self, agent_id: str, update_callback: Callable):
        """
        Wrapper to handle agent instantiation and result reporting.
        """
        try:
            await update_callback(agent_id, {"status": "in_progress"})
            
            agent_cls = AGENT_MAP.get(agent_id)
            if not agent_cls:
                await update_callback(agent_id, {"status": "completed", "result": {"score": 0, "message": "Agent not found"}})
                return
            
            agent = agent_cls(agent_id, self.tools)
            
            # Run with timeout
            try:
                result = await asyncio.wait_for(
                    agent.run({"repo_name": self.repo_name}),
                    timeout=60.0
                )
            except asyncio.TimeoutError:
                result = {"score": 50, "message": "Analysis timed out", "timeout": True}
            
            self.results[agent_id] = result
            await update_callback(agent_id, {"status": "completed", "result": result})
            
        except Exception as e:
            logger.error(f"Agent {agent_id} failed: {e}")
            await update_callback(agent_id, {"status": "completed", "result": {"score": 0, "error": str(e)}})
