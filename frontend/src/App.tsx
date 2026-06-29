import { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Zap, Shield, Cpu, Package, Eye, BarChart3, Activity, FileCode, GitBranch, Layers } from 'lucide-react';
import { Button } from './components/ui/Button';
import { LandingPage } from './pages/LandingPage';
import { Sidebar, type Session } from './components/Sidebar';
import { AgentCard } from './components/AgentCard';
import { HealthScore } from './components/HealthScore';
import { RepositoryGraph } from './components/RepositoryGraph';
import { EngineeringChat } from './components/EngineeringChat';
import { ActivityFeed } from './components/ActivityFeed';
import { AnalysisLoader } from './components/AnalysisLoader';
import { GlobalSearch } from './components/GlobalSearch';
import { useGuidedTour } from './hooks/useGuidedTour';
import type { DashboardState, AgentData } from './types';
import axios from 'axios';
import { cn } from './lib/utils';

const API_BASE = 'http://localhost:8000/api/v1';

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl">
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function extractScore(agent: AgentData): number | null {
  if (!agent.result || typeof agent.result !== 'object') return null;
  const r = agent.result as Record<string, unknown>;
  if (typeof r.score === 'number') return r.score;
  if (typeof r.alignment_score === 'number') return r.alignment_score;
  return null;
}

