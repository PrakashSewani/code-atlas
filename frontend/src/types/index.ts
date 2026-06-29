export type AgentStatus = 'pending' | 'in_progress' | 'running' | 'completed' | 'failed' | 'error';

export interface AgentData {
  status: AgentStatus;
  result?: unknown;
  error?: string;
}

export interface DashboardState {
  repoName: string;
  agents: Record<string, AgentData>;
}

export interface AgentResult {
  agent_id: string;
  status: AgentStatus;
  result?: unknown;
  error?: string;
}
