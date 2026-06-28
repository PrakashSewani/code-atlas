import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Terminal, Activity, Globe, Zap } from 'lucide-react';
import { AgentCard } from './components/AgentCard';
import { DashboardState, AgentResult } from './types';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export default function Dashboard() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  const startAnalysis = async () => {
    if (!repoUrl) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              console.error("Analysis error:", data.error);
              continue;
            }
            
            const agentId = data.agent_id;
            setState(prev => ({
              ...prev,
              repoName: prev.repoName || repoUrl.split('/').pop()?.replace('.git', '') || 'repository',
              agents: {
                ...prev.agents,
                [agentId]: { 
                  status: data.status, 
                  result: data.result,
                  error: data.error 
                }
              }
            }));
          }
        }
      }
    } catch (err) {
      console.error("SSE Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-12 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-xs font-bold uppercase tracking-widest">Cerebras × Gemma 4</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter md:text-6xl">CODEATLAS<span className="text-blue-600"> AI</span></h1>
          <p className="text-slate-400 mt-2 max-w-md">Your AI Engineering Team for Any Repository. High-fidelity intelligence in seconds.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="github.com/user/repo" 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
          <button 
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Repo'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCard id="architecture" title="Architecture" data={state.agents.architecture} />
          <AgentCard id="security" title="Security" data={state.agents.security} />
          <AgentCard id="performance" title="Performance" data={state.agents.performance} />
          <AgentCard id="dependency" title="Dependencies" data={state.agents.dependency} />
          <AgentCard id="vision" title="Vision Alignment" data={state.agents.vision} />
          <AgentCard id="summary" title="Executive Summary" data={state.agents.summary} />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Repository Graph</span>
              </div>
              <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-sm">
                {state.repoName ? `Interactive Graph for ${state.repoName} would render here` : 'Analyze a repository to generate the graph'}
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Intelligence Chat</span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto text-xs text-slate-500 mb-4">
                <div className="p-2 bg-slate-800/50 rounded">System: Ready to analyze.</div>
                {/* Chat messages would be mapped here */}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask about the repo..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const msg = e.currentTarget.value;
                      e.currentTarget.value = '';
                      if (!state.repoName) return;
                      
                      try {
                        const res = await axios.post(`${API_BASE}/chat`, {
                          repo_name: state.repoName,
                          message: msg
                        });
                        // In a full UI, we'd add this to a state list of messages
                        alert(`AI Response: ${res.data.response}`);
                      } catch (err) {
                        console.error("Chat error", err);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
