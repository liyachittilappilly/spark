import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Info, Leaf } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NDVIPanelProps {
  data: {
    stats: {
      min: string;
      max: string;
      mean: string;
    };
    classification: string;
    tileUrl: string;
  } | null;
  loading: boolean;
}

interface HistoryData {
  date: string;
  ndvi: number;
}

const NDVIPanel: React.FC<NDVIPanelProps> = ({ data, loading }) => {
  const [history, setHistory] = useState<HistoryData[]>([]);

  useEffect(() => {
    if (data) {
      fetch('/api/ndvi-history')
        .then(res => res.json())
        .then(setHistory);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm animate-pulse border border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-slate-100 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-center">
        <Leaf className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">No area selected</p>
        <p className="text-sm">Draw a polygon on the map to analyze crop health.</p>
      </div>
    );
  }

  const getHealthColor = (classification: string) => {
    switch (classification) {
      case 'High': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          NDVI Analysis
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getHealthColor(data.classification)}`}>
          {data.classification} Health
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Mean</p>
          <p className="text-xl font-black text-slate-700">{data.stats.mean}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Min</p>
          <p className="text-xl font-black text-slate-700">{data.stats.min}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Max</p>
          <p className="text-xl font-black text-slate-700">{data.stats.max}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            NDVI Trend (Sentinel-2)
          </p>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Last 10 Days</span>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={(str) => str.split('-').slice(1).join('/')}
              />
              <YAxis 
                domain={[0, 1]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="ndvi" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50">
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Insight:</strong> {data.classification === 'Low' 
              ? 'Low NDVI indicates crop stress. Check for pests or water deficiency.' 
              : 'NDVI values suggest healthy chlorophyll concentration and growth.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NDVIPanel;
