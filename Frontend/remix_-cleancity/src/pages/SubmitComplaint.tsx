import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Trash2, ShieldAlert, Hammer, Info, Send, Calendar, Tag, ShieldCheck, CheckCircle2, Cpu, Edit, RefreshCw, Upload, Compass, Video, VideoOff, AlertCircle, Loader2, Mic, MicOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComplaintCategory, ComplaintPriority } from '../types';
import { submitComplaint, analyzeComplaint } from '../services/api';

export const SubmitComplaint: React.FC = () => {
  const { submitGrievance, t, currentLanguage } = useApp();
  const navigate = useNavigate();

  // Submission Flow states: 'FORM' -> 'AI_SCANNING' -> 'AI_COMPLETE'
  const [stage, setStage] = useState<'FORM' | 'AI_SCANNING' | 'AI_COMPLETE'>('FORM');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Vision core...');

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Plastic');
  const [aiPriority, setAiPriority] = useState("");
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiReason, setAiReason] = useState("");
  const [beforeImage, setBeforeImage] = useState('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(40.7580);
  const [longitude, setLongitude] = useState(-73.9855);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  // Live Camera & Upload states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Live GPS Fetch state
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Speech Recognition / Voice typing states & refs
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    // Set default titles based on selected language
    if (currentLanguage === 'hindi') {
      setTitle('सार्वजनिक कचरा संचय');
    } else if (currentLanguage === 'marathi') {
      setTitle('सार्वजनिक कचरा साचणे');
    } else {
      setTitle('Illegal Trash Accumulation');
    }
  }, [currentLanguage]);

  const runSpeechSimulation = () => {
    setIsListening(true);
    setSpeechError("Mic restricted in sandbox. Activating smart voice text simulation...");
    
    setTimeout(() => {
      setSpeechError(null);
    }, 4500);

    const speechSimulations = [
      "Overflowing plastic containers and metal cans scattered around the park pathway.",
      "Unmanaged construction debris and concrete blockages detected here.",
      "Organic household garbage pile leaking foul liquids onto the main district street.",
      "Illegal dumping of commercial wood boxes and old furniture next to the primary bin."
    ];
    const randomSpeech = speechSimulations[Math.floor(Math.random() * speechSimulations.length)];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < randomSpeech.length) {
        setDescription(prev => prev + randomSpeech[index]);
        index++;
      } else {
        clearInterval(interval);
        setIsListening(false);
      }
    }, 40);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguage === 'hindi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setDescription(prev => prev + (prev ? ' ' : '') + resultText);
        }
      };

    recognition.onerror = (event: any) => {
  console.error("Speech recognition error:", event.error);

  setIsListening(false);

  if (event.error === "not-allowed") {
    setSpeechError("Microphone permission denied. Please allow microphone access.");
  } else if (event.error === "no-speech") {
    setSpeechError("No speech detected. Please try again.");
  } else if (event.error === "audio-capture") {
    setSpeechError("Microphone could not be accessed.");
  } else {
    setSpeechError("Voice typing is unavailable. Please try again.");
  }
};

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Stop speech recognition failed:", e);
        }
      }
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        runSpeechSimulation();
      } else {
        try {
          setSpeechError(null);
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Failed to start speech recognition, falling back:", err);
          runSpeechSimulation();
        }
      }
    }
  };

  // Refs for media devices
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // UI state overlays
  const [showGpsToast, setShowGpsToast] = useState(false);
  const [hasTimestamp, setHasTimestamp] = useState(false);
  const [hasTaggedBin, setHasTaggedBin] = useState(false);

  // Camera stream attachment effect
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported or disabled in this iframe context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.message || "Failed to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setBeforeImage(dataUrl);
          setIsLocationConfirmed(false); // require re-confirmation after photo upload
          stopCamera();
        }
      } catch (err) {
        console.error("Error capturing photo:", err);
        alert("Failed to capture image frame.");
      }
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBeforeImage(event.target.result as string);
          setIsLocationConfirmed(false); // require re-confirmation after photo upload
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchLiveLocation = () => {
    setIsFetchingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      const fallbackLat = 28.6139 + (Math.random() - 0.5) * 0.01; // default to Delhi region area coordinates
      const fallbackLng = 77.2090 + (Math.random() - 0.5) * 0.01;
      setLatitude(fallbackLat);
      setLongitude(fallbackLng);
      setAddress(currentLanguage === 'hindi' ? 'चाणक्यपुरी, नई दिल्ली (जीपीएस फॉलबैक)' : 'Chanakyapuri, New Delhi (GPS Fallback)');
      setLocationError("GPS not supported. Sandbox fallback coordinates active.");
      setIsFetchingLocation(false);
      setShowGpsToast(true);
      setTimeout(() => setShowGpsToast(false), 4000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        setShowGpsToast(true);
        setTimeout(() => setShowGpsToast(false), 4000);

        try {
          // Attempt reverse geocoding via Nominatim API (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: {
                'Accept-Language': currentLanguage === 'hindi' ? 'hi' : 'en'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`GPS Zone: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          } else {
            setAddress(`GPS Zone: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
          setAddress(`GPS Zone: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.warn("Geolocation fallback inside sandbox:", error);
        
        const fallbackLat = 28.6139 + (Math.random() - 0.5) * 0.005;
        const fallbackLng = 77.2090 + (Math.random() - 0.5) * 0.005;
        setLatitude(fallbackLat);
        setLongitude(fallbackLng);
        setAddress(currentLanguage === 'hindi' ? 'स्वच्छता जोन २४, नई दिल्ली (सिम्युलेटेड जीपीएस)' : 'Swachhata Ward 24, New Delhi (Simulated GPS)');
        
        setLocationError("Permission blocked in sandbox. Using simulated high accuracy coordinates.");
        setIsFetchingLocation(false);
        
        setShowGpsToast(true);
        setTimeout(() => setShowGpsToast(false), 4000);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  };

  // Linear coordinate mapping for smooth map-clicking
  const mapClickToCoords = (clickXPercent: number, clickYPercent: number) => {
    // Map X (0 to 100) to Longitude (-74.0200 to -73.9200)
    const lng = -74.0200 + (clickXPercent / 100) * 0.1000;
    // Map Y (0 to 100) to Latitude (40.8000 - clickYPercent/100 * 0.1000)
    const lat = 40.8000 - (clickYPercent / 100) * 0.1000;
    return { lat, lng };
  };

  const getSvgCoords = (lat: number, lng: number) => {
    // Inverse mapping to find X and Y percent
    const x = Math.min(Math.max(((lng - (-74.0200)) / 0.1000) * 100, 5), 95);
    const y = Math.min(Math.max(((40.8000 - lat) / 0.1000) * 100, 5), 95);
    return { x, y };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;
    
    const { lat, lng } = mapClickToCoords(percentX, percentY);
    setLatitude(lat);
    setLongitude(lng);
    setIsLocationConfirmed(false); // require re-confirmation on change!
    setAddress(`Selected Spot near Central Park West Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  useEffect(() => {
    // Do not automatically use the phone's current location because the user may upload the photo later from a different place.
    // Instead, prompt user to manually select or input.
    setAddress("Please select a point on the map or enter address manually");
  }, []);

  // AI Scanning Simulator
  useEffect(() => {
    if (stage !== 'AI_SCANNING') return;

    setProgress(0);
    const stages = [
      { limit: 25, text: currentLanguage === 'hindi' ? 'पर्यावरण टेलीमेट्री को स्कैन किया जा रहा है...' : 'Scanning environmental telemetry...' },
      { limit: 55, text: currentLanguage === 'hindi' ? 'कचरे के प्रकार की पहचान की जा रही है...' : 'Detecting debris category polygons...' },
      { limit: 80, text: currentLanguage === 'hindi' ? 'प्रगति और गंभीरता दर का आकलन...' : 'Calculating municipal severity indexes...' },
      { limit: 100, text: currentLanguage === 'hindi' ? 'वर्गीकरण रिपोर्ट तैयार की जा रही है...' : 'Finalizing classification matrix...' }
    ];

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        if (next >= 100) {
          clearInterval(timer);
          setStage('AI_COMPLETE');
          setStatusText('Vision Analysis Completed.');
          return 100;
        }

        const currentStage = stages.find(s => next <= s.limit);
        if (currentStage) {
          setStatusText(currentStage.text);
        }
        return next;
      });
    }, 140);

    return () => clearInterval(timer);
  }, [stage, currentLanguage]);

 const handleInitialSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!isLocationConfirmed) {
    alert(
      currentLanguage === "hindi"
        ? "कृपया पहले अपनी शिकायत की स्थिति की पुष्टि करें।"
        : "Please confirm your complaint location first."
    );
    return;
  }

  setStage("AI_SCANNING");

  try {
    const imageFile = await base64ToFile(beforeImage, "complaint.jpg");

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("category", category);
    formData.append("description", description);

    const aiResult = await analyzeComplaint(formData);

    console.log("AI Result:", aiResult);

    setCategory(aiResult.ai_category);
    setAiPriority(aiResult.priority);
    setAiConfidence(aiResult.confidence);
    setAiReason(aiResult.reason);

  } catch (err) {
    console.error(err);
  }
};

  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
  const res = await fetch(base64);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
  };


