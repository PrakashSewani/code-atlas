import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  message: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: string;
}

interface ActivityFeedProps {
  agentStatus: Record<string, { status: string; result?: unknown; error?: string }>;
}

export function ActivityFeed({ agentStatus }: ActivityFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const timestampsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const events = [
      { id: 'clone', label: 'Repository Cloned', agent: 'system' },
      { id: 'index', label: 'Files Indexed', agent: 'planner' },
      { id: 'graph', label: 'Knowledge Graph Built', agent: 'planner' },
      { id: 'arch', label: 'Architecture Analysis', agent: 'architecture' },
      { id: 'sec', label: 'Security Audit', agent: 'security' },
      { id: 'perf', label: 'Performance Review', agent: 'performance' },
      { id: 'dep', label: 'Dependency Map', agent: 'dependency' },
      { id: 'vision', label: 'Vision Analysis', agent: 'vision' },
      { id: 'sum', label: 'Executive Summary', agent: 'summary' },
    ];

    const newLogs: LogEntry[] = events.map(event => {
      const agentData = agentStatus[event.agent];
      const status = agentData?.status || 'pending';
      const mappedStatus = status === 'completed' ? 'completed' : (status === 'running' || status === 'in_progress') ? 'running' : 'pending';

      if (!timestampsRef.current[event.id] && mappedStatus !== 'pending') {
        timestampsRef.current[event.id] = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }

      return {
        id: event.id,
        message: event.label,
        status: mappedStatus,
        timestamp: timestampsRef.current[event.id] || '--:--:--',
      };
    });

    setLogs(newLogs);
  }, [agentStatus]);

  return (
    <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl flex flex-col">
      <div className="flex items-center gap-2 mb-4 text-slate-400">
        <Terminal className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">Engineering Timeline</span>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar relative">
        <div className="absolute left-4 top-1 bottom-1 w-px bg-slate-800" />

        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative pl-9 flex items-center justify-between group"
            >
              <div className={cn(
                "absolute left-3.5 w-1.5 h-1.5 rounded-full z-10 transition-all",
                log.status === 'completed' ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" :
                log.status === 'running' ? "bg-blue-500 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.6)]" :
                "bg-slate-700"
              )} />

              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "text-[11px] font-medium transition-colors truncate",
                  log.status === 'completed' ? "text-slate-200" : "text-slate-500"
                )}>
                  {log.message}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">{log.timestamp}</span>
              </div>

              <div className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 ml-2">
                {log.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> :
                 log.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin text-blue-500" /> :
                 <Circle className="w-3 h-3" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
