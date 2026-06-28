export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface AgentResult {
  status: AgentStatus;
  result?: any;
  error?: string;
}

export interface DashboardState {
  repoName: string;
  agents: Record<string, AgentResult>;
  summary?: any;
}
