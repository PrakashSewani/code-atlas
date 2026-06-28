from typing import Any, Dict, List, Optional
from pathlib import Path
from app.core.config import settings
from app.engine.graph import RepositoryGraph

class ToolRegistry:
    """
    Provides a set of tools that AI agents can use to interact with the repository.
    """
    def __init__(self, repo_name: str, graph: RepositoryGraph):
        self.repo_name = repo_name
        self.graph = graph
        self.repo_path = settings.REPOS_DIR / repo_name

    def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        method = getattr(self, f"tool_{tool_name}", None)
        if not method:
            return {"error": f"Tool {tool_name} not found"}
        return method(**arguments)

    def tool_get_repository_tree(self) -> List[str]:
        """Returns a simplified directory tree of the repository."""
        tree = []
        for path in self.repo_path.rglob("*"):
            if not any(part in path.parts for part in [".git", "node_modules", "dist", "build"]):
                tree.append(str(path.relative_to(self.repo_path)))
        return tree

    def tool_read_file(self, path: str) -> str:
        """Reads the content of a specific file."""
        full_path = self.repo_path / path
        if not full_path.exists():
            return "Error: File not found"
        try:
            return full_path.read_text(errors='ignore')
        except Exception as e:
            return f"Error reading file: {str(e)}"

    def tool_list_symbols(self, file_path: Optional[str] = None) -> List[Dict[str, str]]:
        """Lists symbols (classes, functions) in the repo or a specific file."""
        symbols = []
        for entity in self.graph.entities.values():
            if entity.type in ["class", "function"]:
                if file_path and entity.path != file_path:
                    continue
                symbols.append({"name": entity.name, "type": entity.type, "path": entity.path or ""})
        return symbols

    def tool_find_references(self, symbol_name: str) -> List[str]:
        """Finds all files that reference a specific symbol name."""
        references = []
        for file_path in self.repo_path.rglob("*"):
            if file_path.is_file() and not any(part in file_path.parts for part in [".git", "node_modules"]):
                try:
                    if symbol_name in file_path.read_text(errors='ignore'):
                        references.append(str(file_path.relative_to(self.repo_path)))
                except:
                    continue
        return references

    def tool_query_knowledge_graph(self, entity_id: str) -> Dict[str, Any]:
        """Queries the Knowledge Graph for an entity and its immediate relationships."""
        return self.graph.get_entity_context(entity_id)

    def tool_get_module_summary(self, path: str) -> Dict[str, Any]:
        """Returns a summary of a module's structural role."""
        # Naive summary: list types of symbols it contains
        symbols = self.tool_list_symbols(path)
        return {
            "path": path,
            "total_symbols": len(symbols),
            "classes": len([s for s in symbols if s["type"] == "class"]),
            "functions": len([s for s in symbols if s["type"] == "function"]),
        }

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Returns JSON definitions for the LLM to use for tool calling."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_repository_tree",
                    "description": "Get the full file tree of the repository",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Read the contents of a file by its relative path",
                    "parameters": {
                        "type": "object", 
                        "properties": {"path": {"type": "string", "description": "Relative path to the file"}},
                        "required": ["path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_symbols",
                    "description": "List classes and functions in the repository",
                    "parameters": {
                        "type": "object", 
                        "properties": {"file_path": {"type": "string", "description": "Optional filter by file path"}}
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "find_references",
                    "description": "Find all occurrences of a symbol name across the repo",
                    "parameters": {
                        "type": "object", 
                        "properties": {"symbol_name": {"type": "string"}},
                        "required": ["symbol_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "query_knowledge_graph",
                    "description": "Get detailed context and relationships for a specific entity ID",
                    "parameters": {
                        "type": "object", 
                        "properties": {"entity_id": {"type": "string"}},
                        "required": ["entity_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_module_summary",
                    "description": "Get a structural summary of a specific file or module",
                    "parameters": {
                        "type": "object", 
                        "properties": {"path": {"type": "string"}},
                        "required": ["path"]
                    }
                }
            }
        ]
