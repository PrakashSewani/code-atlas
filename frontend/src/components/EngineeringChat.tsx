import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Zap, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  latencyMs?: number;
  tokensPerSecond?: number;
  tokenCount?: number;
}

interface EngineeringChatProps {
  repoName: string;
  onSendMessage: (message: string) => Promise<string>;
}

const SUGGESTED_PROMPTS = [
  "Explain the authentication flow",
  "Find potential performance bottlenecks",
  "Audit security vulnerabilities",
  "Generate a professional README",
  "Explain dependency injection usage",
];

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

export function EngineeringChat({ repoName, onSendMessage }: EngineeringChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm the CodeAtlas Lead Engineer. I've indexed ${repoName}. How can I help you optimize this codebase today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Live timer while loading
  useEffect(() => {
    if (isLoading) {
      setElapsedMs(0);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const startTime = performance.now();

    try {
      const response = await onSendMessage(text);
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const tokenCount = estimateTokens(response);
      const tokensPerSecond = Math.round((tokenCount / latencyMs) * 1000);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        latencyMs,
        tokensPerSecond,
        tokenCount,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: "I encountered an error querying the repository. Please try again.",
        timestamp: Date.now(),
        latencyMs,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden transition-all hover:border-blue-500/30">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-200">Engineering Intelligence</span>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Zap className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-mono font-bold">{(elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            Cerebras
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "ml-auto flex-row-reverse max-w-[85%]" : "mr-auto max-w-[85%]"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-slate-800 text-slate-400" : "bg-blue-600 text-white"
              )}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed break-words",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                {/* Speed metrics for assistant messages */}
                {msg.role === 'assistant' && msg.tokensPerSecond && (
                  <div className="flex items-center gap-3 px-1">
                    <div className="flex items-center gap-1 text-[10px] text-blue-400 font-mono">
                      <Zap className="w-3 h-3" />
                      <span className="font-bold">{msg.tokensPerSecond}</span>
                      <span className="text-slate-500">tok/s</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{msg.latencyMs}ms</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      ~{msg.tokenCount} tokens
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator with live timer */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mr-auto"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  <span className="text-[10px] text-blue-400 font-mono ml-1">{(elapsedMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Prompts */}
      {messages.length < 4 && (
        <div className="shrink-0 px-4 py-2 flex flex-wrap gap-2 border-t border-slate-800/50">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/40 transition-all text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-4 bg-slate-900/60 border-t border-slate-800">
        <div className="relative flex items-center gap-2">
          <Input
            placeholder="Ask about architecture, security, or logic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="bg-slate-950 pl-4 pr-12"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-1 top-1 bottom-1 w-9 h-9 p-0 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-600 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>Powered by Cerebras Gemma 4</span>
        </div>
      </div>
    </div>
  );
}
