from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.core.tools import ToolRegistry

class BaseAgent(ABC):
    """
    Abstract base class for all AI Specialists.
    """
    def __init__(self, agent_id: str, tools: ToolRegistry):
        self.agent_id = agent_id
        self.tools = tools

    @abstractmethod
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the agent's specialized analysis.
        Returns a structured JSON result.
        """
        pass
