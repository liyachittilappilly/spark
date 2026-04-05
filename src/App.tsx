import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map as MapIcon, CloudSun, Bug, ShieldAlert, BookOpen, Info, AlertTriangle, CheckCircle, Activity, TrendingUp, Camera, ShieldCheck, Leaf, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import Map from './components/Map';
import NDVIPanel from './components/NDVIPanel';
import WeatherPanel from './components/WeatherPanel';
import PestDetectionPanel from './components/PestDetectionPanel';
import RemoteSensingInfo from './components/RemoteSensingInfo';
import GeminiAdvisor from './components/GeminiAdvisor';
import { auth, loginWithGoogle, logout, db, collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, onAuthStateChanged, User } from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ndviData, setNdviData] = useState<any>(null);
  const [ndviLoading, setNdviLoading] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        fetchFarms(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFarms = async (uid: string) => {
    try {
      const q = query(collection(db, "farms"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const farmList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setFarms(farmList);
      if (farmList.length > 0) {
        // Automatically load the latest farm's NDVI if available
        handlePolygonCreated(farmList[0].polygon, false);
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    }
  };

  const handlePolygonCreated = async (polygon: any, saveToDb = true) => {
    setNdviLoading(true);
    try {
      const response = await fetch('/api/ndvi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon }),
      });
      const data = await response.json();
      setNdviData(data);

      if (saveToDb && user) {
        await addDoc(collection(db, "farms"), {
          name: `Farm ${new Date().toLocaleDateString()}`,
          polygon,
          userId: user.uid,
          createdAt: Timestamp.now()
        });
        fetchFarms(user.uid);
      }
    } catch (error) {
      console.error('Error fetching NDVI:', error);
    } finally {
      setNdviLoading(false);
    }
  };

  const handlePredictPest = async (tmax: number, rf: number, rh: number) => {
    setPredictionLoading(true);
    try {
      const response = await fetch('/api/predict-pest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmax, rf, rh }),
      });
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Error predicting pest:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.warn("Using mock user due to login failure.", error);
      const mockUser = {
        uid: 'mock-user-' + Date.now(),
        displayName: 'Guest User (Mocked)',
        email: 'guest@paddyguard.ai',
        providerData: []
      } as unknown as User;
      setUser(mockUser);
      // Simulate fetching some mock data if needed, or an empty list
      setFarms([]);
    }
  };

  const getOverallStatus = () => {
    if (!ndviData && !predictionData) return 'SAFE';
    
    const statuses = [];
    
    // NDVI check
    if (ndviData?.classification === 'Low') statuses.push('WARNING');
    
    // Prediction check
    if (predictionData) {
      const bph = parseFloat(predictionData.predictedBPH);
      if (bph > 30) return 'ACTION REQUIRED';
      if (bph > 16) statuses.push('WARNING');
      if (bph > 6) statuses.push('MONITOR');
      
      // Check other pests
      const highestChance = Math.max(...predictionData.pests.map((p: any) => p.chance));
      if (highestChance > 80) statuses.push('WARNING');
      else if (highestChance > 50) statuses.push('MONITOR');
    }
    
    if (statuses.includes('WARNING')) return 'WARNING';
    if (statuses.includes('MONITOR')) return 'MONITOR';
    return 'SAFE';
  };

  const overallStatus = getOverallStatus();

  const [pestDetected, setPestDetected] = useState(false);

  // Decision Engine Call
  const [decision, setDecision] = useState<any>(null);
  useEffect(() => {
    if (ndviData || predictionData || pestDetected) {
      fetch('/api/decision-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ndvi: parseFloat(ndviData?.stats?.mean || '0.5'),
          predictedBPH: parseFloat(predictionData?.predictedBPH || '0'),
          pestDetected: pestDetected
        })
      })
      .then(res => res.json())
      .then(setDecision);
    }
  }, [ndviData, predictionData, pestDetected]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">PaddyGuard AI</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Pest Detection System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Remote Sensing Info
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Welcome</p>
                  <p className="text-xs font-black text-slate-700">{user.displayName?.split(' ')[0]}</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-2.5 bg-slate-100 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-emerald-200"
              >
                <LogIn className="w-4 h-4" />
                Login with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {!user && !authLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-8 bg-emerald-50 rounded-full">
              <ShieldCheck className="w-20 h-20 text-emerald-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-black text-slate-800">Secure Your Farm Data</h2>
              <p className="text-slate-500 font-medium">Login to save your field boundaries, track pest detection history, and receive critical alerts.</p>
            </div>
            <button 
              onClick={handleLogin}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-200"
            >
              <LogIn className="w-5 h-5" />
              Get Started Now
            </button>
          </div>
        ) : authLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <>
            {/* Top Stats / Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${overallStatus === 'SAFE' ? 'bg-emerald-50 text-emerald-500' : overallStatus === 'MONITOR' ? 'bg-blue-50 text-blue-500' : overallStatus === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-50'}`}>
                    <ShieldAlert className={`w-8 h-8 ${overallStatus === 'ACTION REQUIRED' ? 'text-rose-500' : ''}`} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">System Status: {overallStatus}</h2>
                    <p className="text-xs text-slate-400 font-medium">Combined analysis of NDVI, Weather, and Pest Detection</p>
                    {decision && (
                      <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        AI Insight: {decision.explanation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Sync</p>
                  <p className="text-sm font-black text-slate-700">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ETL Threshold</p>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-black">20</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BPH per night</p>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Map & NDVI */}
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-emerald-500" />
                      Crop Health Map
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Sentinel-2 Live
                    </div>
                  </div>
                  <Map onPolygonCreated={handlePolygonCreated} />
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <strong>How to use:</strong> Use the polygon tool on the top right of the map to draw your field boundary. The system will automatically fetch the latest Sentinel-2 NDVI data and analyze crop health.
                    </p>
                  </div>
                </div>

                <WeatherPanel 
                  onPredict={handlePredictPest} 
                  prediction={predictionData} 
                  loading={predictionLoading} 
                />
              </div>

              {/* Right Column: Analysis & Detection */}
              <div className="lg:col-span-4 space-y-8">
                <NDVIPanel data={ndviData} loading={ndviLoading} />
                <PestDetectionPanel 
                  apiKey={process.env.GEMINI_API_KEY || ''} 
                  onPestDetected={setPestDetected}
                />
                
                <GeminiAdvisor />
                
                {/* IPM Recommendations */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    IPM Recommendations
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                      <p className="text-xs font-bold text-emerald-700 uppercase">Biological Control</p>
                      <p className="text-xs text-emerald-600 leading-relaxed">Encourage natural enemies like spiders, mirid bugs, and damselflies. Avoid early season spraying.</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                      <p className="text-xs font-bold text-blue-700 uppercase">Cultural Practices</p>
                      <p className="text-xs text-blue-600 leading-relaxed">Maintain proper spacing and use resistant varieties. Alternate wetting and drying (AWD) irrigation.</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                      <p className="text-xs font-bold text-amber-700 uppercase">Targeted Spraying</p>
                      <p className="text-xs text-amber-600 leading-relaxed">Only spray if ETL is reached. Focus on the base of the plant where BPH congregates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <RemoteSensingInfo />
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GEE: Connected</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 PaddyGuard AI • Precision Agriculture</p>
        </div>
      </footer>
    </div>
  );
}
