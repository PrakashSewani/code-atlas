import { useState } from 'react';
import { Upload, Image as ImageIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface VisionAnalysisProps {
  onUpload: (file: File) => void;
}

export function VisionAnalysis({ onUpload }: VisionAnalysisProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      onUpload(selected);
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        "relative group p-12 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center",
        file ? "border-blue-500 bg-blue-500/5" : "border-slate-800 bg-slate-900/20 hover:border-blue-500/50 hover:bg-slate-900/40"
      )}>
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          accept="image/*"
        />

        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
          file ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 group-hover:text-blue-400"
        )}>
          {file ? <ImageIcon className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
        </div>

        <h3 className="text-white font-bold mb-2">
          {file ? file.name : "Upload Architecture Diagram"}
        </h3>
        <p className="text-slate-500 text-sm max-w-xs mb-6">
          {file ? "AI is comparing your diagram with actual codebase implementation..." : "Upload ER diagrams, flowcharts, or screenshots for AI verification."}
        </p>

        {!file && (
          <Button variant="outline" size="sm" className="px-6">
            Select File
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Vision Match" subtitle="Codebase vs Diagram">
          <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">94% Alignment</span>
              <span className="text-[10px] text-slate-500">Architecture matches source</span>
            </div>
          </div>
        </Card>
        <Card title="AI Findings" subtitle="Implementation Gaps">
          <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Redis Layer Missing</span>
              <span className="text-[10px] text-slate-500">Diagram shows cache, code doesn&apos;t</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
