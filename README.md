# 🚀 CodeAtlas AI: Engineering Intelligence Platform

CodeAtlas AI is not just another AI chatbot. It is a high-performance AI Engineering Organization designed to transform repository onboarding and technical auditing from days into seconds.

Built for the **Cerebras × Google DeepMind Gemma 4 Hackathon**, CodeAtlas leverages the ultra-fast inference of **Gemma 4 31B on Cerebras** to run multiple AI engineering specialists in parallel.

## 🌟 The Vision
Instead of waiting for a single LLM to process a codebase sequentially, CodeAtlas simulates a full engineering team. A **Planner Agent** analyzes the project and dispatches a squad of specialists who execute independently and simultaneously.

**The result?** A live engineering dashboard that populates in real-time, providing a comprehensive health report across architecture, security, performance, and dependencies almost instantly.

---

## 🛠️ Architecture & Core Components

### 1. Repository Intelligence Engine
The heart of the system. It parses a repository **once** to create a structured **Knowledge Graph**.
- **Cloner**: Efficiently clones and strips noise (`node_modules`, `.git`, etc.).
- **Parser**: Extracts symbols (classes, functions) and maps imports/dependencies.
- **Knowledge Graph**: A `NetworkX` based graph that serves as the shared memory for all agents.

### 2. The AI Specialist Squad
Every agent uses **Tool Calling** to ground their analysis in actual code and returns **Structured JSON** for the dashboard.

- **Planner Agent**: Detects frameworks and decides which specialists to deploy.
- **Architecture Agent**: Analyzes layering, design patterns, and structural boundaries.
- **Security Agent**: Audits for JWT leaks, SQL injection, and hardcoded secrets.
- **Performance Agent**: Identifies N+1 queries, async bottlenecks, and caching gaps.
- **Dependency Agent**: Checks for outdated, redundant, or vulnerable packages.
- **Vision Agent**: Compares architecture diagrams/screenshots against the actual code.
- **Summary Agent**: Aggregates all findings into an Executive Health Score.

### 3. Real-time Dashboard
A high-fidelity React interface that streams updates via **Server-Sent Events (SSE)**.
- **Parallel Streaming**: Cards update independently as agents finish.
- **Interactive Graph**: Visual exploration of the repository's structural dependencies.
- **Intelligence Chat**: A grounded chat interface that queries the Knowledge Graph via tools.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Cerebras API Key

### Installation & Execution

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
export CEREBRAS_API_KEY="your_api_key_here"
uvicorn app.main:app --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Usage
1. Navigate to the local Vite URL (e.g., `http://localhost:5173`).
2. Paste a **GitHub Repository URL**.
3. Click **Analyze Repo**.
4. Watch the specialist agents collaborate in parallel.
5. Use the **Intelligence Chat** to explore the codebase.

---

## ⚡ Why Cerebras + Gemma 4?
CodeAtlas demonstrates that **inference speed is a product feature**. By removing the latency bottleneck, we can:
- Run 6+ agents in parallel without the user feeling a delay.
- Implement complex tool-calling loops for deep codebase exploration.
- Provide a "Live" experience where the UI feels like a real-time scan rather than a loading screen.