const handleDirectSubmit = async () => {
  if (!isLocationConfirmed) {
    alert(
      currentLanguage === "hindi"
        ? "कृपया पहले अपनी शिकायत की स्थिति की पुष्टि करें।"
        : "Please confirm your complaint location first."
    );
    return;
  }

  setIsConfirming(true);

  try {
    const imageFile = await base64ToFile(beforeImage, "complaint.jpg");

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("zone_id", "1");
    formData.append("category", category);
    formData.append("description", description);
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    formData.append("address", address);

    const created = await submitComplaint(formData);
    setCategory(created.ai_category);
    setAiPriority(created.priority);
    setAiConfidence(created.confidence);
    setAiReason(created.reason);

    setIsConfirming(false);

    // Duplicate complaint
    if (created.existing_complaint) {
      alert(created.message);
      return;
    }

    // Successful complaint
    if (created.complaint_id) {
      navigate(`/complaint/${created.complaint_id}`);
      return;
    }

    alert(created.message || "Complaint submission failed.");
  } catch (err) {
    console.error(err);
    setIsConfirming(false);
    alert("Complaint submission failed.");
  }
};

  const [isConfirming, setIsConfirming] = useState(false);

  const categories: { name: ComplaintCategory; label: string; icon: any }[] = [
    { name: 'Household', label: currentLanguage === 'hindi' ? 'घरेलू कचरा' : 'Household', icon: Trash2 },
    { name: 'Plastic', label: currentLanguage === 'hindi' ? 'प्लास्टिक' : 'Plastic', icon: RefreshCw },
    { name: 'Construction', label: currentLanguage === 'hindi' ? 'निर्माण मलबा' : 'Construction', icon: Hammer },
    { name: 'Hazardous', label: currentLanguage === 'hindi' ? 'खतरनाक अपशिष्ट' : 'Hazardous', icon: ShieldAlert }
  ];

  const garbagePics = [
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1605600611270-ac1244ef05a1?auto=format&fit=crop&q=80&w=800'
  ];

  const handleToggleImageMock = () => {
    const randomIdx = Math.floor(Math.random() * garbagePics.length);
    setBeforeImage(garbagePics[randomIdx]);
    setIsLocationConfirmed(false); // require re-confirmation after photo upload
  };

  return (
    <div className="space-y-6">
      {/* 1. INITIAL grievance FORM STAGE */}
      {stage === 'FORM' && (
        <>
          {/* Section: Evidence Capture */}
          <section className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative group">
            <div className="aspect-[4/3] w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  className="absolute inset-0 w-full h-full object-cover"
                  src={beforeImage}
                  alt="Live Evidence Cam"
                />
              )}

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-0 border-[16px] border-black/10 flex items-center justify-center pointer-events-none z-10">
                <div className="w-24 h-24 border-2 border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-white absolute top-0 left-0" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-white absolute top-0 right-0" />
                  <div className="w-6 h-6 border-b-2 border-l-2 border-white absolute bottom-0 left-0" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-white absolute bottom-0 right-0" />
                </div>
              </div>

              {/* Action Cam triggers */}
              <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
                {isCameraActive ? (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-red-600 border-4 border-white/30 flex items-center justify-center shadow-xl hover:scale-105 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Camera className="w-7 h-7 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
                    >
                      <VideoOff className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-14 h-14 rounded-full bg-emerald-600 border-4 border-white/30 flex items-center justify-center shadow-xl hover:scale-105 active:scale-90 transition-transform cursor-pointer"
                      title={t('camera_capture')}
                    >
                      <Video className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-slate-900/80 transition-colors cursor-pointer"
                      title={t('upload_photo')}
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleImageMock}
                      className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-slate-900/80 transition-colors cursor-pointer"
                      title="Cycle Presets"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Live Tag */}
              <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-[9px] font-black tracking-widest flex items-center gap-1.5 z-20">
                <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                {isCameraActive ? 'LIVE VIEW' : 'EVIDENCE SECURED'}
              </div>
            </div>

            {cameraError && (
              <div className="p-4 bg-red-50 border-t border-red-100 flex items-center gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="p-5 flex items-center justify-between bg-slate-50 border-t border-slate-100">
              <div>
                <h3 className="font-extrabold text-xs text-slate-800 leading-tight">
                  {currentLanguage === 'hindi' ? 'साक्ष्य फोटो' : 'Evidence Capture'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentLanguage === 'hindi' ? 'कैमरा शुरू करें या अपने गैलरी से फोटो अपलोड करें' : 'Capture live photo, upload or cycle presets'}
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </section>

          {/* Section: Location Detected */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1 w-full">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {currentLanguage === 'hindi' ? 'जीपीएस पता' : 'GPS Location'}
                  </h3>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-xs font-extrabold text-slate-800 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/35 rounded-lg border border-slate-100 bg-slate-50/50 p-2 truncate"
                    placeholder="Enter or capture location address"
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={fetchLiveLocation}
                disabled={isFetchingLocation}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
              >
                {isFetchingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {currentLanguage === 'hindi' ? 'जीपीएस खोज...' : 'Acquiring GPS...'}
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    {t('gps_location')}
                  </>
                )}
              </button>
            </div>

            {/* Coordinate Badges */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50">
              <div className="bg-slate-50 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-100">
                LAT: <span className="font-extrabold text-emerald-700">{latitude.toFixed(6)}</span>
              </div>
              <div className="bg-slate-50 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-100">
                LNG: <span className="font-extrabold text-emerald-700">{longitude.toFixed(6)}</span>
              </div>
              {locationError ? (
                <div className="text-[10px] text-red-600 font-semibold flex items-center gap-1 ml-auto">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  {locationError}
                </div>
              ) : (
                <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1.5 ml-auto">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  {currentLanguage === 'hindi' ? 'लाइव जीपीएस सिग्नल' : 'Live GPS Signal Locked'}
                </div>
              )}
            </div>

            {/* Dynamic Minimap */}
            <div 
              onClick={handleMapClick}
              className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-950 shadow-inner cursor-crosshair group hover:border-emerald-500/40 transition-colors"
              title="Click on the map to pinpoint waste location"
            >
              <svg className="w-full h-full opacity-40 select-none pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M -10,30 Q 30,50 60,20 T 110,40 L 110,110 L -10,110 Z" fill="#0f172a" />
                <line x1="10" y1="0" x2="10" y2="100" stroke="#334155" strokeWidth="0.5" />
                <line x1="30" y1="0" x2="30" y2="100" stroke="#334155" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="0.5" />
                <line x1="70" y1="0" x2="70" y2="100" stroke="#334155" strokeWidth="0.5" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#334155" strokeWidth="0.5" />
                <line x1="0" y1="60" x2="100" y2="60" stroke="#334155" strokeWidth="0.5" />
                <rect x="15" y="10" width="15" height="15" rx="2" fill="#064e3b" opacity="0.3" />
                <rect x="60" y="65" width="20" height="20" rx="2" fill="#064e3b" opacity="0.3" />
              </svg>

              <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-800 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-300 shadow-md pointer-events-none">
                🛰️ Live GIS Feed: <span className="text-emerald-400 font-extrabold">{latitude.toFixed(4)}°, {longitude.toFixed(4)}°</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-emerald-950/80 text-emerald-400 border border-emerald-800 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold pointer-events-none animate-pulse">
                Click map to select location
              </div>

              <div 
                className="absolute pointer-events-none"
                style={{
                  left: `${getSvgCoords(latitude, longitude).x}%`,
                  top: `${getSvgCoords(latitude, longitude).y}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="absolute top-3 -inset-3.5 rounded-full bg-emerald-500/30 animate-ping" />
                  <div className="bg-emerald-600 border border-emerald-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap mb-1">
                    {currentLanguage === 'hindi' ? 'शिकायत स्थल' : 'Complaint Location'}
                  </div>
                  <MapPin className="w-7 h-7 text-emerald-400 fill-emerald-950/80 drop-shadow-xl" />
                </div>
              </div>
            </div>

            {/* Location Confirmation Banner and Action */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all duration-300 ${
              isLocationConfirmed 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50/70 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                  isLocationConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isLocationConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 animate-bounce" />}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {isLocationConfirmed ? 'Location Confirmed' : 'Verification Required'}
                  </h4>
                  <p className="text-[10px] opacity-90 font-medium leading-tight">
                    {isLocationConfirmed 
                      ? 'The spot is locked. Ready for AI inspection.' 
                      : 'Please verify the address or tap on the map to pinpoint, then click confirm.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!address.trim() || address === "Please select a point on the map or enter address manually") {
                    alert("Please select a location or input a valid manual address before confirming.");
                    return;
                  }
                  setIsLocationConfirmed(true);
                }}
                className={`w-full sm:w-auto py-2 px-4 rounded-xl text-xs font-extrabold border shadow-sm transition-all duration-300 cursor-pointer ${
                  isLocationConfirmed 
                    ? 'bg-emerald-100/60 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                }`}
              >
                {isLocationConfirmed ? '✓ Locked & Confirmed' : 'Confirm Location'}
              </button>
            </div>
          </section>

          {/* Section: Form Fields */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
                {currentLanguage === 'hindi' ? 'रिपोर्ट विवरण भरें' : 'Report Parameters Details'}
              </h3>


              {/* Waste Category Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">
                  {t('choose_category')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((item) => {
                    const Icon = item.icon;
                    const isSelected = category === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setCategory(item.name)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-700 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 font-bold'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-xs">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description textarea with voice typing */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1 mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {t('add_description')}
                  </label>
                  
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold transition-all duration-300 cursor-pointer ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/20'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100/50'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 animate-bounce" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        {currentLanguage === 'hindi' ? 'आवाज से लिखें' : 'Write with Voice'}
                      </>
                    )}
                  </button>
                </div>

                {speechError && (
                  <div className="bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {speechError}
                  </div>
                )}
                
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder={currentLanguage === 'hindi' ? 'उदा. यहां बहुत बदबू आ रही है और मुख्य रास्ता अवरुद्ध हो गया है...' : 'e.g. Large pile leaking smelly fluids blocks sidewalk...'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>



              {/* Submit to AI analysis or Submit Directly side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isConfirming}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-5 h-5 animate-pulse" />
                  {currentLanguage === 'hindi' ? 'एआई विजन स्कैन शुरू करें' : 'Analyze with Vision AI'}
                </button>
                <button
                  type="button"
                  onClick={handleDirectSubmit}
                  disabled={isConfirming}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-slate-800/10 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isConfirming 
                    ? (currentLanguage === 'hindi' ? 'भेजा जा रहा है...' : 'Submitting...') 
                    : (currentLanguage === 'hindi' ? 'सीधे सबमिट करें' : 'Submit Directly')}
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {/* 2. AI VISION SCANNING PROGRESS STAGE */}
      {stage === 'AI_SCANNING' && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-black text-slate-800">
              {currentLanguage === 'hindi' ? 'एआई विजन स्कैनिंग प्रगति पर है' : 'AI Analysis in Progress'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {currentLanguage === 'hindi' ? 'कृपया प्रतीक्षा करें, हमारा रोबोटिक विजन कचरे का विश्लेषण कर रहा है।' : 'Please wait while our vision system identifies the report details.'}
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-100 shadow-md">
            <img className="w-full h-full object-cover" src={beforeImage} alt="Scanning Source" />
            <div className="absolute inset-x-0 bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-80 h-1.5 shadow-[0_0_15px_#10b981]" style={{ top: `${progress}%`, transition: 'top 0.1s ease' }} />

            {progress > 40 && (
              <div className="absolute top-1/4 left-1/3 bg-emerald-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md z-10">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {category} identified
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-600 animate-pulse">{statusText}</span>
              <span className="text-slate-400">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full shadow-[0_0_10px_#10b981]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>
      )}

      {/* 3. AI COMPLETE - PRE-CONFIRMATION RESULTS PANEL */}
      {stage === 'AI_COMPLETE' && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 max-w-lg mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-black text-emerald-800 flex items-center justify-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              {currentLanguage === 'hindi' ? 'एआई पर्यावरण रिपोर्ट' : 'Environmental AI Report'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {currentLanguage === 'hindi' ? 'दर्ज करने से पहले स्वचालित एआई रिपोर्ट की जांच करें।' : 'Review classification parameters before finalizing submission.'}
            </p>
          </div>

          <div className="rounded-xl overflow-hidden aspect-video border border-slate-100 relative">
            <img className="w-full h-full object-cover" src={beforeImage} alt="Grievance Scene" />
            <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
             Verified {category}
            </div>
          </div>

          {/* Bento Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentLanguage === 'hindi' ? 'पहचाना गया वर्ग' : 'Detected Type'}
              </span>
              <span className="text-base font-extrabold text-slate-800">{category}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {currentLanguage === 'hindi' ? 'सफाई स्कोर' : 'Severity Rating'}
              </span>
             <span className="text-base font-extrabold text-emerald-600">
             {aiConfidence > 0 ? `${aiConfidence}%` : "AI Pending"}
            </span>
            </div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-center col-span-2 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Urgent Priority
                </span>
                <span className="text-xs font-black text-red-800">
                 {aiPriority ? `${aiPriority} Priority` : "Priority Pending"}
                </span>
              </div>
             <p className="text-[10px] text-red-600 leading-relaxed font-bold">
             {aiReason || "AI analysis will be available after successful processing."}
            </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">

  <button
    onClick={handleDirectSubmit}
    disabled={isConfirming}
    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2"
  >
    <Send className="w-4 h-4" />
    {isConfirming
      ? "Submitting..."
      : "Submit Complaint"}
  </button>

</div>
        </section>
      )}

      {/* Mobile-friendly lock indicator toast */}
      {showGpsToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl transition-all duration-300 z-50 animate-bounce">
          <CheckCircle2 className="text-emerald-500 w-5 h-5" />
          <span className="text-xs font-bold font-sans">
            {currentLanguage === 'hindi' ? 'जीपीएस लोकेशन सुरक्षित रूप से लॉक (±3m)' : 'GPS Location Locked (±3m)'}
          </span>
        </div>
      )}
    </div>
  );
};
