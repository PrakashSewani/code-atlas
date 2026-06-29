import { motion } from 'framer-motion';
import { Terminal, Loader2, Code, Zap, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export function AnalysisLoader({ repoUrl }: { repoUrl: string }) {
  const steps = [
    { label: 'Establishing secure connection to GitHub...', icon: Globe, color: 'text-blue-400' },
    { label: 'Cloning repository source...', icon: Code, color: 'text-indigo-400' },
    { label: 'Indexing file structure & symbols...', icon: Zap, color: 'text-yellow-400' },
    { label: 'Constructing knowledge graph...', icon: Terminal, color: 'text-green-400' },
    { label: 'Initializing parallel AI specialists...', icon: Zap, color: 'text-blue-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-white">CODEATLAS <span className="text-blue-500">AI</span></h2>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-mono">analysis_engine_v1.0.sh</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.6 }}
                className="flex items-center gap-4 text-slate-400"
              >
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                  <step.icon className={cn("w-3 h-3", step.color)} />
                </div>
                <span className="flex-1">{step.label}</span>
                {i === 4 ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-green-500 text-[10px] font-bold"
                  >
                    OK
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-600 font-mono">
              Target: <span className="text-slate-400">{repoUrl}</span>
            </div>
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
              Orchestrating Agents...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
