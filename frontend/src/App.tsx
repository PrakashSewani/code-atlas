import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Terminal, Globe, Zap, Shield, Cpu, Package, Eye, BarChart3, ArrowRight, Activity } from 'lucide-react';
import { AgentCard } from './components/AgentCard';
import type { DashboardState } from './types';
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
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 p-6 lg:p-12 font-sans selection:bg-blue-500/30">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cerebras × Gemma 4</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter md:text-7xl text-white">
            CODEATLAS<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-400"> AI</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-md leading-relaxed">
            Enterprise-grade engineering intelligence. Orchestrating parallel AI specialists for instant repository auditing.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto group">
          <div className="relative flex-1 md:w-96">
            <div className="absolute inset-0 bg-blue-600/20 blur-sm rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Enter GitHub repository URL..." 
              className="relative w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>
          <button 
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="relative overflow-hidden bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-blue-600/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isAnalyzing ? 'Analyzing...' : 'Initialize Scan'}
              {!isAnalyzing && <ArrowRight className="w-4 h-4" />}
            </span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCard id="architecture" title="Architecture" icon={Cpu} data={state.agents.architecture} />
          <AgentCard id="security" title="Security" icon={Shield} data={state.agents.security} />
          <AgentCard id="performance" title="Performance" icon={Activity} data={state.agents.performance} />
          <AgentCard id="dependency" title="Dependencies" icon={Package} data={state.agents.dependency} />
          <AgentCard id="vision" title="Vision Alignment" icon={Eye} data={state.agents.vision} />
          <AgentCard id="summary" title="Executive Summary" icon={BarChart3} data={state.agents.summary} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 flex flex-col transition-all hover:border-blue-500/30 overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest">Repository Intelligence Graph</span>
            </div>
            <div className="flex-1 border-2 border-dashed border-slate-800/60 rounded-2xl flex items-center justify-center text-slate-600 text-sm italic bg-slate-950/50 relative">
              {state.repoName ? (
                <div className="text-center space-y-2">
                  <p className="text-slate-300 font-medium">Graph visualization for {state.repoName}</p>
                  <p className="text-xs opacity-50">Rendering interactive node relationships...</p>
                </div>
              ) : (
                <p>Analyze a repository to initialize the knowledge graph</p>
              )}
            </div>
          </div>
          
          <div className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 flex flex-col transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <Terminal className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest">Intelligence Chat</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto text-xs text-slate-500 mb-6 pr-2 custom-scrollbar">
              <div className="p-3 bg-slate-800/50 rounded-2xl rounded-tl-none border border-slate-700/50 text-slate-300">
                Hello! I'm the CodeAtlas Lead Engineer. Once the scan is complete, I can answer any technical question about this repository using real-time code analysis.
              </div>
            </div>
            <div className="relative mt-auto">
              <input 
                type="text" 
                placeholder="Query codebase..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
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
