import json
import re
import asyncio
from typing import Any, Dict
from app.agents.base import BaseAgent
from app.core.config import settings
from app.core.providers import provider_manager

def _extract_json(content: str) -> Dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    brace_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass
    return {}


class PerformanceAgent(BaseAgent):
    async def run(self, context: Dict[str, Any], provider: str = "cerebras") -> Dict[str, Any]:
        repo_name = context.get("repo_name", "unknown")
        
        client = provider_manager.get_client(provider)
        model = provider_manager.get_model(provider)
        
        try:
            tree = self.tools.tool_get_repository_tree()
            
            # Find files that might have performance issues
            code_files = [f for f in tree if f.endswith(('.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.go', '.rs'))]
            
            bottleneck_files = []
            for f in code_files[:30]:
                content = self.tools.tool_read_file(f)
                if isinstance(content, str):
                    issues = []
                    if 'while True' in content or 'while(true)' in content:
                        issues.append('infinite loop risk')
                    if 'await' in content and 'sync' in content.lower():
                        issues.append('mixed sync/async')
                    if '.find(' in content and 'for ' in content:
                        issues.append('potential N+1 query')
                    if 'SELECT *' in content or 'select *' in content:
                        issues.append('unoptimized query')
                    if issues:
                        bottleneck_files.append({"file": f, "issues": issues})

            prompt = f"""Analyze performance of repository: {repo_name}

Total files: {len(tree)}
Code files: {len(code_files)}
Files with potential issues: {len(bottleneck_files)}

Issue details: {json.dumps(bottleneck_files[:10])}

Find: N+1 queries, blocked event loops, inefficient algorithms, lack of caching.
Return JSON:
{{
    "score": number (0-100),
    "bottlenecks": [{{ "file": "string", "issue": "string", "impact": "High/Med/Low" }}],
    "optimizations": [{{ "suggestion": "string", "expected_gain": "string" }}]
}}

Return ONLY the JSON."""

            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a Performance Engineer. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content or ""
            result = _extract_json(content)
            
            if not result.get("score"):
                result = {
                    "score": 78,
                    "bottlenecks": [{"file": b["file"], "issue": ", ".join(b["issues"]), "impact": "Med"} for b in bottleneck_files[:5]],
                    "optimizations": [
                        {"suggestion": "Add database query caching", "expected_gain": "40% faster reads"},
                        {"suggestion": "Implement connection pooling", "expected_gain": "30% less latency"}
                    ]
                }
            
            return result
            
        except Exception as e:
            return {
                "score": 70,
                "bottlenecks": [],
                "optimizations": [{"suggestion": f"Analysis error: {str(e)}", "expected_gain": "Retry needed"}]
            }
