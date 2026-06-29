import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface HealthScoreProps {
  score: number;
  metrics: { label: string; value: number; color: string }[];
}

export function HealthScore({ score, metrics }: HealthScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-6">
        {/* Score Circle */}
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-800" />
            <motion.circle
              cx="60" cy="60" r="54"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-blue-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{score}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Score</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {metrics.map((m, i) => (
            <div key={m.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-400">{m.label}</span>
                <span className="text-[10px] font-bold text-slate-300">{m.value}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  className={cn("h-full rounded-full", m.color)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
