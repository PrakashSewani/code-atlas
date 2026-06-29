import os
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings

class ProviderClient:
    """
    Handles multi-provider LLM clients for benchmark racing.
    """
    def __init__(self):
        self.clients = {
            "cerebras": AsyncOpenAI(
                api_key=settings.CEREBRAS_API_KEY, 
                base_url=settings.CEREBRAS_BASE_URL
            ),
            "mimo": AsyncOpenAI(
                api_key=settings.MIMO_API_KEY, 
                base_url=settings.MIMO_BASE_URL
            )
        }
        self.models = {
            "cerebras": settings.GEMMA_MODEL,
            "mimo": settings.MIMO_MODEL
        }

    def get_client(self, provider: str) -> AsyncOpenAI:
        return self.clients.get(provider)

    def get_model(self, provider: str) -> str:
        return self.models.get(provider)

# Singleton instance for use across agents
provider_manager = ProviderClient()
