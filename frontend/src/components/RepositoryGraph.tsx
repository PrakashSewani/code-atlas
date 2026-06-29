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
import { Cpu, Database, Globe, Shield, Zap, FileCode, Layers, Box, Server } from 'lucide-react';
import type { AgentData } from '../types';

interface RepoNodeData {
  label: string;
  description: string;
  type: string;
  icon: React.ReactNode;
}

const RepoNode = ({ data }: { data: RepoNodeData }) => {
  return (
    <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl min-w-[140px] text-center group hover:border-blue-500 transition-all">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-600" />
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          "p-2 rounded-lg",
          data.type === 'db' ? "bg-yellow-500/20 text-yellow-500" :
          data.type === 'api' ? "bg-blue-500/20 text-blue-500" :
          data.type === 'security' ? "bg-red-500/20 text-red-500" :
          data.type === 'frontend' ? "bg-green-500/20 text-green-500" :
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

// MUST be outside component to avoid React Flow warning
const nodeTypes = { repoNode: RepoNode };

function extractServices(agentResult: unknown): string[] {
  if (!agentResult || typeof agentResult !== 'object') return [];
  const r = agentResult as Record<string, unknown>;
  if (Array.isArray(r.services)) return r.services.slice(0, 8) as string[];
  if (Array.isArray(r.layers)) return r.layers.slice(0, 8) as string[];
  return [];
}

function extractPatterns(agentResult: unknown): string[] {
  if (!agentResult || typeof agentResult !== 'object') return [];
  const r = agentResult as Record<string, unknown>;
  if (Array.isArray(r.patterns)) return r.patterns.slice(0, 4) as string[];
  return [];
}

export function RepositoryGraph({ agents }: { agents: Record<string, AgentData> }) {
  const archResult = agents.architecture?.result;
  const services = useMemo(() => extractServices(archResult), [archResult]);
  const patterns = useMemo(() => extractPatterns(archResult), [archResult]);

  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    // Root node
    n.push({
      id: 'root',
      type: 'repoNode',
      position: { x: 300, y: 0 },
      data: { label: 'Repository', description: 'Root Module', type: 'default', icon: <Box className="w-4 h-4" /> }
    });

    if (services.length === 0) {
      // Default nodes when no analysis data
      const defaults = [
        { id: 'frontend', label: 'Frontend', desc: 'UI Layer', type: 'frontend', icon: <Globe className="w-4 h-4" />, x: 100, y: 150 },
        { id: 'api', label: 'API Layer', desc: 'Backend Services', type: 'api', icon: <Server className="w-4 h-4" />, x: 300, y: 150 },
        { id: 'db', label: 'Database', desc: 'Data Storage', type: 'db', icon: <Database className="w-4 h-4" />, x: 500, y: 150 },
      ];
      defaults.forEach(d => {
        n.push({ id: d.id, type: 'repoNode', position: { x: d.x, y: d.y }, data: { label: d.label, description: d.desc, type: d.type, icon: d.icon } });
        e.push({ id: `e-root-${d.id}`, source: 'root', target: d.id, animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#3b82f6' } });
      });
    } else {
      // Dynamic nodes from architecture analysis
      const icons = [Globe, Server, Shield, Database, Zap, Cpu, FileCode, Layers];
      const types = ['frontend', 'api', 'security', 'db', 'api', 'default', 'default', 'default'];

      services.forEach((svc, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const nodeId = `svc-${i}`;
        const IconComp = icons[i % icons.length];

        n.push({
          id: nodeId,
          type: 'repoNode',
          position: { x: 100 + col * 200, y: 150 + row * 150 },
          data: {
            label: typeof svc === 'string' ? svc : `Service ${i}`,
            description: patterns[i] || 'Module',
            type: types[i % types.length],
            icon: <IconComp className="w-4 h-4" />
          }
        });

        e.push({
          id: `e-root-${nodeId}`,
          source: 'root',
          target: nodeId,
          animated: i < 3,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: i < 3 ? '#3b82f6' : '#6366f1' }
        });
      });
    }

    return { nodes: n, edges: e };
  }, [services, patterns]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', background: 'rgba(2, 6, 23, 0.5)' }} className="rounded-2xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: 'transparent' }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
        <MiniMap
          nodeColor="#1e293b"
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </div>
  );
}
