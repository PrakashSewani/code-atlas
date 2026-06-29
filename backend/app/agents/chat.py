import json
import re
import asyncio
from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.core.config import settings
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.CEREBRAS_API_KEY, base_url=settings.CEREBRAS_BASE_URL)


class ChatAgent(BaseAgent):
    """
    Interactive Chat Agent that analyzes the repository and gives direct answers.
    """

    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        user_message = context.get("message", "")
        repo_name = context.get("repo_name", "unknown")

        # Gather context from tools first
        tool_context = await self._gather_context(user_message, repo_name)

        system_prompt = f"""You are CodeAtlas AI, an expert software engineer analyzing the repository "{repo_name}".

RULES:
- Give DIRECT, CONCISE answers. Never say "I will check" or "Would you like me to proceed?"
- Answer the question immediately based on the context provided below.
- Use bullet points and markdown for readability.
- If you found relevant code, quote it briefly.
- If you cannot find the answer, say so clearly and suggest what to look for.
- Never output tool calls or thinking process. Just give the answer.

REPOSITORY CONTEXT:
{tool_context}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        try:
            response = await client.chat.completions.create(
                model=settings.GEMMA_MODEL,
                messages=messages,
                max_tokens=1500
            )

            content = response.choices[0].message.content or ""

            # Clean up any tool call text or thinking artifacts
            content = re.sub(r'call:\w+\{[^}]*\}', '', content)
            content = re.sub(r'call:\w+', '', content)
            content = re.sub(r'\*\(.*?\)\*', '', content)  # Remove *(Self-correction: ...)* patterns
            content = re.sub(r'\*\*Step \d+.*?\*\*', '', content)  # Remove **Step 1:** patterns
            content = content.strip()

            if not content or len(content) < 20:
                return {"response": self._get_direct_answer(user_message, repo_name, tool_context)}

            return {"response": content}

        except Exception as e:
            return {"response": self._get_direct_answer(user_message, repo_name, tool_context)}

    async def _gather_context(self, user_message: str, repo_name: str) -> str:
        """Run tools to gather actual code context."""
        context_parts = []
        message_lower = user_message.lower()

        try:
            # Always get repo tree
            tree = self.tools.execute("get_repository_tree", {})
            if isinstance(tree, list):
                tree_str = "\n".join(tree[:80])
                if len(tree) > 80:
                    tree_str += f"\n... ({len(tree)} total files)"
                context_parts.append(f"FILE TREE:\n{tree_str}")
        except Exception:
            pass

        # Search for relevant files based on question keywords
        keywords = self._extract_keywords(message_lower)
        relevant_files = []

        try:
            tree = self.tools.execute("get_repository_tree", {})
            if isinstance(tree, list):
                for f in tree:
                    f_lower = f.lower()
                    if any(kw in f_lower for kw in keywords):
                        relevant_files.append(f)
        except Exception:
            pass

        # Read relevant files (up to 5)
        for f in relevant_files[:5]:
            try:
                content = self.tools.execute("read_file", {"path": f})
                if isinstance(content, str) and not content.startswith("Error"):
                    # Truncate long files
                    if len(content) > 2000:
                        content = content[:2000] + "\n... (truncated)"
                    context_parts.append(f"\n--- FILE: {f} ---\n{content}")
            except Exception:
                pass

        # Get symbols if asking about code structure
        if any(word in message_lower for word in ['class', 'function', 'method', 'api', 'endpoint', 'route', 'controller']):
            try:
                symbols = self.tools.execute("list_symbols", {})
                if isinstance(symbols, list) and symbols:
                    symbol_str = "\n".join([
                        f"- {s.get('name', '?')} ({s.get('type', '?')}) in {s.get('path', '?')}"
                        for s in symbols[:40]
                    ])
                    context_parts.append(f"\nCODE SYMBOLS:\n{symbol_str}")
            except Exception:
                pass

        return "\n".join(context_parts) if context_parts else "No context gathered."

    def _extract_keywords(self, message: str) -> List[str]:
        """Extract relevant search keywords from user message."""
        # Remove common stop words and extract meaningful terms
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                      'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
                      'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                      'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
                      'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
                      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
                      'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
                      'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
                      'don', 'now', 'and', 'but', 'or', 'if', 'this', 'that', 'these',
                      'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him',
                      'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
                      'which', 'who', 'whom', 'repository', 'repo', 'code', 'file', 'does',
                      'have', 'any', 'anyone', 'there', 'look', 'check', 'find', 'tell',
                      'about', 'show', 'want', 'know'}

        words = re.findall(r'\b[a-z_]+\b', message)
        keywords = [w for w in words if w not in stop_words and len(w) > 2]

        # Add specific patterns
        if 'admin' in message:
            keywords.extend(['admin', 'role', 'permission', 'authorization', 'auth', 'policy'])
        if 'auth' in message:
            keywords.extend(['auth', 'login', 'token', 'jwt', 'session', 'user'])
        if 'api' in message or 'endpoint' in message:
            keywords.extend(['controller', 'route', 'endpoint', 'api'])
        if 'database' in message or 'schema' in message:
            keywords.extend(['migration', 'schema', 'entity', 'model', 'db'])
        if 'test' in message:
            keywords.extend(['test', 'spec', 'mock'])
        if 'config' in message or 'setting' in message:
            keywords.extend(['config', 'setting', 'env', 'environment'])

        return list(set(keywords))

    def _get_direct_answer(self, user_message: str, repo_name: str, context: str) -> str:
        """Generate a direct answer based on gathered context."""
        message_lower = user_message.lower()

        # Extract file names from context
        files_in_context = re.findall(r'--- FILE: (.+?) ---', context)

        if 'admin' in message_lower and ('role' in message_lower or 'permission' in message_lower):
            answer = f"**Admin Roles in {repo_name}:**\n\n"

            # Check for auth-related files
            auth_files = [f for f in files_in_context if any(x in f.lower() for x in ['auth', 'role', 'permission', 'policy', 'admin'])]
            if auth_files:
                answer += f"Found {len(auth_files)} relevant files:\n"
                for f in auth_files:
                    answer += f"- `{f}`\n"
                answer += "\nBased on the files examined, "
                if any('role' in f.lower() for f in auth_files):
                    answer += "the repository appears to have role-based access control."
                elif any('auth' in f.lower() for f in auth_files):
                    answer += "authentication logic exists but specific admin roles need deeper inspection."
                else:
                    answer += "authorization-related code was found. Check the files above for role definitions."
            else:
                answer += "No role or permission files were found in the immediate search.\n"
                answer += "The repository may use a different authorization pattern (e.g., policy-based, claims-based)."

            return answer

        if files_in_context:
            return f"Based on analysis of {repo_name}, I found {len(files_in_context)} relevant files:\n\n" + \
                   "\n".join(f"- `{f}`" for f in files_in_context) + \
                   "\n\nPlease ask a specific question about these files for a detailed answer."

        return f"I analyzed {repo_name} but couldn't find specific information for your question. " + \
               "Please try rephrasing or ask about a specific file or feature."
