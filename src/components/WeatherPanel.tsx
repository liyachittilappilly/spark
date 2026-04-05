import React, { useState } from 'react';
import { CloudSun, Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, Info, Bug, Zap, TrendingUp } from 'lucide-react';

interface WeatherPanelProps {
  onPredict: (tmax: number, rf: number, rh: number) => void;
  prediction: {
    pests: any[];
    highestRisk: any;
    predictedBPH: string;
    sprayAlert: boolean;
    insights: any;
  } | null;
  loading: boolean;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ onPredict, prediction, loading }) => {
  const [tmax, setTmax] = useState(30);
  const [rf, setRf] = useState(5);
  const [rh, setRh] = useState(75);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict(tmax, rf, rh);
  };

  const getRiskColor = (chance: number) => {
    if (chance > 80) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (chance > 60) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (chance > 30) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-amber-500" />
          Pest Risk Prediction
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Zap className="w-3 h-3 text-amber-500" />
          AI Regression Model
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Thermometer className="w-3 h-3" /> Temp (°C)
          </label>
          <input 
            type="number" 
            value={tmax} 
            onChange={(e) => setTmax(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Wind className="w-3 h-3" /> Rainfall (mm)
          </label>
          <input 
            type="number" 
            value={rf} 
            onChange={(e) => setRf(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Droplets className="w-3 h-3" /> Humidity (%)
          </label>
          <input 
            type="number" 
            value={rh} 
            onChange={(e) => setRh(Number(e.target.value))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Calculating...' : 'Run Prediction'}
        </button>
      </form>

      {prediction && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* BPH Regression Result */}
          <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Predicted BPH Density</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-5xl font-black">{prediction.predictedBPH}</h4>
                  <span className="text-xs text-slate-400 font-bold">insects/night</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${prediction.sprayAlert ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'}`}>
                  {prediction.sprayAlert ? 'Spray Alert Active' : 'Below ETL'}
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Bug className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          </div>

          {/* Multi-Pest Risk Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediction.pests.map((pest) => (
              <div key={pest.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${getRiskColor(pest.chance)}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{pest.name}</p>
                  {pest.chance > 60 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{pest.chance}%</span>
                  <span className="text-[10px] font-bold opacity-60 uppercase">Risk</span>
                </div>
                <p className="text-[9px] mt-2 font-medium leading-tight opacity-80">{pest.description}</p>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase mb-1">Recommended Pesticide</p>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">{prediction.highestRisk.pesticide}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
              <CloudSun className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Weather Insight</p>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  {tmax > 30 ? prediction.insights.tempEffect : prediction.insights.humidityEffect}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherPanel;
