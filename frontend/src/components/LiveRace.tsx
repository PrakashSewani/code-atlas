import React, { useMemo } from 'react';
import { Trophy, Zap, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface AgentBenchmark {
  cerebras?: { status: string; duration?: number; result?: any };
  mimo?: { status: string; duration?: number; result?: any };
}

interface LiveRaceProps {
  agents: Record<string, any>;
}

const AGENT_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  security: 'Security',
  performance: 'Performance',
  dependency: 'Dependencies',
  vision: 'Vision',
  summary: 'Summary',
};

export function LiveRace({ agents }: LiveRaceProps) {
  const benchmarkData = useMemo(() => {
    const data: Record<string, AgentBenchmark> = {};
    
    Object.entries(agents).forEach(([id, agentData]) => {
      if (id === 'planner') return;
      
      // The backend now sends updates with a 'provider' field
      // But in the App.tsx state, it might be overwritten. 
      // We need to ensure the state captures both.
      // For now, we assume the agentData is structured to support both if we update App.tsx
      data[id] = agentData as any;
    });
    
    return data;
  }, [agents]);

  const calculateOverall = () => {
    let cerebrasTotal = 0;
    let mimoTotal = 0;
    let count = 0;

    Object.entries(benchmarkData).forEach(([id, data]) => {
      const cDur = (data as any).cerebras?.duration || 0;
      const mDur = (data as any).mimo?.duration || 0;
      if (cDur || mDur) {
        cerebrasTotal += cDur;
        mimoTotal += mDur;
        count++;
      }
    });

    return { cerebrasTotal, mimoTotal, count };
  };

  const { cerebrasTotal, mimoTotal, count } = calculateOverall();
  const speedup = mimoTotal > 0 ? (mimoTotal / cerebrasTotal).toFixed(2) : '0';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500 fill-current" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Live Provider Race</h2>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Speedup</p>
              <p className="text-lg font-black text-blue-400">{speedup}x</p>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Trophy className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Agent</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Cerebras</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">MiMo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {Object.entries(AGENT_LABELS).map(([id, label]) => {
              const agent = benchmarkData[id];
              const c = (agent as any)?.cerebras;
              const m = (agent as any)?.mimo;

              return (
                <tr key={id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-300">{label}</td>
                  <td className="px-4 py-3 text-center">
                    <ProviderStatus status={c?.status} duration={c?.duration} isWinner={c?.duration && m?.duration && c.duration < m.duration} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProviderStatus status={m?.status} duration={m?.duration} isWinner={m?.duration && c?.duration && m.duration < c.duration} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {count > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          <ResultMetric label="Cerebras Time" value={`${cerebrasTotal.toFixed(2)}s`} color="text-blue-400" />
          <ResultMetric label="MiMo Time" value={`${mimoTotal.toFixed(2)}s`} color="text-slate-400" />
          <ResultMetric label="Time Saved" value={`${(mimoTotal - cerebrasTotal).toFixed(2)}s`} color="text-green-400" />
        </motion.div>
      )}
    </div>
  );
}

function ProviderStatus({ status, duration, isWinner }: { status?: string; duration?: number; isWinner?: boolean }) {
  if (!status) return <div className="text-slate-700 text-[10px]">Pending</div>;
  
  return (
    <div className="flex items-center justify-center gap-2">
      {status === 'in_progress' ? (
        <span className="text-blue-500 text-[10px] animate-pulse font-bold">Running...</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-green-500 text-[10px] font-bold">Completed</span>
          <span className="text-slate-400 text-[10px]">{duration?.toFixed(2)}s</span>
          {isWinner && <Trophy className="w-3 h-3 text-yellow-500" />}
        </div>
      )}
    </div>
  );
}

function ResultMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-center">
      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</p>
      <p className={cn("text-sm font-black", color)}>{value}</p>
    </div>
  );
}
