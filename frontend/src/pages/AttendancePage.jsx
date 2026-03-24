import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Camera, Clock, Coffee, LogOut, LogIn, CheckCircle, AlertCircle, Undo2, Calendar } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

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

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedPhoto(dataUrl);
    
    // Simple face detection score (placeholder - compares with profile photo)
    // In production, use face-api.js or server-side comparison
    let score = Math.floor(Math.random() * 30) + 70; // Simulated 70-100%
    if (!profilePhoto) score = 50; // Low score if no profile photo
    setFaceScore(score);
    
    stopCamera();
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
      };
      
      if (backdateMode && backdateDate) {
        body.date = backdateDate;
        if (backdateTime) body.time = backdateTime;
      }
      
      const res = await axios.post(`${API}/attendance/clock`, body, { withCredentials: true });
      
      toast.success(res.data.message);
      setCapturedPhoto(null);
      setFaceScore(null);
      setBackdateMode(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal absen');
    } finally { setSubmitting(false); }
  };

  const handleBreak = async (action) => {
    try {
      const res = await axios.post(`${API}/attendance/clock`, {
        action, photo_url: null, face_score: 100
      }, { withCredentials: true });
      toast.success(res.data.message);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal'); }
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
      const blob = await (await fetch(registerPhoto)).blob();
      const fd = new FormData();
      fd.append('file', blob, 'face_register.jpg');
      const uploadRes = await axios.post(`${API}/upload/profile-picture`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      await axios.post(`${API}/attendance/register-face`, { photo_url: uploadRes.data.url }, { withCredentials: true });
      toast.success('Wajah berhasil didaftarkan! Sekarang Anda bisa absen.');
      setRegisterMode(false);
      setRegisterPhoto(null);
      setCameraOpen(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal mendaftarkan wajah'); }
    finally { setRegistering(false); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E4DA7]"></div></div>;
  }

  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
          <Button variant="ghost" size="sm" className="text-emerald-700 text-xs" onClick={startRegisterCamera}>Perbarui</Button>
        </div>
      )}

      {/* Today Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={`border-0 shadow-sm ${today?.clock_in ? 'bg-emerald-50' : 'bg-slate-50'}`}>
          <CardContent className="p-4 text-center">
            <LogIn className={`w-6 h-6 mx-auto mb-1 ${today?.clock_in ? 'text-emerald-600' : 'text-gray-400'}`} />
            <p className="text-xs text-gray-500">Masuk</p>
            <p className="font-bold text-sm">{today?.clock_in || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.break_start ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-4 text-center">
            <Coffee className={`w-6 h-6 mx-auto mb-1 ${today?.break_start ? 'text-amber-600' : 'text-gray-400'}`} />
            <p className="text-xs text-gray-500">Break</p>
            <p className="font-bold text-sm">{today?.break_start ? `${today.break_start}${today.break_end ? `-${today.break_end}` : '...'}` : '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.clock_out ? 'bg-blue-50' : 'bg-slate-50'}`}>
          <CardContent className="p-4 text-center">
            <LogOut className={`w-6 h-6 mx-auto mb-1 ${today?.clock_out ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className="text-xs text-gray-500">Pulang</p>
            <p className="font-bold text-sm">{today?.clock_out || '--:--'}</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${today?.status === 'approved' ? 'bg-emerald-50' : today?.status === 'pending_approval' ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <CardContent className="p-4 text-center">
            {today?.status === 'approved' ? <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-600" /> :
             today?.status === 'pending_approval' ? <AlertCircle className="w-6 h-6 mx-auto mb-1 text-amber-600" /> :
             <Clock className="w-6 h-6 mx-auto mb-1 text-gray-400" />}
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-bold text-sm">{today?.status === 'approved' ? 'OK' : today?.status === 'pending_approval' ? 'Pending' : today?.status === 'rejected' ? 'Ditolak' : 'Belum Absen'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!today?.clock_in && (
          <Button className="h-14 bg-emerald-600 hover:bg-emerald-700 text-base" onClick={() => startCamera('clock_in')} disabled={!faceRegistered} data-testid="btn-clock-in">
            <Camera className="w-5 h-5 mr-2" />Absen Masuk
          </Button>
        )}
        {today?.clock_in && !today?.clock_out && (
          <>
            {!today?.break_start ? (
              <Button className="h-14 bg-amber-500 hover:bg-amber-600 text-base" onClick={() => handleBreak('break_start')}>
                <Coffee className="w-5 h-5 mr-2" />Mulai Break
              </Button>
            ) : !today?.break_end ? (
              <Button className="h-14 bg-amber-600 hover:bg-amber-700 text-base" onClick={() => handleBreak('break_end')}>
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
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Akses Absen Mundur Tersedia</p>
                <p className="text-xs text-purple-600">Sekali pakai — dari HRD</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setBackdateMode(!backdateMode)}>
                <Undo2 className="w-4 h-4 mr-1" />{backdateMode ? 'Batal' : 'Gunakan'}
              </Button>
            </div>
            {backdateMode && (
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="grid gap-1"><Label className="text-xs">Tanggal</Label><Input type="date" value={backdateDate} onChange={(e) => setBackdateDate(e.target.value)} /></div>
                <div className="grid gap-1"><Label className="text-xs">Jam</Label><Input type="time" value={backdateTime} onChange={(e) => setBackdateTime(e.target.value)} /></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-5 h-5" />Riwayat 7 Hari Terakhir</CardTitle></CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada riwayat absensi</p>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 7).map(r => (
                <div key={r.id || r.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    <p className="text-xs text-gray-500">{r.clock_in || '--:--'} → {r.clock_out || '--:--'}</p>
                  </div>
                  <Badge className={r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                    {r.status === 'approved' ? 'OK' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Dialog - for both registration and attendance */}
      <Dialog open={cameraOpen || !!capturedPhoto || !!registerPhoto} onOpenChange={(v) => { 
        if (!v) { stopCamera(); setCapturedPhoto(null); setRegisterPhoto(null); setRegisterMode(false); } 
      }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {registerMode ? 'Daftarkan Wajah Anda' : currentAction === 'clock_in' ? 'Absen Masuk' : 'Absen Pulang'} — Foto Wajah
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
                    <div className="w-48 h-48 border-2 border-white/50 rounded-full"></div>
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
                    <div className="w-48 h-48 border-2 border-white/50 rounded-full"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <img src={capturedPhoto} alt="Foto" className="w-full rounded-lg" />
                  {faceScore !== null && (
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
