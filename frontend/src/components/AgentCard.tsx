import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AgentResult } from '../types';


interface AgentCardProps {
  id: string;
  title: string;
  icon: React.ElementType;
  data: AgentResult;
}

export const AgentCard = ({ id, title, icon: Icon, data }: AgentCardProps) => {
  const status = data.status;
  
  const statusConfig = {
    pending: { color: 'text-slate-500', icon: null, bg: 'bg-slate-500/10', border: 'border-slate-800' },
    in_progress: { color: 'text-blue-400', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-blue-500/10', border: 'border-blue-500/40' },
    completed: { color: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
    failed: { color: 'text-red-400', icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-red-500/10', border: 'border-red-500/50' },
  };

  const config = statusConfig[status];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group relative overflow-hidden p-5 rounded-2xl border transition-all duration-500",
        "bg-slate-900/40 backdrop-blur-md",
        config.border
      )}
    >
      {/* Glow Effect */}
      <div className={cn(
        "absolute -right-8 -top-8 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40",
        status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-500'
      )} />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg transition-colors", config.bg)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <h3 className="text-sm font-bold text-slate-200 tracking-tight">{title}</h3>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all", config.bg, config.color)}>
            {config.icon}
            {status.replace('_', ' ')}
          </div>
        </div>

        {status === 'completed' && data.result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-slate-500 font-medium uppercase">Health Score</span>
              <span className="text-2xl font-black text-emerald-400 font-mono leading-none">
                {data.result.score || 'N/A'}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${data.result.score || 0}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" 
               />
            </div>
            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
              {Object.entries(data.result)
                .filter(([key]) => key !== 'score')
                .map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700/50 text-[11px]">
                    <span className="text-slate-400 font-semibold capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-slate-300">{Array.isArray(value) ? `${value.length} items` : 'Analyzed'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="text-red-400 text-[11px] p-3 bg-red-500/10 rounded-xl border border-red-500/20 font-mono italic">
            {data.error}
          </div>
        )}
      </div>
    </motion.div>
  );
};
