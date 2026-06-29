import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

interface ComparisonItem {
  label: string;
  traditional: string;
  cerebras: string;
}

const items: ComparisonItem[] = [
  { label: 'Architecture', traditional: '2.8s', cerebras: '0.6s' },
  { label: 'Security', traditional: '4.1s', cerebras: '0.8s' },
  { label: 'Performance', traditional: '5.2s', cerebras: '0.9s' },
  { label: 'Dependencies', traditional: '3.1s', cerebras: '0.4s' },
];

export function LatencyComparison() {
  return (
    <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500 fill-current" />
            Inference Speed
          </h3>
          <p className="text-slate-500 text-xs">Latency benchmarking</p>
        </div>
        <div className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          Real-time
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3" /> Traditional
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.label} className="p-2 bg-slate-800/30 border border-slate-800 rounded-lg flex justify-between items-center">
                <span className="text-[11px] text-slate-400">{item.label}</span>
                <span className="text-[11px] font-mono text-slate-300">{item.traditional}</span>
              </div>
            ))}
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">Total</span>
              <span className="text-base font-mono font-bold text-slate-300">15.2s</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3 fill-current" /> Cerebras
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-lg flex justify-between items-center hover:border-blue-500/50 transition-all"
              >
                <span className="text-[11px] text-blue-300/80">{item.label}</span>
                <span className="text-[11px] font-mono font-bold text-blue-400">{item.cerebras}</span>
              </motion.div>
            ))}
            <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-lg flex justify-between items-center">
              <span className="text-xs font-bold text-blue-200">Total</span>
              <span className="text-base font-mono font-bold text-blue-400">2.7s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-center">
        <p className="text-xs text-blue-300">
          <span className="font-bold text-blue-400">~5.6x faster</span> via Cerebras acceleration
        </p>
      </div>
    </div>
  );
}