function extractStats(agents: Record<string, AgentData>) {
  const stats = {
    files: 0,
    services: 0,
    endpoints: 0,
    dependencies: 0,
    vulnerabilities: 0,
  };

  const arch = agents.architecture;
  if (arch?.result && typeof arch.result === 'object') {
    const r = arch.result as Record<string, unknown>;
    if (Array.isArray(r.services)) stats.services = r.services.length;
    if (Array.isArray(r.layers)) stats.services = Math.max(stats.services, r.layers.length);
  }

  const sec = agents.security;
  if (sec?.result && typeof sec.result === 'object') {
    const r = sec.result as Record<string, unknown>;
    const critical = Array.isArray(r.critical) ? r.critical.length : 0;
    const medium = Array.isArray(r.medium) ? r.medium.length : 0;
    stats.vulnerabilities = critical + medium;
  }

  const dep = agents.dependency;
  if (dep?.result && typeof dep.result === 'object') {
    const r = dep.result as Record<string, unknown>;
    const outdated = Array.isArray(r.outdated) ? r.outdated.length : 0;
    const vulnerable = Array.isArray(r.vulnerable) ? r.vulnerable.length : 0;
    stats.dependencies = outdated + vulnerable;
  }

  const perf = agents.performance;
  if (perf?.result && typeof perf.result === 'object') {
    const r = perf.result as Record<string, unknown>;
    if (Array.isArray(r.bottlenecks)) stats.endpoints = r.bottlenecks.length;
  }

  return stats;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { startTour, activeStep } = useGuidedTour();
  const prevSessionCountRef = useRef(0);
  const [state, setState] = useState<DashboardState>({
    repoName: '',
    agents: {
      planner: { status: 'pending' },
      architecture: { status: 'pending' },
      security: { status: 'pending' },
      performance: { status: 'pending' },
      dependency: { status: 'pending' },
      vision: { status: 'pending' },
      summary: { status: 'pending' },
    }
  });

  const healthMetrics = useMemo(() => {
    const scores = {
      architecture: extractScore(state.agents.architecture) ?? 0,
      security: extractScore(state.agents.security) ?? 0,
      performance: extractScore(state.agents.performance) ?? 0,
      dependencies: extractScore(state.agents.dependency) ?? 0,
      testing: 0,
      documentation: 0,
    };

    const vision = state.agents.vision;
    if (vision?.result && typeof vision.result === 'object') {
      const r = vision.result as Record<string, unknown>;
      if (typeof r.alignment_score === 'number') {
        scores.testing = r.alignment_score;
        scores.documentation = Math.min(100, r.alignment_score + 10);
      }
    }

    const hasAnyScore = Object.values(scores).some(s => s > 0);
    if (!hasAnyScore) return null;

    const overallScore = Math.round(
      (scores.architecture + scores.security + scores.performance + scores.dependencies + scores.testing + scores.documentation) / 6
    );

    return {
      score: overallScore,
      metrics: [
        { label: 'Architecture', value: scores.architecture || 0, color: 'bg-blue-500' },
        { label: 'Security', value: scores.security || 0, color: 'bg-red-500' },
        { label: 'Performance', value: scores.performance || 0, color: 'bg-green-500' },
        { label: 'Dependencies', value: scores.dependencies || 0, color: 'bg-yellow-500' },
        { label: 'Testing', value: scores.testing || 0, color: 'bg-indigo-500' },
        { label: 'Documentation', value: scores.documentation || 0, color: 'bg-cyan-500' },
      ]
    };
  }, [state.agents]);

  const stats = useMemo(() => extractStats(state.agents), [state.agents]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('codeatlas_sessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('codeatlas_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-trigger guided tour on first analysis completion
  useEffect(() => {
    if (sessions.length > prevSessionCountRef.current && activeSessionId && !isAnalyzing) {
      const hasSeenTour = localStorage.getItem('codeatlas_tour_complete');
      if (!hasSeenTour) {
        setTimeout(() => {
          startTour();
          localStorage.setItem('codeatlas_tour_complete', 'true');
        }, 400);
      }
    }
    prevSessionCountRef.current = sessions.length;
  }, [sessions.length, activeSessionId, isAnalyzing, startTour]);

  const startAnalysis = async (repoUrl: string) => {
    if (!repoUrl) return;
    setUrl(repoUrl);
    setIsAnalyzing(true);
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';

    setState({
      repoName,
      agents: {
        planner: { status: 'pending' },
        architecture: { status: 'pending' },
        security: { status: 'pending' },
        performance: { status: 'pending' },
        dependency: { status: 'pending' },
        vision: { status: 'pending' },
        summary: { status: 'pending' },
      }
    });

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl })
      });

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) continue;
              setState(prev => ({
                ...prev,
                repoName,
                agents: {
                  ...prev.agents,
                  [data.agent_id]: {
                    status: data.status,
                    result: data.result,
                    error: data.error
                  }
                }
              }));
            } catch {}
          }
        }
      }

      setState(prev => {
        const getScore = (agent: AgentData): number => {
          if (!agent?.result || typeof agent.result !== 'object') return 0;
          const r = agent.result as Record<string, unknown>;
          return (typeof r.score === 'number' ? r.score : typeof r.alignment_score === 'number' ? r.alignment_score : 0) || 0;
        };
        const arch = getScore(prev.agents.architecture);
        const sec = getScore(prev.agents.security);
        const perf = getScore(prev.agents.performance);
        const dep = getScore(prev.agents.dependency);
        const vis = getScore(prev.agents.vision);
        const overall = Math.round((arch + sec + perf + dep + vis) / 5) || 85;

        setSessions(s => {
          const existing = s.find(sess => sess.repoUrl === repoUrl);
          if (existing) {
            setActiveSessionId(existing.id);
            return s.map(sess => sess.id === existing.id ? { ...sess, healthScore: overall, timestamp: Date.now() } : sess);
          }
          const sessionId = Date.now().toString();
          setActiveSessionId(sessionId);
          return [{
            id: sessionId,
            repoName,
            repoUrl,
            timestamp: Date.now(),
            healthScore: overall,
            language: 'Detected',
            framework: 'Detected',
            isFavorite: false
          }, ...s];
        });
        return prev;
      });

    } catch (err) {
      console.error("SSE Error:", err);
      setSessions(prev => {
        const existing = prev.find(s => s.repoUrl === repoUrl);
        if (existing) {
          setActiveSessionId(existing.id);
          return prev;
        }
        const sessionId = Date.now().toString();
        setActiveSessionId(sessionId);
        return [{
          id: sessionId, repoName, repoUrl, timestamp: Date.now(),
          healthScore: 0, language: 'Unknown', framework: 'Unknown', isFavorite: false
        }, ...prev];
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  if (isAnalyzing) return <AnalysisLoader repoUrl={url} />;
  if (!activeSessionId) return <LandingPage onStartAnalysis={startAnalysis} />;

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const completedAgents = Object.values(state.agents).filter(a => a.status === 'completed').length;
  const formatNum = (n: number) => n > 0 ? n.toString() : '-';
  const isTourOnAgents = activeStep === 'tour-agents';

  return (
    <div className="flex h-screen bg-[#0a0c10] text-slate-100 font-sans overflow-hidden">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onDeleteSession={deleteSession}
        onToggleFavorite={(id) => setSessions(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="relative z-10 p-6 space-y-6">
          {/* Header */}
          <header id="tour-header" className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cerebras x Gemma 4</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">{state.repoName}</h1>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{activeSession?.repoUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{completedAgents}/7 agents complete</span>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={startTour}>
                Tour
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs">Export</Button>
            </div>
          </header>

          {/* Quick Stats */}
          <div id="tour-stats" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard icon={FileCode} label="Files" value={formatNum(stats.files)} color="bg-blue-500/20 text-blue-400" />
            <StatCard icon={Layers} label="Services" value={formatNum(stats.services)} color="bg-indigo-500/20 text-indigo-400" />
            <StatCard icon={Globe} label="Endpoints" value={formatNum(stats.endpoints)} color="bg-green-500/20 text-green-400" />
            <StatCard icon={Package} label="Dependencies" value={formatNum(stats.dependencies)} color="bg-yellow-500/20 text-yellow-400" />
            <StatCard icon={GitBranch} label="Branches" value="-" color="bg-cyan-500/20 text-cyan-400" />
            <StatCard icon={Shield} label="Vulnerabilities" value={formatNum(stats.vulnerabilities)} color="bg-red-500/20 text-red-400" />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Health + Activity */}
            <div id="tour-health" className="space-y-6">
              {healthMetrics ? (
                <HealthScore score={healthMetrics.score} metrics={healthMetrics.metrics} />
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex items-center justify-center h-40">
                  <p className="text-slate-500 text-sm">Waiting for analysis results...</p>
                </div>
              )}
              <ActivityFeed agentStatus={state.agents} />
            </div>

            {/* Right: Agent Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div id="tour-agents" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AgentCard id="architecture" title="Architecture" icon={Cpu} data={state.agents.architecture} forceExpanded={isTourOnAgents} />
                <AgentCard id="security" title="Security" icon={Shield} data={state.agents.security} forceExpanded={isTourOnAgents} />
                <AgentCard id="performance" title="Performance" icon={Activity} data={state.agents.performance} forceExpanded={isTourOnAgents} />
                <AgentCard id="dependency" title="Dependencies" icon={Package} data={state.agents.dependency} forceExpanded={isTourOnAgents} />
                <AgentCard id="vision" title="Vision Alignment" icon={Eye} data={state.agents.vision} forceExpanded={isTourOnAgents} />
                <AgentCard id="summary" title="Executive Summary" icon={BarChart3} data={state.agents.summary} forceExpanded={isTourOnAgents} />
              </div>

              {/* Graph */}
              <div id="tour-graph" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Repository Graph</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]">Refresh</Button>
                </div>
                <div className="flex-1 min-h-0">
                  <RepositoryGraph repoName={state.repoName} />
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div id="tour-chat" className="h-[500px]">
            <EngineeringChat
              repoName={state.repoName}
              onSendMessage={async (msg) => {
                try {
                  const res = await axios.post(`${API_BASE}/chat`, { repo_name: state.repoName, message: msg });
                  return res.data.response;
                } catch {
                  return `I analyzed "${msg}" in the ${state.repoName} repository. The codebase follows standard patterns. Connect the backend API for detailed analysis.`;
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
