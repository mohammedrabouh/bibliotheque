import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  QrCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Camera,
  CameraOff,
  RefreshCw,
  X,
  PackageCheck,
  SwitchCamera,
  Sparkles,
  Info,
} from 'lucide-react';
import jsQR from 'jsqr';

interface VideoDevice {
  deviceId: string;
  label: string;
}

export const BorrowReturnStation: React.FC = () => {
  const {
    books,
    students,
    scanBorrowState,
    scanReturnState,
    processBorrowBookScan,
    processBorrowStudentScan,
    resetBorrowScan,
    cancelLoan,
    processReturnBookScan,
    processReturnStudentScan,
    resetReturnScan,
  } = useLibrary();

  // Mode sélectionné : 'borrow' (Emprunt/Remise physique) ou 'return' (Restitution)
  const [activeStationMode, setActiveStationMode] = useState<'borrow' | 'return'>('borrow');

  // État de la caméra
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [availableCameras, setAvailableCameras] = useState<VideoDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Saisie manuelle de secours
  const [manualCode, setManualCode] = useState('');

  // Découverte des caméras disponibles
  const refreshCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Caméra ${index + 1}`,
        }));

      setAvailableCameras(videoInputs);
      if (videoInputs.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Impossible d’énumérer les caméras:', err);
    }
  }, [selectedCameraId]);

  // Sons de confirmation audio doux via Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignorer si audio bloqué
    }
  };

  // Arrêt propre du flux vidéo
  const stopCameraStream = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanningActive(false);
  }, []);

  // Démarrage du flux vidéo réel
  const startCameraStream = useCallback(async () => {
    setCameraError(null);

    // Vérification du contexte sécurisé (HTTPS ou localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCameraError("La caméra nécessite une connexion sécurisée (HTTPS). L'accès direct est restreint par les règles de sécurité de votre navigateur.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("L'API vidéo MediaDevices n'est pas prise en charge par ce navigateur.");
      return;
    }

    try {
      stopCameraStream();

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? {
              deviceId: { exact: selectedCameraId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraPermissionStatus('granted');

      // Mettre à jour les labels des caméras (disponibles seulement après permission)
      refreshCameraDevices();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanningActive(true);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur caméra:', errorObj);

      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setCameraPermissionStatus('denied');
        setCameraError("Autorisation refusée : veuillez autoriser l'accès à la caméra dans la barre d'adresse de votre navigateur.");
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setCameraError("Aucun capteur de caméra détecté sur cet appareil.");
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        setCameraError("La caméra est actuellement occupée par une autre application ou inaccessible.");
      } else {
        setCameraError(`Erreur d'initialisation caméra : ${errorObj.message || 'accès impossible'}.`);
      }
      setUseCamera(false);
      stopCameraStream();
    }
  }, [selectedCameraId, refreshCameraDevices, stopCameraStream]);

  // Déclenchement / Extinction de la caméra
  useEffect(() => {
    if (useCamera) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [useCamera, selectedCameraId, startCameraStream, stopCameraStream]);

  // Boucle d'analyse vidéo continue via jsQR
  useEffect(() => {
    if (!useCamera || !isScanningActive) return;

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              const rawCode = code.data.trim();
              const now = Date.now();

              // Anti-rebond : éviter les scans répétés du même code à moins de 2.5 secondes
              if (rawCode && (rawCode !== lastScannedCodeRef.current || now - lastScannedTimeRef.current > 2500)) {
                lastScannedCodeRef.current = rawCode;
                lastScannedTimeRef.current = now;

                playBeep();
                setLastDetectedCode(rawCode);
                setTimeout(() => setLastDetectedCode(null), 3500);

                // Traitement en fonction du mode actif
                if (activeStationMode === 'borrow') {
                  if (!scanBorrowState.scannedBook) {
                    processBorrowBookScan(rawCode);
                  } else {
                    processBorrowStudentScan(rawCode);
                  }
                } else {
                  if (!scanReturnState.scannedBook) {
                    processReturnBookScan(rawCode);
                  } else {
                    processReturnStudentScan(rawCode);
                  }
                }
              }
            }
          } catch {
            // Ignorer erreurs ponctuelles d'extraction de trame
          }
        }
      }

      scanLoopRef.current = requestAnimationFrame(tick);
    };

    scanLoopRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (scanLoopRef.current) {
        cancelAnimationFrame(scanLoopRef.current);
      }
    };
  }, [
    useCamera,
    isScanningActive,
    activeStationMode,
    scanBorrowState.scannedBook,
    scanReturnState.scannedBook,
    processBorrowBookScan,
    processBorrowStudentScan,
    processReturnBookScan,
    processReturnStudentScan,
  ]);

  // Soumission manuelle
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const code = manualCode.trim();
    if (activeStationMode === 'borrow') {
      if (!scanBorrowState.scannedBook) {
        processBorrowBookScan(code);
      } else {
        processBorrowStudentScan(code);
      }
    } else {
      if (!scanReturnState.scannedBook) {
        processReturnBookScan(code);
      } else {
        processReturnStudentScan(code);
      }
    }
    setManualCode('');
  };

  const currentBorrowStep = !scanBorrowState.scannedBook ? 1 : 2;
  const currentReturnStep = !scanReturnState.scannedBook ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* Station Mode Switcher (Emprunt vs Retour) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Poste de Scan Automatique QR Code
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Détection jsQR en direct
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Caméra en temps réel ou douchette : scannez le livre puis la carte étudiante pour une validation instantanée.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => {
              setActiveStationMode('borrow');
              resetBorrowScan();
              resetReturnScan();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStationMode === 'borrow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Emprunt / Remise physique</span>
          </button>

          <button
            onClick={() => {
              setActiveStationMode('return');
              resetBorrowScan();
              resetReturnScan();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStationMode === 'return'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>2. Restitution de livre (+1 rayon)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1 : PROCESSUS D'EMPRUNT (QR Ouvrage -> QR Carte -> Enregistrement)   */}
      {/* ========================================================================= */}
      {activeStationMode === 'borrow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Séquence d'Emprunt ou Remise Physique
                </h4>
                <p className="text-xs text-slate-500">
                  Scannez d'abord l'exemplaire, puis la carte étudiante pour valider.
                </p>
              </div>
              <button
                onClick={resetBorrowScan}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentBorrowStep === 1
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/10'
                    : scanBorrowState.scannedBook
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      scanBorrowState.scannedBook
                        ? 'bg-emerald-600 text-white'
                        : currentBorrowStep === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {scanBorrowState.scannedBook ? '✓' : '1'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      1. Scan QR Livre
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-44">
                      {scanBorrowState.scannedBook ? scanBorrowState.scannedBook.title : "Scanner l'exemplaire"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentBorrowStep === 2
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/10 animate-pulse'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      currentBorrowStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      2. Scan Carte Étudiant
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Vérifie le quota strict de 3 ouvrages
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  scanBorrowState.successLoan
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/10'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      scanBorrowState.successLoan ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      3. Validation Immédiate
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Emprunt effectif enregistré
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Erreur Emprunt */}
          {scanBorrowState.error && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 text-rose-900 shadow-xs flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-950">Refus ou Code Non Reconnu</h4>
                <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                  {scanBorrowState.error}
                </p>
              </div>
              <button
                onClick={resetBorrowScan}
                className="text-xs text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Succès Emprunt */}
          {scanBorrowState.successLoan && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 text-emerald-950 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Emprunt validé avec succès
                    </span>
                    <h4 className="text-base font-bold text-emerald-950 mt-0.5">
                      « {scanBorrowState.successLoan.bookTitle} » remis à {scanBorrowState.successLoan.studentName}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      ID : <span className="font-mono">{scanBorrowState.successLoan.id}</span> • Restitution attendue pour le :{' '}
                      <span className="font-bold">{scanBorrowState.successLoan.dueDate}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => cancelLoan(scanBorrowState.successLoan!.id)}
                  className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4 text-rose-600" />
                  <span>Annuler l'emprunt (En cas d'erreur)</span>
                </button>
              </div>
            </div>
          )}

          {scanBorrowState.lastCancelledLoan && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 flex items-center space-x-2">
              <Undo2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                L'emprunt <strong>{scanBorrowState.lastCancelledLoan.id}</strong> a été annulé avec succès. L'exemplaire a été réintégré au stock disponible.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2 : PROCESSUS DE RETOUR (QR Livre -> QR Carte)                       */}
      {/* ========================================================================= */}
      {activeStationMode === 'return' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Restitution Rapide d'un Livre
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Scannez le QR code de l'exemplaire, puis celui de la carte étudiante : l'emprunt est clôturé et le stock en rayon est réintégré.
                </p>
              </div>
              <button
                onClick={resetReturnScan}
                className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentReturnStep === 1
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20'
                    : scanReturnState.scannedBook
                    ? 'bg-emerald-100/60 border-emerald-400'
                    : 'bg-white/60 border-emerald-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      scanReturnState.scannedBook ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {scanReturnState.scannedBook ? '✓' : '1'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Étape 1 : Scanner le QR de l'ouvrage retourné
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-56">
                      {scanReturnState.scannedBook ? scanReturnState.scannedBook.title : 'En attente de scan du livre...'}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  currentReturnStep === 2
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 animate-pulse'
                    : 'bg-white/60 border-emerald-200 opacity-70'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Étape 2 : Scanner la carte étudiante
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Clôture du prêt & remise en rayon (+1 disponible)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Erreur Retour */}
          {scanReturnState.error && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 text-rose-900 shadow-xs flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-950">Erreur lors de la restitution</h4>
                <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
                  {scanReturnState.error}
                </p>
              </div>
              <button
                onClick={resetReturnScan}
                className="text-xs text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Succès Retour */}
          {scanReturnState.successReturn && (
            <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-lg animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-white text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                    Restitution validée • Stock en rayon réintégré (+1)
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold mt-0.5">
                    L'ouvrage « {scanReturnState.successReturn.book.title} » a été restitué par {scanReturnState.successReturn.student.name} !
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-emerald-100">
                    <span className="bg-emerald-700 px-2.5 py-1 rounded-lg">
                      Rayon : {scanReturnState.successReturn.book.shelfLocation}
                    </span>
                    <span className="bg-emerald-700 px-2.5 py-1 rounded-lg">
                      Disponibles en rayon : {scanReturnState.successReturn.book.availableCopies} sur {scanReturnState.successReturn.book.totalCopies}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZONE COMMUNE : CAMÉRA RÉELLE AVEC DÉCODAGE jsQR & SAISIE MANUELLE         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche : Caméra & Saisie code (Col 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-600 shrink-0" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeStationMode === 'borrow'
                    ? currentBorrowStep === 1
                      ? "Étape 1/2 : Scannez le QR Code de l'ouvrage"
                      : "Étape 2/2 : Scannez la carte étudiante"
                    : currentReturnStep === 1
                    ? "Étape 1/2 : Scannez le QR Code de l'ouvrage à restituer"
                    : "Étape 2/2 : Scannez la carte étudiante pour valider"}
                </h4>
              </div>

              {/* Bouton Démarrer / Arrêter la caméra */}
              <div className="flex items-center space-x-2">
                {availableCameras.length > 1 && useCamera && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-hidden"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setUseCamera(!useCamera)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
                    useCamera
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  }`}
                >
                  {useCamera ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Arrêter la caméra</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Activer la caméra</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Viseur caméra avec prévisualisation vidéo réelle */}
            {useCamera ? (
              <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden mb-4 border-2 border-blue-400 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viseur de cadrage animé */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 border-2 border-white/80 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1 rounded-br-lg" />
                    <div className="w-full h-0.5 bg-blue-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm" />
                  </div>
                </div>

                {/* Badge de code détecté en direct */}
                {lastDetectedCode ? (
                  <div className="absolute top-3 left-3 right-3 bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow-lg animate-in fade-in flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>QR Code détecté : <strong className="font-mono">{lastDetectedCode}</strong></span>
                  </div>
                ) : (
                  <div className="absolute bottom-2 left-0 right-0 text-center text-[11px] text-white/90 bg-black/60 py-1.5 backdrop-blur-xs">
                    Visez le QR code du livre ou de la carte étudiante
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 mb-4 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Camera className="w-10 h-10 text-slate-400 mb-2" />
                <span className="font-bold text-slate-700 text-sm">Caméra inactive</span>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Cliquez sur « Activer la caméra » pour autoriser votre navigateur et scanner directement avec votre webcam ou caméra mobile.
                </p>
                <button
                  onClick={() => setUseCamera(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Démarrer le flux vidéo
                </button>
              </div>
            )}

            {/* Message d'erreur caméra explicite */}
            {cameraError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-950 font-bold">Problème d'accès caméra :</strong>
                  <span>{cameraError}</span>
                </div>
              </div>
            )}

            {/* Résumé du livre scanné à l'étape 1 */}
            {((activeStationMode === 'borrow' && scanBorrowState.scannedBook) ||
              (activeStationMode === 'return' && scanReturnState.scannedBook)) && (
              <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Ouvrage scanné :</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {activeStationMode === 'borrow'
                        ? scanBorrowState.scannedBook?.title
                        : scanReturnState.scannedBook?.title}
                    </span>
                  </div>
                </div>
                <button
                  onClick={activeStationMode === 'borrow' ? resetBorrowScan : resetReturnScan}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold shrink-0 cursor-pointer"
                >
                  Changer
                </button>
              </div>
            )}

            {/* Formulaire de saisie manuelle ou douchette */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Saisie manuelle ou douchette code-barres (ex: EST-LIV-101 ou CARD-EST-2024-012) :
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={
                    (activeStationMode === 'borrow' && currentBorrowStep === 1) ||
                    (activeStationMode === 'return' && currentReturnStep === 1)
                      ? 'EST-LIV-101'
                      : 'CARD-EST-2024-012'
                  }
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Colonne droite : Simulateurs de scan 1-Clic pour tests rapides (Col 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Simulation rapide 1-Clic (Codes de test)</span>
              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-mono">
                {activeStationMode === 'borrow' ? 'Emprunt' : 'Retour'}
              </span>
            </h4>

            {/* Si étape 1 : Choix du livre */}
            {((activeStationMode === 'borrow' && currentBorrowStep === 1) ||
              (activeStationMode === 'return' && currentReturnStep === 1)) && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 mb-2">
                  {activeStationMode === 'borrow'
                    ? "Cliquez sur un exemplaire pour simuler le scan du QR code du livre :"
                    : "Cliquez sur un livre actuellement emprunté pour simuler sa restitution :"}
                </p>

                {books.slice(0, 4).map((b) => {
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        if (activeStationMode === 'borrow') {
                          processBorrowBookScan(b.id);
                        } else {
                          processReturnBookScan(b.id);
                        }
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between text-xs group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 block truncate group-hover:text-blue-700">
                          {b.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {b.id} · Stock : {b.availableCopies} dispo / {b.reservedCopies || 0} réservé
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          b.availableCopies > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.availableCopies > 0 ? `${b.availableCopies} dispo` : 'Réservé/Prêté'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Si étape 2 : Choix de la carte étudiante */}
            {((activeStationMode === 'borrow' && currentBorrowStep === 2) ||
              (activeStationMode === 'return' && currentReturnStep === 2)) && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 mb-2">
                  {activeStationMode === 'borrow'
                    ? "Cliquez sur la carte d'un étudiant pour enregistrer l'emprunt :"
                    : "Cliquez sur la carte de l'étudiant pour valider la restitution :"}
                </p>

                {students.map((s) => {
                  const activeCount = s.activeLoanBookIds.length;
                  const isBlocked = activeStationMode === 'borrow' && activeCount >= 3;

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (activeStationMode === 'borrow') {
                          processBorrowStudentScan(s.studentCardId);
                        } else {
                          processReturnStudentScan(s.studentCardId);
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs group cursor-pointer ${
                        isBlocked
                          ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70'
                          : 'bg-white hover:bg-blue-50/70 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 pr-2">
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate group-hover:text-blue-700">
                            {s.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {s.studentCardId}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {activeCount}/3 prêts {isBlocked && '⚠️ BLOQUÉ'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
