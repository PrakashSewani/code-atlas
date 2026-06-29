# CodeAtlas AI Architecture

## System Overview

CodeAtlas AI is an Engineering Intelligence Platform that uses a multi-agent system to analyze repositories. It features an automatic side-by-side benchmark between Cerebras and Xiaomi MiMo providers.

### Core Components

1. **Repository Intelligence Engine**: Handles cloning, parsing, and Knowledge Graph generation. Runs once per repository.
2. **Planner Agent**: Detects frameworks and decides which specialists to deploy.
3. **Specialist Agents**: Architecture, Security, Performance, Dependencies, Vision. Each runs on both providers simultaneously.
4. **Summary Agent**: Aggregates findings into a high-level health report.
5. **Provider Manager**: Manages AsyncOpenAI clients for Cerebras and MiMo, ensuring identical prompts and configurations.
6. **Live Dashboard**: React frontend with live race visualization, agent cards, and benchmark metrics.

## Data Flow

```
Repository URL
    |
    v
Clone (one-time)
    |
    v
Parse + Knowledge Graph (one-time)
    |
    v
START BENCHMARK TIMER
    |
    +---> Cerebras Agent Squad (parallel)
    |
    +---> MiMo Agent Squad (parallel)
    |
    v
Live Stream (SSE) ---> Dashboard + Live Race UI
    |
    v
STOP TIMER ---> Final Metrics + Speedup
```

## Benchmark Architecture

### Parallel Execution Model

Each agent executes concurrently on both providers:

```
Architecture Agent
    |---> Cerebras Request ---> Duration A
    |---> MiMo Request     ---> Duration B

Security Agent
    |---> Cerebras Request ---> Duration C
    |---> MiMo Request     ---> Duration D

... (all agents race simultaneously)
```

### Timing Scope

The benchmark timer measures only:
- LLM inference time
- Agent execution time
- Structured output generation time

It excludes:
- Repository cloning
- File parsing
- Knowledge graph construction
- Repository indexing

### State Management

Frontend agent state structure:
```typescript
{
  status: 'completed',          // Top-level (synced from fastest provider)
  result: { score: 85, ... },   // Top-level (Cerebras result as primary)
  cerebras: {
    status: 'completed',
    result: { score: 85, ... },
    duration: 0.61
  },
  mimo: {
    status: 'completed',
    result: { score: 82, ... },
    duration: 2.43
  }
}
```

### Failure Handling

- If MiMo fails: Cerebras analysis continues, MiMo row shows error state
- If Cerebras fails: MiMo analysis continues, Cerebras row shows error state
- Analysis never fails due to a single provider issue

## Technology Stack

- **Backend**: Python, FastAPI, GitPython, NetworkX, OpenAI SDK
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Providers**: Cerebras (Gemma 4 31B), Xiaomi MiMo (mimo-v2.5-pro)
- **Communication**: Server-Sent Events (SSE) for real-time streaming
