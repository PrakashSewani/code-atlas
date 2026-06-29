# CodeAtlas AI: Engineering Intelligence Platform

CodeAtlas AI is a high-performance AI Engineering Organization designed to transform repository onboarding and technical auditing from days into seconds.

Built for the **Cerebras x Google DeepMind Gemma 4 Hackathon**, CodeAtlas leverages the ultra-fast inference of **Gemma 4 31B on Cerebras** to run multiple AI engineering specialists in parallel.

## The Vision

Instead of waiting for a single LLM to process a codebase sequentially, CodeAtlas simulates a full engineering team. A **Planner Agent** analyzes the project and dispatches a squad of specialists who execute independently and simultaneously.

**The result?** A live engineering dashboard that populates in real-time, providing a comprehensive health report across architecture, security, performance, and dependencies almost instantly.

---

## Live Provider Benchmark

CodeAtlas automatically runs a **side-by-side benchmark** between Cerebras and Xiaomi MiMo during every repository analysis. Zero user interaction required.

### How It Works

1. Repository is cloned, parsed, and indexed **once**.
2. Benchmark timer starts.
3. Every agent (Architecture, Security, Performance, Dependencies, Vision) launches **simultaneously** on both providers.
4. Results stream live to a **race dashboard** showing per-agent durations, winner badges, and overall speedup.

### Benchmark Metrics

| Metric | Description |
|--------|-------------|
| Per-Agent Duration | Time from API request to structured response for each agent |
| Winner Badge | Crown icon on the faster provider's result |
| Speedup | Overall ratio of MiMo time to Cerebras time |
| Time Saved | Absolute seconds saved by using the faster provider |

### Prompt Consistency

Both providers receive identical:
- System prompts
- User prompts
- Repository context and Knowledge Graph
- Structured output schemas
- Temperature and max token configuration

The only difference is the API endpoint.

### Failure Handling

If one provider fails or times out, the other continues uninterrupted. The analysis never fails because of a single provider issue.

---

## Architecture & Core Components

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
- **Live Race**: Side-by-side provider comparison with real-time duration tracking.
- **Interactive Graph**: Visual exploration of the repository's structural dependencies.
- **Intelligence Chat**: A grounded chat interface that queries the Knowledge Graph via tools.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Cerebras API Key
- Xiaomi MiMo API Key (optional, for benchmark comparison)

### Installation & Execution

#### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
CEREBRAS_API_KEY=your_cerebras_key
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
GEMMA_MODEL=gemma-4-31b

MIMO_API_KEY=your_mimo_key
MIMO_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Usage

1. Navigate to `http://localhost:5173`.
2. Paste a **GitHub Repository URL**.
3. Click **Analyze Repo**.
4. Watch the loader progress through cloning, parsing, and knowledge graph construction.
5. The dashboard appears with live agent results and the **provider race** updating in real-time.
6. Use the **Intelligence Chat** to explore the codebase.

---

## Session Persistence

Every analysis is saved as a session in the browser. When reopening a previous repository, the full benchmark comparison displays immediately without re-running the analysis.

---

## Why Cerebras + Gemma 4?

CodeAtlas demonstrates that **inference speed is a product feature**. By removing the latency bottleneck, we can:

- Run 6+ agents in parallel without the user feeling a delay.
- Implement complex tool-calling loops for deep codebase exploration.
- Provide a "Live" experience where the UI feels like a real-time scan rather than a loading screen.
- Benchmark providers side-by-side on identical workloads to quantify the speed advantage.
