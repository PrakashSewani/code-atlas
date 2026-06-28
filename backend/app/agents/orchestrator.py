import asyncio
import logging
from typing import Any, Dict, List
from app.agents.planner import PlannerAgent
from app.agents.base import BaseAgent
from app.core.tools import ToolRegistry

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Manages the parallel execution of agents and streams results to the dashboard.
    """
    def __init__(self, repo_name: str, tools: ToolRegistry):
        self.repo_name = repo_name
        self.tools = tools
        self.planner = PlannerAgent(tools)
        self.results: Dict[str, Any] = {}

    async def orchestrate(self, update_callback):
        """
        1. Plan
        2. Dispatch Agents in Parallel
        3. Stream Updates via callback
        """
        logger.info(f"Starting orchestration for {self.repo_name}")
        
        # Phase 1: Planning
        plan = await self.planner.plan(self.repo_name)
        await update_callback("planner", {"status": "completed", "plan": plan})
        
        agents_to_run = plan.get("agents", [])
        
        # Phase 2: Parallel Dispatch
        # In a real scenario, we'd map agent IDs to actual Agent classes
        tasks = [self._run_agent_wrapper(agent_id, update_callback) for agent_id in agents_to_run]
        await asyncio.gather(*tasks)
        
        # Phase 3: Final Summary
        await update_callback("summary", {"status": "completed", "message": "All specialists finished analysis."})

    async def _run_agent_wrapper(self, agent_id: str, update_callback):
        """
        Wrapper to handle agent instantiation and result reporting.
        """
        try:
            await update_callback(agent_id, {"status": "in_progress"})
            
            # Mocking the actual agent execution for now 
            # (Actual specialist agents implemented in next phase)
            await asyncio.sleep(1.5) 
            
            result = {"score": 85, "findings": ["Example finding for " + agent_id]}
            self.results[agent_id] = result
            
            await update_callback(agent_id, {"status": "completed", "result": result})
        except Exception as e:
            logger.error(f"Agent {agent_id} failed: {e}")
            await update_callback(agent_id, {"status": "failed", "error": str(e)})
