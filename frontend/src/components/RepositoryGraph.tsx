import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '../lib/utils';
import { Cpu, Database, Globe, Shield, Zap } from 'lucide-react';

const RepoNode = ({ data }: { data: { label: string; description: string; type: string; icon: React.ReactNode } }) => {
  return (
    <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl min-w-[150px] text-center group hover:border-blue-500 transition-all">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-600" />
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          "p-2 rounded-lg",
          data.type === 'db' ? "bg-yellow-500/20 text-yellow-500" :
          data.type === 'api' ? "bg-blue-500/20 text-blue-500" :
          "bg-indigo-500/20 text-indigo-500"
        )}>
          {data.icon}
        </div>
        <span className="text-xs font-bold text-white">{data.label}</span>
        <span className="text-[10px] text-slate-500">{data.description}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-slate-600" />
    </div>
  );
};

const nodeTypes = { repoNode: RepoNode };

export function RepositoryGraph({ repoName: _repoName }: { repoName: string }) {
  const nodes: Node[] = useMemo(() => [
    { id: 'frontend', type: 'repoNode', position: { x: 250, y: 0 }, data: { label: 'Frontend', description: 'React / Tailwind', type: 'api', icon: <Globe className="w-4 h-4" /> } },
    { id: 'api', type: 'repoNode', position: { x: 250, y: 150 }, data: { label: 'API Gateway', description: 'FastAPI / Python', type: 'api', icon: <Zap className="w-4 h-4" /> } },
    { id: 'auth', type: 'repoNode', position: { x: 100, y: 300 }, data: { label: 'Auth Service', description: 'JWT / OAuth2', type: 'security', icon: <Shield className="w-4 h-4" /> } },
    { id: 'db', type: 'repoNode', position: { x: 400, y: 300 }, data: { label: 'Main Database', description: 'PostgreSQL', type: 'db', icon: <Database className="w-4 h-4" /> } },
    { id: 'cache', type: 'repoNode', position: { x: 550, y: 150 }, data: { label: 'Redis Cache', description: 'In-memory Store', type: 'api', icon: <Cpu className="w-4 h-4" /> } },
  ], []);

  const edges: Edge[] = useMemo(() => [
    { id: 'e1-2', source: 'frontend', target: 'api', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#3b82f6' } },
    { id: 'e2-3', source: 'api', target: 'auth', label: 'verify', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6366f1' } },
    { id: 'e2-4', source: 'api', target: 'db', label: 'query', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#6366f1' } },
    { id: 'e2-5', source: 'api', target: 'cache', label: 'cache', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#3b82f6' } },
  ], []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }} className="bg-slate-950/50 rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#1e293b" gap={20} />
        <Controls className="bg-slate-900 border-slate-800 fill-white" />
        <MiniMap
          nodeColor="#1e293b"
          maskColor="rgba(0,0,0,0.5)"
          className="bg-slate-900 border-slate-800"
        />
      </ReactFlow>
    </div>
  );
}
