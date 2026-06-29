import { motion } from 'framer-motion';
import { Terminal, Loader2, Code, Zap, Globe, GitBranch, Network, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalysisLoaderProps {
  repoUrl: string;
  phase?: 'idle' | 'cloning' | 'parsing' | 'agents';
}

export function AnalysisLoader({ repoUrl, phase = 'idle' }: AnalysisLoaderProps) {
  const steps = [
    { label: 'Establishing secure connection...', icon: Globe, phase: 'cloning' },
    { label: 'Cloning repository source...', icon: GitBranch, phase: 'cloning' },
    { label: 'Indexing file structure & symbols...', icon: Code, phase: 'parsing' },
    { label: 'Constructing knowledge graph...', icon: Network, phase: 'parsing' },
    { label: 'Racing AI specialists (Cerebras vs MiMo)...', icon: Cpu, phase: 'agents' },
  ];

  const phaseIndex = phase === 'cloning' ? 1 : phase === 'parsing' ? 3 : phase === 'agents' ? 4 : 0;

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
            {steps.map((step, i) => {
              const isDone = i < phaseIndex;
              const isActive = i === phaseIndex;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.3, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 text-slate-400"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center",
                    isDone ? "bg-green-500/20" : isActive ? "bg-blue-500/20" : "bg-slate-800"
                  )}>
                    <step.icon className={cn("w-3 h-3", isDone ? "text-green-400" : isActive ? "text-blue-400" : "text-slate-600")} />
                  </div>
                  <span className={cn("flex-1", isDone ? "text-slate-300" : isActive ? "text-slate-200" : "text-slate-600")}>
                    {step.label}
                  </span>
                  {isDone ? (
                    <span className="text-green-500 text-[10px] font-bold">OK</span>
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-600 font-mono truncate max-w-[60%]">
              Target: <span className="text-slate-400">{repoUrl}</span>
            </div>
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
              {phase === 'cloning' && 'Cloning...'}
              {phase === 'parsing' && 'Parsing...'}
              {phase === 'agents' && 'Analyzing...'}
              {phase === 'idle' && 'Initializing...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
