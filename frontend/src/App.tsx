import React, { useState } from 'react';
import { 
  Upload, 
  Activity, 
  Cpu, 
  Zap, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Loader2,
  Copy,
  ClipboardCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';

interface ProfileData {
  parsed: any;
  analysis: {
    summary: {
      total_cpu_time_ms: number;
      total_gpu_time_ms: number;
      gpu_utilization_pct: number;
      dataloader_ratio_pct: number;
      peak_memory_mb: number;
    };
    bottlenecks: Array<{
      type: string;
      severity: 'high' | 'medium' | 'info';
      message: string;
    }>;
    top_cpu_ops: Array<{ name: string; duration_us: number }>;
    top_gpu_ops: Array<{ name: string; duration_us: number }>;
  };
  suggestions: string;
}

function App() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a .json chrome-trace file.');
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze trace');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1E293B] pb-20">
      {/* Pulse Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Activity size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">ml-profiler</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", loading ? "bg-primary animate-pulse" : "bg-emerald-500")} />
              {loading ? 'Analyzing...' : 'System Ready'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "w-full max-w-xl bg-white border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all group",
                isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-gray-200 hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform",
                isDragging ? "bg-primary text-white scale-110" : "bg-gray-50 text-gray-400 group-hover:text-primary group-hover:scale-110"
              )}>
                {selectedFile ? <CheckCircle2 /> : <Upload />}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {selectedFile ? 'File ready for analysis' : 'Drop your PyTorch trace'}
              </h2>
              <p className="text-gray-500 mb-8">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload the .json chrome-trace file to start analysis'}
              </p>
              <label className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-semibold cursor-pointer transition-colors inline-block">
                {selectedFile ? 'Change File' : 'Select File'}
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}

        {loading && <DashboardSkeleton />}

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 mb-8 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="GPU Utilization" 
                value={`${data.analysis.summary.gpu_utilization_pct}%`}
                icon={<Zap className="text-amber-500" />}
                trend={data.analysis.summary.gpu_utilization_pct > 70 ? 'good' : 'bad'}
              />
              <StatCard 
                title="Total CPU Time" 
                value={`${data.analysis.summary.total_cpu_time_ms.toFixed(1)}ms`}
                icon={<Cpu className="text-blue-500" />}
              />
              <StatCard 
                title="DataLoader Ratio" 
                value={`${data.analysis.summary.dataloader_ratio_pct}%`}
                icon={<Database className="text-indigo-500" />}
                trend={data.analysis.summary.dataloader_ratio_pct < 15 ? 'good' : 'bad'}
              />
              <StatCard 
                title="Peak Memory" 
                value={`${data.analysis.summary.peak_memory_mb.toFixed(1)}MB`}
                icon={<Activity className="text-emerald-500" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Analysis & Bottlenecks */}
              <div className="lg:col-span-2 space-y-8">
                {/* Bottlenecks */}
                <section>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    Critical Bottlenecks
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                      {data.analysis.bottlenecks.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {data.analysis.bottlenecks.map((b, i) => (
                      <BottleneckCard key={i} {...b} />
                    ))}
                    {data.analysis.bottlenecks.length === 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
                        <CheckCircle2 className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900">Efficient Execution</p>
                          <p className="text-emerald-700 text-sm">No significant bottlenecks detected in this trace.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Operations Charts */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-6 flex items-center justify-between text-sm uppercase tracking-wider text-gray-400">
                      Slowest CPU Ops
                      <Cpu size={14} />
                    </h4>
                    <OpsChart data={data.analysis.top_cpu_ops} color="#3B82F6" isCpu />
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold mb-6 flex items-center justify-between text-sm uppercase tracking-wider text-gray-400">
                      Slowest GPU Ops
                      <Zap size={14} />
                    </h4>
                    <OpsChart data={data.analysis.top_gpu_ops} color="#F59E0B" />
                  </div>
                </section>
              </div>

              {/* Right Column: LLM Suggestions */}
              <div className="lg:col-span-1">
                <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] sticky top-24 shadow-2xl shadow-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                      AI Optimizer
                    </div>
                    <button 
                      onClick={() => handleCopy(data.suggestions)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                      title="Copy to clipboard"
                    >
                      {copied ? <ClipboardCheck size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Engineering Report</h3>
                  <div className="report-markdown text-slate-300 text-sm">
                    {data.suggestions.split('\n\n').map((para, i) => (
                      <p key={i} className="mb-4 last:mb-0">{para}</p>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setData(null);
                      setSelectedFile(null);
                    }}
                    className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    Analyze New Trace
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: 'good' | 'bad' }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "w-2 h-2 rounded-full",
            trend === 'good' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          )} />
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function BottleneckCard({ severity, message }: { severity: string, message: string }) {
  const styles = {
    high: "bg-rose-50 border-rose-100 text-rose-900",
    medium: "bg-amber-50 border-amber-100 text-amber-900",
    info: "bg-blue-50 border-blue-100 text-blue-900",
  }[severity] || "bg-gray-50 border-gray-100 text-gray-900";

  const Icon = {
    high: AlertCircle,
    medium: Info,
    info: Info,
  }[severity] || Info;

  return (
    <div className={cn("p-4 rounded-2xl border flex gap-4 items-start", styles)}>
      <Icon className="shrink-0 mt-0.5" size={20} />
      <p className="font-medium text-sm leading-relaxed">{message}</p>
    </div>
  );
}

function OpsChart({ data, color, isCpu }: { data: any[], color: string, isCpu?: boolean }) {
  const chartData = data.map(op => ({
    name: op.name.length > 20 ? op.name.substring(0, 17) + '...' : op.name,
    fullName: op.name,
    value: Math.round(op.duration_us / 1000)
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            fontSize={11} 
            fontWeight={600}
            tick={{ fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#F8FAFC' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-800">
                    <p className="font-bold mb-1">{payload[0].payload.fullName}</p>
                    <p className="text-slate-400">{payload[0].value} ms</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((_, index) => {
              let cellColor = color;
              let opacity = 1 - (index * 0.1);
              
              if (isCpu && index < 3) {
                // Highlight top 3 CPU ops with a more vibrant version or different color
                cellColor = "#EF4444"; // Strong red for slowest ops
                opacity = 1;
              }

              return <Cell key={`cell-${index}`} fill={cellColor} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-32" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Bottlenecks Skeleton */}
          <section>
            <div className="h-6 w-48 bg-gray-200 rounded-md mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl border border-gray-50" />
              ))}
            </div>
          </section>

          {/* Charts Skeleton */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 h-80" />
            <div className="bg-white p-6 rounded-3xl border border-gray-100 h-80" />
          </section>
        </div>

        {/* Report Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] h-[600px] border border-slate-800" />
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center pt-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
          Analyzing Deep Learning Trace...
        </p>
      </div>
    </div>
  );
}

export default App;
