import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Camera, Clock, Coffee, LogOut, LogIn, CheckCircle, AlertCircle, Undo2, Calendar, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

// Face guide SVG path (head/face shape)
const FaceGuide = () => (
  <svg viewBox="0 0 200 260" className="w-48 h-60 sm:w-56 sm:h-72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 10 C45 10, 15 60, 15 110 C15 170, 45 230, 100 250 C155 230, 185 170, 185 110 C185 60, 155 10, 100 10Z" 
      stroke="white" strokeWidth="2.5" strokeDasharray="8 4" opacity="0.6" fill="none"/>
  </svg>
);

export const AttendancePage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [session, setSession] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [records, setRecords] = useState([]);
  const [hasBackdate, setHasBackdate] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [backdateMode, setBackdateMode] = useState(false);
  const [backdateDate, setBackdateDate] = useState('');
  const [backdateTime, setBackdateTime] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [faceScore, setFaceScore] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [faceRegistered, setFaceRegistered] = useState(null); // null=loading, true/false
  const [facePhoto, setFacePhoto] = useState(null);
  const [registerMode, setRegisterMode] = useState(false);
  const [registerPhoto, setRegisterPhoto] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [storedDescriptor, setStoredDescriptor] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [canUpdateFace, setCanUpdateFace] = useState(false);
  const [geoLocation, setGeoLocation] = useState(null);

  useEffect(() => {
    loadFaceModels();
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadFaceModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (e) {
      console.error('Failed to load face models:', e);
    }
  };

  const detectFaceDescriptor = async (imageElement) => {
    if (!modelsLoaded) return null;
    const detection = await faceapi.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks().withFaceDescriptor();
    return detection ? Array.from(detection.descriptor) : null;
  };

  const compareFaces = (desc1, desc2) => {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) return 0;
    const distance = faceapi.euclideanDistance(desc1, desc2);
    // face-api.js euclidean distance:
    // Same person: typically 0.0 - 0.4
    // Different person: typically 0.5 - 1.0+
    // Map: distance 0.0 = 100%, distance 0.6 = 0%
    const score = Math.max(0, Math.min(100, Math.round((1 - (distance / 0.6)) * 100)));
    return score;
  };

  const fetchData = async () => {
    try {
      const [sessionRes, todayRes, recordsRes, faceRes] = await Promise.all([
        axios.get(`${API}/auth/me-session`, { withCredentials: true }),
        axios.get(`${API}/attendance/today`, { withCredentials: true }),
        axios.get(`${API}/attendance/my`, { withCredentials: true }),
        axios.get(`${API}/attendance/face-status`, { withCredentials: true }),
      ]);
      setSession(sessionRes.data);
      setToday(todayRes.data);
      setRecords(recordsRes.data.records || []);
      setHasBackdate(recordsRes.data.has_backdate_token);
      setFaceRegistered(faceRes.data.registered);
      setFacePhoto(faceRes.data.face_photo);
      setCanUpdateFace(faceRes.data.can_update_face || false);
      
      // Load stored face descriptor
      if (faceRes.data.registered) {
        try {
          const descRes = await axios.get(`${API}/attendance/face-descriptor`, { withCredentials: true });
          if (descRes.data.face_descriptor) setStoredDescriptor(descRes.data.face_descriptor);
        } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const startCamera = async (action) => {
    setCurrentAction(action);
    setCapturedPhoto(null);
    setFaceScore(null);
    setCameraOpen(true);
    setCameraReady(false);
    
    // Request GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
        () => setGeoLocation(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (e) {
      toast.error('Tidak bisa mengakses kamera. Pastikan izin kamera diberikan.');
      setCameraOpen(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCameraOpen(false);
    setCameraReady(false);
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // --- Stamp timestamp & geo on photo ---
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const geoStr = geoLocation ? `${geoLocation.lat.toFixed(6)}, ${geoLocation.lng.toFixed(6)}` : 'Lokasi tidak tersedia';
    
    const lines = [
      `${dateStr}`,
      `${timeStr} WIB`,
      `Loc: ${geoStr}`,
    ];
    
    // Draw semi-transparent background at bottom
    const lineH = Math.max(16, canvas.height * 0.028);
    const padding = 8;
    const blockH = lines.length * (lineH + 2) + padding * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, canvas.height - blockH, canvas.width, blockH);
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${lineH}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, padding + 2, canvas.height - blockH + padding + i * (lineH + 2));
    });
    // ---
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedPhoto(dataUrl);
    stopCamera();
    
    // Real face comparison using face-api.js
    if (modelsLoaded && storedDescriptor) {
      setAnalyzing(true);
      setFaceScore(null);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = dataUrl;
        await new Promise(r => { img.onload = r; });
        
        const descriptor = await detectFaceDescriptor(img);
        if (descriptor) {
          const score = compareFaces(storedDescriptor, descriptor);
          setFaceScore(score);
        } else {
          setFaceScore(0);
          toast.error('Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.');
        }
      } catch (e) {
        console.error('Face comparison error:', e);
        setFaceScore(50);
      } finally {
        setAnalyzing(false);
      }
    } else {
      // Fallback if models not loaded or no stored descriptor
      setFaceScore(50);
    }
  };

  const submitAttendance = async () => {
    if (!capturedPhoto) { toast.error('Silakan foto wajah terlebih dahulu'); return; }
    setSubmitting(true);
    
    try {
      // Upload photo first
      const blob = await (await fetch(capturedPhoto)).blob();
      const fd = new FormData();
      fd.append('file', blob, 'attendance.jpg');
      const uploadRes = await axios.post(`${API}/upload/content-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const body = {
        action: currentAction,
        photo_url: uploadRes.data.url,
        face_score: faceScore || 0,
        geo_location: geoLocation || null,
      };
      
      if (backdateMode && backdateDate) {
        if (!backdateTime) {
          toast.error('Jam harus diisi untuk absen mundur');
          setSubmitting(false);
          return;
        }
        body.date = backdateDate;
        body.time = backdateTime;
      }
      
      const res = await axios.post(`${API}/attendance/clock`, body, { withCredentials: true });
      
      toast.success(res.data.message);
      setCapturedPhoto(null);
      setFaceScore(null);
      // Don't reset backdate mode — user may need to do more actions (break, clock out)
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal absen');
    } finally { setSubmitting(false); }
  };

  const startRegisterCamera = () => {
    setRegisterMode(true);
    setRegisterPhoto(null);
    setCameraOpen(true);
    setCameraReady(false);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      })
      .catch(() => { toast.error('Tidak bisa mengakses kamera'); setCameraOpen(false); setRegisterMode(false); });
  };

  const captureRegisterPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setRegisterPhoto(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const submitRegisterFace = async () => {
    if (!registerPhoto) return;
    setRegistering(true);
    try {
      // Extract face descriptor
      let descriptor = null;
      if (modelsLoaded) {
        const img = new Image();
        img.src = registerPhoto;
        await new Promise(r => { img.onload = r; });
        descriptor = await detectFaceDescriptor(img);
        if (!descriptor) {
          toast.error('Wajah tidak terdeteksi dalam foto. Pastikan wajah terlihat jelas dan coba lagi.');
          setRegistering(false);
          return;
        }
      }
      
      // Upload photo
      const blob = await (await fetch(registerPhoto)).blob();
      const fd = new FormData();
      fd.append('file', blob, 'face_register.jpg');
      const uploadRes = await axios.post(`${API}/upload/profile-picture`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      // Register face with descriptor
      await axios.post(`${API}/attendance/register-face`, { 
        photo_url: uploadRes.data.url,
        face_descriptor: descriptor
      }, { withCredentials: true });
      
      toast.success('Wajah berhasil didaftarkan! Sekarang Anda bisa absen.');
      setRegisterMode(false);
      setRegisterPhoto(null);
      setCameraOpen(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal mendaftarkan wajah'); }
    finally { setRegistering(false); }
  };

  const fetchHistoryMonth = async (month) => {
    setHistoryMonth(month);
    try {
      const res = await axios.get(`${API}/attendance/my?month=${month}`, { withCredentials: true });
      setRecords(res.data.records || []);
    } catch {}
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E4DA7]"></div></div>;
  }

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const calcDuration = (start, end) => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}j ${m}m`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Clock & Date */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#2E4DA7] to-[#1e3a8a] text-white">
        <CardContent className="p-6 text-center">
          <p className="text-4xl sm:text-5xl font-bold font-mono tracking-wider">{timeStr}</p>
          <p className="text-white/70 mt-1 text-sm">{dateStr}</p>
        </CardContent>
      </Card>

      {/* Face Registration Required */}
      {faceRegistered === false && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Camera className="w-8 h-8 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 text-base">Daftarkan Wajah Anda</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Anda perlu mendaftarkan foto wajah terlebih dahulu sebelum bisa melakukan absensi. Foto ini akan digunakan untuk verifikasi identitas saat absen.
                </p>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700 shrink-0" onClick={startRegisterCamera} data-testid="btn-register-face">
                <Camera className="w-4 h-4 mr-2" />Daftarkan Wajah
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Face Registered Info */}
      {faceRegistered && facePhoto && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <img src={facePhoto} alt="Face" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">Wajah terdaftar</p>
            <p className="text-xs text-emerald-600">Siap untuk absensi</p>
          </div>
          <Button variant="ghost" size="sm" className="text-emerald-700 text-xs" onClick={startRegisterCamera}
            style={{ display: canUpdateFace ? 'inline-flex' : 'none' }}>Perbarui</Button>
        </div>
      )}

      {/* Today Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className={`border-0 shadow-sm ${today?.clock_in ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <LogIn className={`w-5 h-5 mx-auto mb-1 ${today?.clock_in ? 'text-emerald-600' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Masuk</p>
            <p className="font-bold text-sm">{today?.clock_in?.slice(0,5) || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.break_start ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <Coffee className={`w-5 h-5 mx-auto mb-1 ${today?.break_start ? 'text-amber-600' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Break Mulai</p>
            <p className="font-bold text-sm">{today?.break_start?.slice(0,5) || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.break_end ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <Coffee className={`w-5 h-5 mx-auto mb-1 ${today?.break_end ? 'text-amber-700' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Break Selesai</p>
            <p className="font-bold text-sm">{today?.break_end?.slice(0,5) || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.clock_out ? 'bg-blue-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <LogOut className={`w-5 h-5 mx-auto mb-1 ${today?.clock_out ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Pulang</p>
            <p className="font-bold text-sm">{today?.clock_out?.slice(0,5) || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.clock_in && today?.clock_out ? 'bg-blue-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-1 ${today?.clock_in && today?.clock_out ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Durasi Kerja</p>
            <p className="font-bold text-sm">{calcDuration(today?.clock_in, today?.clock_out) || '--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.break_start && today?.break_end ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-1 ${today?.break_start && today?.break_end ? 'text-amber-600' : 'text-gray-400'}`} />
            <p className="text-[10px] text-gray-500">Durasi Break</p>
            <p className="font-bold text-sm">{calcDuration(today?.break_start, today?.break_end) || '--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.status === 'approved' ? 'bg-emerald-50' : today?.status === 'pending_approval' ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-3 text-center">
            {today?.status === 'approved' ? <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600" /> :
             today?.status === 'pending_approval' ? <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-600" /> :
             <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />}
            <p className="text-[10px] text-gray-500">Status</p>
            <p className="font-bold text-sm">{today?.status === 'approved' ? 'OK' : today?.status === 'pending_approval' ? 'Pending' : today?.status === 'rejected' ? 'Ditolak' : 'Belum'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!today?.clock_in && (
          <Button className="h-14 bg-emerald-600 hover:bg-emerald-700 text-base col-span-2" onClick={() => startCamera('clock_in')} disabled={!faceRegistered} data-testid="btn-clock-in">
            <Camera className="w-5 h-5 mr-2" />Absen Masuk
          </Button>
        )}
        {today?.clock_in && !today?.clock_out && (
          <>
            {!today?.break_start ? (
              <Button className="h-14 bg-amber-500 hover:bg-amber-600 text-base" onClick={() => startCamera('break_start')} disabled={!faceRegistered}>
                <Coffee className="w-5 h-5 mr-2" />Mulai Break
              </Button>
            ) : !today?.break_end ? (
              <Button className="h-14 bg-amber-600 hover:bg-amber-700 text-base" onClick={() => startCamera('break_end')} disabled={!faceRegistered}>
                <Coffee className="w-5 h-5 mr-2" />Selesai Break
              </Button>
            ) : <div />}
            <Button className="h-14 bg-blue-600 hover:bg-blue-700 text-base" onClick={() => startCamera('clock_out')} disabled={!faceRegistered} data-testid="btn-clock-out">
              <Camera className="w-5 h-5 mr-2" />Absen Pulang
            </Button>
          </>
        )}
        {today?.clock_in && today?.clock_out && (
          <div className="col-span-2 text-center py-4">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-gray-600 font-medium">Absensi hari ini sudah lengkap</p>
          </div>
        )}
      </div>

      {/* Backdate */}
      {hasBackdate && (
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Akses Absen Mundur Tersedia</p>
                <p className="text-xs text-purple-600">Sekali pakai — dari HRD</p>
              </div>
              <Button size="sm" variant={backdateMode ? 'default' : 'outline'} onClick={() => setBackdateMode(!backdateMode)}
                className={backdateMode ? 'bg-purple-600' : ''}>
                <Undo2 className="w-4 h-4 mr-1" />{backdateMode ? 'Mode Mundur Aktif' : 'Gunakan'}
              </Button>
            </div>
            {backdateMode && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1"><Label className="text-xs">Tanggal</Label><Input type="date" value={backdateDate} onChange={(e) => setBackdateDate(e.target.value)} /></div>
                  <div className="grid gap-1"><Label className="text-xs">Jam</Label><Input type="time" value={backdateTime} onChange={(e) => setBackdateTime(e.target.value)} /></div>
                </div>
                {backdateDate && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => startCamera('clock_in')} disabled={!faceRegistered}>
                      <LogIn className="w-4 h-4 mr-1.5" />Absen Masuk
                    </Button>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => startCamera('break_start')} disabled={!faceRegistered}>
                      <Coffee className="w-4 h-4 mr-1.5" />Mulai Break
                    </Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => startCamera('break_end')} disabled={!faceRegistered}>
                      <Coffee className="w-4 h-4 mr-1.5" />Selesai Break
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => startCamera('clock_out')} disabled={!faceRegistered}>
                      <LogOut className="w-4 h-4 mr-1.5" />Absen Pulang
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* History - Clean attendance records */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-5 h-5" />Riwayat Absensi</CardTitle>
            <Input type="month" value={historyMonth} onChange={(e) => fetchHistoryMonth(e.target.value)} className="w-40 h-9 text-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {records.filter(r => r.status === 'approved').length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada riwayat absensi</p>
          ) : (
            <div className="space-y-2">
              {records.filter(r => r.status === 'approved').map(r => (
                <div key={r.id || r.date} className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium">
                      {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {r.is_backdate && <Badge className="ml-1.5 bg-purple-100 text-purple-700 text-[10px]">mundur</Badge>}
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700">OK</Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                    <div><span className="text-gray-500">Masuk</span><p className="font-medium">{r.clock_in?.slice(0,5) || '--:--'}</p></div>
                    <div><span className="text-gray-500">Pulang</span><p className="font-medium">{r.clock_out?.slice(0,5) || '--:--'}</p></div>
                    <div><span className="text-gray-500">Durasi</span><p className="font-medium text-blue-700">{calcDuration(r.clock_in, r.clock_out) || '--'}</p></div>
                    <div><span className="text-gray-500">Break Mulai</span><p className="font-medium">{r.break_start?.slice(0,5) || '--:--'}</p></div>
                    <div><span className="text-gray-500">Break Selesai</span><p className="font-medium">{r.break_end?.slice(0,5) || '--:--'}</p></div>
                    <div><span className="text-gray-500">Durasi Break</span><p className="font-medium text-amber-700">{calcDuration(r.break_start, r.break_end) || '--'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Pengajuan / Approval */}
      {(() => {
        const pengajuanRecords = records.filter(r => 
          r.pending_change || r.last_rejection || r.approved_by || r.approved_at ||
          r.status === 'pending_approval' || r.status === 'rejected' || r.is_backdate
        );
        return pengajuanRecords.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" />Riwayat Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pengajuanRecords.map(r => {
                const isPending = r.status === 'pending_approval';
                const isRejected = r.status === 'rejected' || r.last_rejection;
                const isApproved = !isPending && !isRejected && (r.approved_by || r.approved_at);
                return (
                <div key={`req-${r.id || r.date}`} className={`p-3 rounded-lg border ${
                  isPending ? 'bg-amber-50 border-amber-200' : 
                  isRejected ? 'bg-red-50 border-red-200' : 
                  'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium">
                      {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {r.is_backdate && <Badge className="ml-1.5 bg-purple-100 text-purple-700 text-[10px]">mundur</Badge>}
                    </p>
                    <Badge className={
                      isPending ? 'bg-amber-100 text-amber-700' : 
                      isRejected ? 'bg-red-100 text-red-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }>
                      {isPending ? 'Menunggu Approval' : isRejected ? 'Ditolak' : 'Disetujui'}
                    </Badge>
                  </div>
                  {r.pending_change && (
                    <div className="p-2 bg-amber-100 rounded text-xs">
                      <p className="font-medium text-amber-800">
                        Pengajuan {r.pending_change.action === 'clock_in' ? 'Absen Masuk' : r.pending_change.action === 'clock_out' ? 'Absen Pulang' : r.pending_change.action === 'break_start' ? 'Mulai Break' : 'Selesai Break'}
                      </p>
                      <p className="text-amber-700 mt-1">Jam: {r.pending_change.time} | Skor wajah: {r.pending_change.face_score}%</p>
                    </div>
                  )}
                  {r.last_rejection && (
                    <div className="p-2 bg-red-100 rounded text-xs mt-1">
                      <p className="font-medium text-red-800">
                        Ditolak: {r.last_rejection.action === 'clock_in' ? 'Absen Masuk' : r.last_rejection.action === 'clock_out' ? 'Absen Pulang' : 'Break'} jam {r.last_rejection.time || '-'}
                      </p>
                    </div>
                  )}
                  {isApproved && !r.pending_change && !r.last_rejection && (
                    <p className="text-xs text-emerald-600 mt-1">Disetujui oleh HRD</p>
                  )}
                  {r.status === 'rejected' && !r.pending_change && !r.last_rejection && (
                    <p className="text-xs text-red-600">Absen ditolak oleh HRD</p>
                  )}
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        );
      })()}

      {/* Camera Dialog - for both registration and attendance */}
      <Dialog open={cameraOpen || !!capturedPhoto || !!registerPhoto} onOpenChange={(v) => { 
        if (!v) { stopCamera(); setCapturedPhoto(null); setRegisterPhoto(null); setRegisterMode(false); } 
      }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {registerMode ? 'Daftarkan Wajah Anda' : 
               currentAction === 'clock_in' ? 'Absen Masuk' : 
               currentAction === 'clock_out' ? 'Absen Pulang' : 
               currentAction === 'break_start' ? 'Mulai Break' : 
               currentAction === 'break_end' ? 'Selesai Break' : 'Absen'} — Foto Wajah
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {registerMode ? (
              /* Face Registration Mode */
              !registerPhoto ? (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraReady && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <FaceGuide />
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs bg-black/50 py-1">
                    Posisikan wajah Anda di dalam lingkaran
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={registerPhoto} alt="Register" className="w-full rounded-lg" />
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Pastikan foto jelas dan wajah terlihat dengan baik</p>
                  </div>
                </div>
              )
            ) : (
              /* Attendance Mode */
              !capturedPhoto ? (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {!cameraReady && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <FaceGuide />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={capturedPhoto} alt="Foto" className="w-full rounded-lg" />
                  {analyzing && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-700">Menganalisa wajah...</p>
                    </div>
                  )}
                  {!analyzing && faceScore !== null && (
                    <div className={`p-3 rounded-lg text-center ${faceScore >= 70 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <p className={`text-lg font-bold ${faceScore >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>Kemiripan: {faceScore}%</p>
                      <p className="text-xs text-gray-600">{faceScore >= 70 ? 'Wajah terverifikasi' : 'Kemiripan rendah — akan menunggu approval HRD'}</p>
                    </div>
                  )}
                </div>
              )
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter className="p-4 pt-0">
            {registerMode ? (
              !registerPhoto ? (
                <Button onClick={captureRegisterPhoto} disabled={!cameraReady} className="w-full h-12 bg-[#2E4DA7]">
                  <Camera className="w-5 h-5 mr-2" />Ambil Foto
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => { setRegisterPhoto(null); startRegisterCamera(); }}>Ulangi</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={submitRegisterFace} disabled={registering}>
                    {registering ? 'Mendaftarkan...' : 'Daftarkan Wajah'}
                  </Button>
                </div>
              )
            ) : (
              !capturedPhoto ? (
                <Button onClick={capturePhoto} disabled={!cameraReady} className="w-full h-12 bg-[#2E4DA7]">
                  <Camera className="w-5 h-5 mr-2" />Ambil Foto
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => { setCapturedPhoto(null); startCamera(currentAction); }}>Ulangi</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={submitAttendance} disabled={submitting}>
                    {submitting ? 'Mengirim...' : 'Kirim Absen'}
                  </Button>
                </div>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
};
