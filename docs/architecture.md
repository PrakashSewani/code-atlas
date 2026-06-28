# CodeAtlas AI Architecture

## System Overview
CodeAtlas AI is an Engineering Intelligence Platform that uses a multi-agent system to analyze repositories.

### Core Components
1. **Repository Intelligence Engine**: Handles cloning, parsing, and Knowledge Graph generation.
2. **Planner Agent**: Orchestrates the execution of specialist agents.
3. **Specialist Agents**: (Security, Architecture, Performance, etc.) perform deep dives using tools.
4. **Summary Agent**: Aggregates findings into a high-level health report.
5. **Live Dashboard**: A React-based frontend that streams agent results in real-time.

## Data Flow
Repository URL $\rightarrow$ Intelligence Engine $\rightarrow$ Knowledge Graph $\rightarrow$ Planner $\rightarrow$ Parallel Agents $\rightarrow$ Structured JSON $\rightarrow$ Dashboard
