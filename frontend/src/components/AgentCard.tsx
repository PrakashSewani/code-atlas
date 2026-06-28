import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentResult } from '../types';

interface AgentCardProps {
  id: string;
  title: string;
  data: AgentResult;
}

export const AgentCard = ({ id, title, data }: AgentCardProps) => {
  const status = data.status;
  
  const statusConfig = {
    pending: { color: 'text-slate-400', icon: null, bg: 'bg-slate-500/10' },
    in_progress: { color: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-blue-500/10' },
    completed: { color: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-emerald-500/10' },
    failed: { color: 'text-red-400', icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-red-500/10' },
  };

  const config = statusConfig[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-300 flex flex-col gap-3",
        "bg-slate-900/50 border-slate-800",
        status === 'completed' && "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        status === 'in_progress' && "border-blue-500/30"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">{title}</h3>
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold", config.bg, config.color)}>
          {config.icon}
          {status.replace('_', ' ')}
        </div>
      </div>

      {status === 'completed' && data.result && (
        <div className="text-slate-400 text-xs space-y-1">
          {/* Simplified rendering of the structured JSON result */}
          <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-700">
            <span className="text-slate-500">Health Score</span>
            <span className="text-emerald-400 font-mono font-bold">{data.result.score || 'N/A'}%</span>
          </div>
          <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
            {Object.entries(data.result)
              .filter(([key]) => key !== 'score')
              .map(([key, value]) => (
                <div key={key} className="text-[10px] opacity-70">
                  <span className="capitalize font-semibold">{key}:</span> {Array.isArray(value) ? value.length + " findings" : "Analyzed"}
                </div>
              ))}
          </div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="text-red-400 text-xs p-2 bg-red-500/10 rounded border border-red-500/20">
          {data.error}
        </div>
      )}
    </motion.div>
  );
};
