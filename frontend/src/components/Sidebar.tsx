import {
  Settings,
  Info,
  Star,
  Trash2,
  Zap,
  Search,
  Command
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export interface Session {
  id: string;
  repoName: string;
  repoUrl: string;
  timestamp: number;
  healthScore: number;
  language: string;
  framework: string;
  isFavorite: boolean;
}

export function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  onDeleteSession,
  onToggleFavorite,
  onSearchClick
}: {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  onDeleteSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSearchClick: () => void;
}) {
  // Separate favorites and regular sessions
  const favorites = sessions.filter(s => s.isFavorite);
  const regular = sessions.filter(s => !s.isFavorite);

  return (
    <div className="w-64 shrink-0 h-screen bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="w-5 h-5 text-white fill-current" />
        </div>
        <span className="text-lg font-black tracking-tighter text-white">CODEATLAS</span>
      </div>

      <div className="px-4 mb-6">
        <div
          onClick={onSearchClick}
          className="relative group cursor-pointer"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-[10px] text-slate-500 font-medium">
            <Command className="w-2 h-2" /> K
          </div>
          <input
            type="text"
            placeholder="Search repositories..."
            readOnly
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-12 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all cursor-pointer"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 mb-3">Favorites</h3>
            <div className="space-y-1">
              {favorites.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onSelect={() => setActiveSessionId(session.id)}
                  onToggleFavorite={() => onToggleFavorite(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Repositories */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 mb-3">
            {favorites.length > 0 ? 'Other Repositories' : 'Repositories'}
          </h3>
          <div className="space-y-1">
            {(favorites.length > 0 ? regular : sessions).map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onSelect={() => setActiveSessionId(session.id)}
                onToggleFavorite={() => onToggleFavorite(session.id)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-slate-600 px-2 italic">No repositories analyzed</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-slate-900 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-white">
          <Settings className="w-4 h-4" /> Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-white">
          <Info className="w-4 h-4" /> About
        </Button>
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onToggleFavorite,
  onDelete
}: {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all",
        isActive
          ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        <span className="text-xs shrink-0">📦</span>
        <span className="text-sm font-medium truncate">{session.repoName}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={cn("p-1 rounded hover:bg-slate-800", session.isFavorite && "text-yellow-500")}
        >
          <Star className={cn("w-3 h-3", session.isFavorite && "fill-current")} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-red-500/20 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
