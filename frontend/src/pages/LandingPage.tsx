import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Zap, ArrowRight, LayoutDashboard, MessageSquare, Activity, Cpu, Shield, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LandingPage({ onStartAnalysis }: { onStartAnalysis: (url: string) => void }) {
  const [url, setUrl] = useState('');

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">CODEATLAS <span className="text-blue-500">AI</span></span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">Documentation</Button>
          <Button variant="outline" size="sm">Sign In</Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto space-y-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Powered by Cerebras Gemma 4
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1]"
          >
            Your AI Engineering Team <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-400">for Any Repository</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Analyze an entire software project in seconds using parallel AI engineering agents.
            Discover architecture, security risks, and performance bottlenecks instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl"
          >
            <div className="flex-1">
              <Input
                placeholder="Paste GitHub repository URL..."
                icon={<Globe className="w-4 h-4" />}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border-none bg-transparent focus:ring-0 h-full text-base"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onStartAnalysis(url)}
                className="px-8 h-full"
              >
                Analyze Repository <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {[
            { icon: Cpu, title: 'Architecture', desc: 'Deep dive into system design and module interactions.' },
            { icon: Shield, title: 'Security', desc: 'Automatic vulnerability detection and risk assessment.' },
            { icon: Activity, title: 'Performance', desc: 'Identify bottlenecks and suggest optimizations.' },
            { icon: Package, title: 'Dependencies', desc: 'Audit third-party libs and analyze dependency graphs.' },
            { icon: LayoutDashboard, title: 'Documentation', desc: 'Generate high-fidelity READMEs and API docs.' },
            { icon: MessageSquare, title: 'Vision Analysis', desc: 'Analyze architecture diagrams and ER diagrams.' },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group h-full hover:border-blue-500/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <feat.icon className="w-5 h-5 text-blue-400 group-hover:text-white" />
                </div>
                <h3 className="text-white font-bold mb-2">{feat.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-12 text-center">
          <h2 className="text-3xl font-bold text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              { step: '1', title: 'Intelligence Engine', desc: 'Deep indexing of the entire repo' },
              { step: '2', title: 'Parallel Specialists', desc: 'Multi-agent AI auditing' },
              { step: '3', title: 'Engineering Dashboard', desc: 'Instant health and risk scores' },
              { step: '4', title: 'Interactive Chat', desc: 'Precision codebase querying' },
            ].map((step, i) => (
              <div key={step.step} className="relative z-10 flex flex-col items-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-lg ring-4 ring-blue-600/20">
                  {step.step}
                </div>
                <h4 className="text-white font-bold">{step.title}</h4>
                <p className="text-slate-500 text-xs px-4">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-full h-[2px] bg-gradient-to-r from-blue-600 to-transparent -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-900 py-12 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium">CODEATLAS AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="text-slate-300">Cerebras</span>
            <span className="text-slate-300">Gemma 4</span>
            <span className="text-slate-300">FastAPI</span>
            <span className="text-slate-300">React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
