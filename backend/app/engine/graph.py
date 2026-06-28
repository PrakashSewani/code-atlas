import networkx as nx
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from pathlib import Path

class Entity(BaseModel):
    id: str
    type: str # 'module', 'class', 'function', 'route', 'file'
    name: str
    summary: Optional[str] = None
    path: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RepositoryGraph:
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.entities: Dict[str, Entity] = {}

    def add_entity(self, entity: Entity):
        self.entities[entity.id] = entity
        self.graph.add_node(entity.id, **entity.model_dump())

    def add_relationship(self, source_id: str, target_id: str, rel_type: str):
        """
        Adds a relationship between two entities.
        Example rel_types: 'calls', 'imports', 'defines', 'extends'
        """
        if source_id in self.entities and target_id in self.entities:
            self.graph.add_edge(source_id, target_id, relationship=rel_type)

    def get_entity_context(self, entity_id: str) -> Dict[str, Any]:
        """
        Retrieves the entity and its immediate neighbors for LLM context.
        """
        if entity_id not in self.entities:
            return {}
        
        entity = self.entities[entity_id]
        neighbors = list(self.graph.neighbors(entity_id))
        
        return {
            "entity": entity.model_dump(),
            "dependencies": [self.entities[n].name for n in neighbors if n in self.entities]
        }

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the graph for visualization in the frontend.
        """
        return {
            "nodes": [Entity(**data).model_dump() for _, data in self.graph.nodes(data=True)],
            "edges": [{"source": u, "target": v, "label": d['relationship']} 
                      for u, v, d in self.graph.edges(data=True)]
        }
