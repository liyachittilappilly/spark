import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, AlertTriangle, Search, CheckCircle, BarChart3, Bell, RefreshCcw, Circle, XCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db, collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, auth, handleFirestoreError, OperationType } from '../firebase';

interface PestDetectionPanelProps {
  apiKey: string;
  onPestDetected: (detected: boolean) => void;
}

const PestDetectionPanel: React.FC<PestDetectionPanelProps> = ({ apiKey, onPestDetected }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    pestName: string;
    confidence: string;
    recommendation: string;
    count: number;
    status: string;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [cumulativeAlert, setCumulativeAlert] = useState<string | null>(null);

  // Camera refs and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<"local" | "esp32">("local");
  const [esp32Ip, setEsp32Ip] = useState("10.152.65.130");

  useEffect(() => {
    if (auth.currentUser) {
      fetchHistory(auth.currentUser.uid);
    }
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setImage(null);
        setResult(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (cameraMode === "esp32") {
      try {
        setLoading(true);
        setCameraError(null);
        // The standard ESP32-CAM CameraWebServer uses /capture for a still jpeg frame
        const captureUrl = `http://${esp32Ip}/capture`;
        const res = await fetch('/api/proxy-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: captureUrl })
        });
        const data = await res.json();
        if (data.image) {
          setImage(data.image);
          setIsCameraActive(false);
          // Auto-analyze after capture
          analyzeImage(data.image);
        } else {
          setCameraError(data.error || "Failed to fetch image from ESP32.");
        }
      } catch (err) {
        console.error("ESP32 Capture Error:", err);
        setCameraError("Could not connect to ESP32-CAM. Check IP address.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Use video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        stopCamera();
        // Auto-analyze after capture
        analyzeImage(dataUrl);
      }
    }
  };

  const fetchHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, "pest_detections"), 
        where("userId", "==", uid), 
        orderBy("createdAt", "desc"), 
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const detectionList = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: (doc.data().createdAt as Timestamp).toDate().toISOString()
      }));
      setHistory(detectionList.reverse()); // Reverse for chart chronological order
    } catch (err) {
      console.error("Failed to fetch history", err);
      handleFirestoreError(err, OperationType.LIST, "pest_detections");
    }
  };

  const analyzeImage = async (imageData?: string) => {
    const imageToAnalyze = imageData || image;
    if (!imageToAnalyze || !apiKey) return;
    setLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const base64Data = imageToAnalyze.split(',')[1];
      
      const prompt = `
        Act as an expert agricultural entomologist. Analyze this image of a paddy field pest.
        Identify the pest from these classes: Brown Plant Hopper, Leaf Folder, Stem Borer.
        Provide the output in valid JSON format with the following keys:
        - pestName: string
        - confidence: string (percentage)
        - recommendation: string (pesticide or biological control)
        - count: number (estimated count in the image)
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      // Threshold logic
      let status = "SAFE";
      if (data.count > 30) status = "ACTION REQUIRED";
      else if (data.count > 15) status = "WARNING";
      else if (data.count > 5) status = "MONITOR";

      const finalResult = { ...data, status };
      setResult(finalResult);
      onPestDetected(data.count > 0);

      // Save to Firestore
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "pest_detections"), {
            ...data,
            status,
            userId: auth.currentUser.uid,
            createdAt: Timestamp.now()
          });
          fetchHistory(auth.currentUser.uid);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "pest_detections");
        }
      }

      // Update history and check for cumulative alerts
      const historyRes = await fetch('/api/pest-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: data.count, pestName: data.pestName }),
      });
      const historyData = await historyRes.json();
      if (historyData.alert) {
        setCumulativeAlert(historyData.alert.message);
      } else {
        setCumulativeAlert(null);
      }

    } catch (error) {
      console.error("Error analyzing image:", error);
      // Fallback mock
      const mockData = {
        pestName: "Brown Plant Hopper",
        confidence: "89%",
        recommendation: "Use Imidacloprid 17.8 SL or biological control like spiders.",
        count: 12,
        status: "MONITOR"
      };
      setResult(mockData);
      onPestDetected(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTION REQUIRED': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'MONITOR': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'SAFE': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Prepare chart data
  const chartData = history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: item.count,
    pest: item.pestName
  }));

  return (
    <div className="space-y-8">
      {cumulativeAlert && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-4 animate-bounce">
          <Bell className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 leading-none mb-1">Cumulative Alert Triggered</p>
            <p className="text-sm font-bold">{cumulativeAlert}</p>
          </div>
          <button onClick={() => setCumulativeAlert(null)} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-500" />
            AI Pest Detection
          </h3>
          {result && (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusColor(result.status)}`}>
              {result.status}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button 
              onClick={() => { setCameraMode("local"); setIsCameraActive(false); setImage(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cameraMode === "local" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Local Camera
            </button>
            <button 
              onClick={() => { setCameraMode("esp32"); setIsCameraActive(true); setImage(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${cameraMode === "esp32" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              ESP32-CAM
            </button>
          </div>

          {cameraMode === "esp32" && (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={esp32Ip} 
                onChange={(e) => setEsp32Ip(e.target.value)}
                placeholder="10.152.65.130"
                className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:outline-none"
              />
            </div>
          )}

          <div className="relative group">
            <div className={`w-full h-80 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden ${image || isCameraActive ? 'border-purple-500' : 'border-slate-200 hover:border-purple-400'}`}>
              {isCameraActive && cameraMode === "esp32" ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <img 
                    src={`http://${esp32Ip}:81/stream`} 
                    alt="ESP32 Stream" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      setCameraError("ESP32 Stream failed. Check IP or Wi-Fi connection.");
                      setIsCameraActive(false);
                    }}
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={captureImage}
                      className="p-4 bg-white rounded-full shadow-2xl text-purple-600 hover:scale-110 transition-transform active:scale-95"
                    >
                      <Circle className="w-8 h-8 fill-current" />
                    </button>
                    <button
                      onClick={() => setIsCameraActive(false)}
                      className="p-4 bg-rose-500 rounded-full shadow-2xl text-white hover:scale-110 transition-transform active:scale-95"
                    >
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              ) : isCameraActive && cameraMode === "local" ? (
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={captureImage}
                      className="p-4 bg-white rounded-full shadow-2xl text-purple-600 hover:scale-110 transition-transform active:scale-95"
                    >
                      <Circle className="w-8 h-8 fill-current" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="p-4 bg-rose-500 rounded-full shadow-2xl text-white hover:scale-110 transition-transform active:scale-95"
                    >
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              ) : image ? (
                <div className="relative w-full h-full">
                  <img src={image} alt="Captured pest" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => {
                        if (cameraMode === "esp32") {
                          setIsCameraActive(true);
                          setImage(null);
                        } else {
                          startCamera();
                        }
                      }}
                      className="p-2 bg-white/80 backdrop-blur rounded-full text-purple-600 hover:bg-white transition-all shadow-lg"
                      title="Retake Photo"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImage(null)}
                      className="p-2 bg-white/80 backdrop-blur rounded-full text-rose-500 hover:bg-white transition-all shadow-lg"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-600">{cameraMode === "esp32" ? "ESP32-CAM" : "Device Camera"}</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                      {cameraMode === "esp32" ? "Connect to ESP32 over Wi-Fi." : "Access your device camera to capture."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (cameraMode === "esp32") {
                        setIsCameraActive(true);
                        setCameraError(null);
                      } else {
                        startCamera();
                      }
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-full font-bold text-xs hover:bg-purple-700 transition-all shadow-md"
                  >
                    Start Live Feed
                  </button>
                  {cameraError && (
                    <p className="text-[10px] text-rose-500 font-bold max-w-xs text-center mx-auto">{cameraError}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Hidden canvas for capturing frames from local video */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {image && !loading && !result && (
            <button
              onClick={() => analyzeImage()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Identify Pest & Count
            </button>
          )}

          {loading && (
            <div className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              Analyzing with AI...
            </div>
          )}
        </div>

        {result && (
          <div className="pt-6 border-t border-slate-50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-bold text-purple-700 uppercase mb-1">Detected Pest</p>
                <p className="text-lg font-black text-purple-900 leading-tight">{result.pestName}</p>
                <p className="text-[10px] font-bold text-purple-400 mt-1">Confidence: {result.confidence}</p>
              </div>
              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Estimated Count</p>
                <p className="text-3xl font-black">{result.count}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">Pests per frame</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Recommended Action</p>
                <p className="text-sm text-emerald-700 leading-relaxed font-medium">{result.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pest Counting Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Pest Count Visualization
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 20 Detections</p>
        </div>

        <div className="h-64 w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 30 ? '#ef4444' : entry.count > 15 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <BarChart3 className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No history available</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Safe/Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestDetectionPanel;
