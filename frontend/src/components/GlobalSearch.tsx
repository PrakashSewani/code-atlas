import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  category: 'File' | 'Class' | 'Function' | 'Route';
  path: string;
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const items: SearchItem[] = [
    { id: '1', title: 'auth.ts', category: 'File', path: 'src/services/auth.ts' },
    { id: '2', title: 'UserRepository', category: 'Class', path: 'src/repositories/user.repo.ts' },
    { id: '3', title: 'validateToken', category: 'Function', path: 'src/middleware/auth.ts' },
    { id: '4', title: '/api/v1/analyze', category: 'Route', path: 'src/routes/analyze.ts' },
    { id: '5', title: 'dbContext.ts', category: 'File', path: 'src/config/db.ts' },
  ];

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.path.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-slate-800">
              <Search className="w-5 h-5 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files, classes, functions..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 text-lg placeholder:text-slate-600"
              />
              <div className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950 text-[10px] text-slate-500 font-medium">
                <Command className="w-2 h-2" /> ESC
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {filtered.length > 0 ? (
                <div className="space-y-1">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      onClick={onClose}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 cursor-pointer group transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{item.title}</span>
                        <span className="text-[10px] text-slate-500">{item.path}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-slate-500 text-sm">No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
