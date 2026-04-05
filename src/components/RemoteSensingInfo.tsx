import React from 'react';
import { Info, Satellite, Map, Leaf, Wind, AlertTriangle } from 'lucide-react';

const RemoteSensingInfo: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Remote Sensing & NDVI</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Educational Resource Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-1">
              <Satellite className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">What is Remote Sensing?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Remote sensing is the process of detecting and monitoring the physical characteristics of an area by measuring its reflected and emitted radiation at a distance (typically from satellite or aircraft).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-1">
              <Map className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">What is Sentinel-2?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Sentinel-2 is a European Space Agency (ESA) mission that provides high-resolution optical imagery for land monitoring. It has 13 spectral bands, including Near-Infrared (NIR) and Red, which are essential for vegetation analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-1">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">What is NDVI?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                NDVI (Normalized Difference Vegetation Index) is a numerical indicator that uses the visible (Red) and near-infrared (NIR) bands of the electromagnetic spectrum to analyze whether the target being observed contains live green vegetation or not.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 mt-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Why NDVI detects health?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Healthy vegetation absorbs most of the visible light that hits it, and reflects a large portion of the near-infrared light. Unhealthy or sparse vegetation reflects more visible light and less near-infrared light.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-blue-400" />
          <h4 className="text-sm font-black uppercase tracking-widest">NDVI Calculation Formula</h4>
        </div>
        <div className="text-center p-4 bg-white/10 rounded-xl border border-white/10">
          <p className="text-2xl font-black tracking-widest">NDVI = (NIR - Red) / (NIR + Red)</p>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Bands: NIR (B8) | Red (B4)</p>
        </div>
      </div>
    </div>
  );
};

export default RemoteSensingInfo;
