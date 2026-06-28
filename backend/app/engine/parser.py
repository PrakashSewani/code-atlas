import os
from pathlib import Path
from typing import List, Tuple
import re
from app.engine.graph import RepositoryGraph, Entity

class RepoParser:
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.graph = RepositoryGraph()

    def parse(self) -> RepositoryGraph:
        """
        Main entry point for parsing the repository.
        """
        # 1. Scan files and create file nodes
        self._index_files()
        
        # 2. Extract structural info (simple regex-based for now, tree-sitter later)
        self._extract_symbols()
        
        # 3. Resolve imports/dependencies
        self._resolve_dependencies()
        
        return self.graph

    def _index_files(self):
        """
        Traverses the repository and adds all relevant files to the graph.
        """
        # Basic exclusion patterns
        exclude_patterns = {'.git', 'node_modules', '__pycache__', 'dist', 'build'}
        
        for root, dirs, files in os.walk(self.repo_path):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in exclude_patterns]
            
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(self.repo_path)
                
                entity = Entity(
                    id=f"file:{rel_path}",
                    type="file",
                    name=file,
                    path=str(rel_path)
                )
                self.graph.add_entity(entity)

    def _extract_symbols(self):
        """
        Extracts classes and functions from files. 
        Using simplified regex for initial implementation.
        """
        for entity_id, entity in self.graph.entities.items():
            if entity.type != "file":
                continue
                
            file_path = self.repo_path / entity.path
            try:
                content = file_path.read_text(errors='ignore')
                
                # Detect Python classes/functions
                if file_path.suffix == '.py':
                    # Simple Class detection
                    for match in re.finditer(r'class\s+(\w+)', content):
                        name = match.group(1)
                        symbol_id = f"symbol:{entity_id}:{name}"
                        self.graph.add_entity(Entity(
                            id=symbol_id,
                            type="class",
                            name=name,
                            path=entity.path
                        ))
                        self.graph.add_relationship(entity_id, symbol_id, "defines")

                    # Simple Function detection
                    for match in re.finditer(r'def\s+(\w+)\(', content):
                        name = match.group(1)
                        symbol_id = f"symbol:{entity_id}:{name}"
                        self.graph.add_entity(Entity(
                            id=symbol_id,
                            type="function",
                            name=name,
                            path=entity.path
                        ))
                        self.graph.add_relationship(entity_id, symbol_id, "defines")

                # Detect JS/TS classes/functions
                elif file_path.suffix in ['.js', '.ts', '.tsx']:
                    # Classes
                    for match in re.finditer(r'class\s+(\w+)', content):
                        name = match.group(1)
                        symbol_id = f"symbol:{entity_id}:{name}"
                        self.graph.add_entity(Entity(
                            id=symbol_id,
                            type="class",
                            name=name,
                            path=entity.path
                        ))
                        self.graph.add_relationship(entity_id, symbol_id, "defines")

                    # Functions/Constants
                    for match in re.finditer(r'(?:export\s+)?(?:const|let|function)\s+(\w+)', content):
                        name = match.group(1)
                        symbol_id = f"symbol:{entity_id}:{name}"
                        self.graph.add_entity(Entity(
                            id=symbol_id,
                            type="function",
                            name=name,
                            path=entity.path
                        ))
                        self.graph.add_relationship(entity_id, symbol_id, "defines")

            except Exception as e:
                print(f"Error parsing {file_path}: {e}")

    def _resolve_dependencies(self):
        """
        Analyzes imports to create relationships between files.
        """
        for entity_id, entity in self.graph.entities.items():
            if entity.type != "file":
                continue
                
            file_path = self.repo_path / entity.path
            try:
                content = file_path.read_text(errors='ignore')
                
                # Python imports: from x import y or import x
                if file_path.suffix == '.py':
                    for match in re.finditer(r'^(?:from\s+([\w\.]+)\s+import|import\s+([\w\.,\s]+))', content, re.MULTILINE):
                        module_name = match.group(1) or match.group(2).split(',')[0].strip()
                        # Try to find a file that matches this module name
                        self._link_module_to_file(entity_id, module_name)

                # JS/TS imports: import x from 'y'
                elif file_path.suffix in ['.js', '.ts', '.tsx']:
                    for match in re.finditer(r'import\s+.*\s+from\s+[\'"](.+)[\'"]', content):
                        import_path = match.group(1)
                        self._link_module_to_file(entity_id, import_path)

            except Exception as e:
                print(f"Error resolving deps for {file_path}: {e}")

    def _link_module_to_file(self, source_id: str, module_name: str):
        """
        Attempts to link a module name or relative path to an existing file node.
        """
        # This is a naive implementation. A production version would handle 
        # path resolution, aliases, and package lookups.
        for entity_id, entity in self.graph.entities.items():
            if entity.type == "file":
                if module_name in entity.path or entity.name.startswith(module_name):
                    self.graph.add_relationship(source_id, entity_id, "imports")
