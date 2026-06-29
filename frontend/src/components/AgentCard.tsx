import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AgentData } from '../types';

interface AgentCardProps {
  id: string;
  title: string;
  icon: React.ElementType;
  data: AgentData;
}

function formatResult(result: unknown): string {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'object') {
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }
  return String(result);
}

export function AgentCard({ title, icon: Icon, data }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'text-slate-500 bg-slate-800/50', icon: <div className="w-2 h-2 rounded-full bg-slate-600" />, label: 'Pending' },
    running: { color: 'text-blue-400 bg-blue-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Running' },
    in_progress: { color: 'text-blue-400 bg-blue-500/10', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Running' },
    completed: { color: 'text-green-400 bg-green-500/10', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Done' },
    error: { color: 'text-red-400 bg-red-500/10', icon: <AlertCircle className="w-3 h-3" />, label: 'Error' },
    failed: { color: 'text-red-400 bg-red-500/10', icon: <AlertCircle className="w-3 h-3" />, label: 'Failed' },
  };

  const status = statusConfig[data.status] || statusConfig.pending;
  const isActive = data.status === 'running' || data.status === 'in_progress';
  const resultStr = formatResult(data.result);

  // Extract score from result if available
  let score: number | null = null;
  if (data.result && typeof data.result === 'object') {
    const r = data.result as Record<string, unknown>;
    if (typeof r.score === 'number') score = r.score;
    else if (typeof r.alignment_score === 'number') score = r.alignment_score;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden",
          "bg-slate-900/40 border-slate-800 hover:border-slate-700",
          isExpanded && "border-blue-500/50 shadow-lg shadow-blue-500/5"
        )}
      >
        {isActive && (
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 h-0.5 bg-blue-600"
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", data.status === 'completed' ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-400")}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
                {score !== null && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{score}</span>
                )}
              </div>
              <div className={cn("flex items-center gap-1.5 mt-0.5", status.color)}>
                {status.icon}
                <span className="text-[10px] font-bold uppercase">{status.label}</span>
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-slate-800">
                {resultStr ? (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar font-mono whitespace-pre-wrap">
                    {resultStr}
                  </div>
                ) : data.error ? (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-xs text-red-400">
                    {data.error}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6 text-slate-600">
                    <FileText className="w-5 h-5 mr-2 opacity-30" />
                    <p className="text-xs">Analyzing...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
