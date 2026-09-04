import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Check, Flashlight, Plus, ArrowRight, Flame, Scale } from 'lucide-react';
import { FoodItemNutrition } from '../../models.ts';
import { lookupBarcodeProduct } from '../../lib/barcodeService.ts';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDetected: (product: FoodItemNutrition) => void;
  onManualEntryRequested?: (barcode: string) => void;
  onSearchRequested?: (initialQuery?: string) => void;
  currentUserId?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductDetected,
  onManualEntryRequested,
  onSearchRequested,
  currentUserId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'requesting_camera' | 'scanning' | 'resolving' | 'found' | 'error' | 'not_found'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [detectedItem, setDetectedItem] = useState<FoodItemNutrition | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Stop camera tracks and cancel scanning animation loops
  const stopCameraStream = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleResolveBarcode = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setStatus('resolving');
    setScannedCode(clean);
    stopCameraStream();

    try {
      const result = await lookupBarcodeProduct(clean, currentUserId);
      if (result.found && result.item) {
        setDetectedItem(result.item);
        setPortionGrams(result.item.packageWeightGrams || 100);
        setStatus('found');
      } else {
        setStatus('not_found');
        const isInStoreScaleCode = /^(?:20|21|22|23|24|25|26|27|28|29)\d{11}$/.test(clean);
        if (isInStoreScaleCode) {
          setErrorMessage(`Barcode ${clean} is a fresh in-store bakery/scale sticker. Search the product name directly or paste the supermarket link.`);
        } else {
          setErrorMessage(result.error || `We couldn't find or resolve barcode ${clean} right now. Please try again or add it as a custom food.`);
        }
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error occurred while looking up barcode.');
    }
  };

  const handleConfirmProduct = () => {
    if (detectedItem) {
      onProductDetected(detectedItem);
      onClose();
    }
  };

  const startCameraScanning = async () => {
    setStatus('requesting_camera');
    setErrorMessage(null);
    stopCameraStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Camera access is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Check if flashlight / torch is supported
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track?.getCapabilities?.() || {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      setStatus('scanning');

      // Check if native BarcodeDetector is available in window
      if ('BarcodeDetector' in window) {
        const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128'];
        const detector = new (window as any).BarcodeDetector({ formats });

        const scanFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animFrameIdRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              const detectedValue = barcodes[0].rawValue;
              handleResolveBarcode(detectedValue);
              return;
            }
          } catch (e) {
            // detection frame skipped
          }

          animFrameIdRef.current = requestAnimationFrame(scanFrame);
        };

        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera stream acquisition failed:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera permissions to scan barcodes.');
      } else {
        setErrorMessage(err.message || 'Unable to start camera.');
      }
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Could not toggle torch:', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setScannedCode(null);
      setDetectedItem(null);
      setErrorMessage(null);
      setManualCodeInput('');
      startCameraScanning();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00] flex items-center justify-center text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]">
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="barcode-scanner-title" className="text-sm font-black uppercase italic tracking-wider text-white">
                Barcode <span className="text-[#C0FF00]">Scanner</span>
              </h2>
              <p className="text-[10px] font-mono text-gray-400">AH, Jumbo, PLUS, Dirk & OpenFoodFacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#222] border border-[#333] text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport / Scanning Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover max-h-[340px] ${status === 'scanning' ? 'opacity-100' : 'opacity-40'}`}
          />

          {/* Viewfinder Target Overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="relative w-64 h-40 border-2 border-[#C0FF00]/80 rounded-2xl shadow-[0_0_25px_rgba(192,255,0,0.25)] flex flex-col items-center justify-between p-2">
                {/* Laser animation bar */}
                <div className="w-full h-0.5 bg-[#C0FF00] shadow-[0_0_10px_#C0FF00] animate-pulse rounded-full" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C0FF00] bg-black/70 px-2 py-0.5 rounded">
                  Align Barcode Here
                </span>
                <div className="w-full h-0.5 bg-[#C0FF00] shadow-[0_0_10px_#C0FF00] animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* Flashlight button if supported */}
          {hasTorch && status === 'scanning' && (
            <button
              onClick={toggleTorch}
              className={`absolute top-4 right-4 p-2.5 rounded-full border backdrop-blur-md transition-colors cursor-pointer ${
                torchOn ? 'bg-[#C0FF00] text-black border-[#C0FF00]' : 'bg-black/60 text-white border-white/20'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Status Overlay: Resolving / Found / Error */}
          {status === 'resolving' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#C0FF00] animate-spin" />
              <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Indexing Barcode: <span className="text-[#C0FF00]">{scannedCode}</span>
              </p>
              <p className="text-[11px] text-gray-400 max-w-xs">Checking local database & Open Food Facts catalog...</p>
            </div>
          )}

          {status === 'found' && detectedItem && (
            <div className="absolute inset-0 bg-black/92 backdrop-blur-md flex flex-col justify-between p-5 animate-fade-in z-20">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#C0FF00]/20 border border-[#C0FF00] flex items-center justify-center text-[#C0FF00]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C0FF00] block">
                      Product Recognized
                    </span>
                    <span className="text-[9px] font-mono text-gray-400 block">
                      Saved to Global Index
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  {detectedItem.barcode}
                </span>
              </div>

              {/* Product Info Card */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-4 my-auto space-y-3 shadow-lg">
                <div>
                  {detectedItem.brand && (
                    <span className="text-[10px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-2 py-0.5 rounded-md">
                      {detectedItem.brand}
                    </span>
                  )}
                  <h3 className="font-sans text-base font-black text-white mt-1.5 line-clamp-2">
                    {detectedItem.name}
                  </h3>
                  {detectedItem.packageWeightGrams ? (
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                      Pack Size: <span className="text-white font-bold">{detectedItem.packageWeightGrams}g</span>
                    </p>
                  ) : null}
                </div>

                {/* Macro Badges Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#262626]">
                  <div className="bg-[#121212] border border-[#282828] rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-mono uppercase text-gray-400 font-bold">Kcal</span>
                    <span className="text-xs font-mono font-black text-white">{detectedItem.kcalPer100g}</span>
                    <span className="block text-[8px] text-gray-400 font-mono">/100g</span>
                  </div>
                  <div className="bg-[#121212] border border-[#282828] rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-mono uppercase text-[#38bdf8] font-bold">Protein</span>
                    <span className="text-xs font-mono font-black text-[#38bdf8]">{detectedItem.proteinPer100g}g</span>
                    <span className="block text-[8px] text-gray-400 font-mono">/100g</span>
                  </div>
                  <div className="bg-[#121212] border border-[#282828] rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-mono uppercase text-[#fbbf24] font-bold">Carbs</span>
                    <span className="text-xs font-mono font-black text-[#fbbf24]">{detectedItem.carbsPer100g}g</span>
                    <span className="block text-[8px] text-gray-400 font-mono">/100g</span>
                  </div>
                  <div className="bg-[#121212] border border-[#282828] rounded-xl p-2 text-center">
                    <span className="block text-[9px] font-mono uppercase text-[#f87171] font-bold">Fat</span>
                    <span className="text-xs font-mono font-black text-[#f87171]">{detectedItem.fatPer100g}g</span>
                    <span className="block text-[8px] text-gray-400 font-mono">/100g</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCameraScanning}
                  className="px-3.5 py-2.5 rounded-xl bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] text-gray-300 hover:text-white text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  Scan Another
                </button>
                <button
                  type="button"
                  onClick={handleConfirmProduct}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#b0f000] text-black text-xs font-bold font-mono uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(192,255,0,0.3)] transition-all"
                >
                  <span>Log Food Item</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {status === 'not_found' && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">Product Not Indexed Yet</p>
              <p className="text-[11px] text-gray-400 max-w-xs font-mono break-all">{errorMessage}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  onClick={startCameraScanning}
                  className="px-3 py-1.5 rounded-xl bg-[#222] border border-[#333] text-white text-xs font-mono hover:bg-[#333]"
                >
                  Scan Again
                </button>
                {onSearchRequested && (
                  <button
                    onClick={() => {
                      onSearchRequested('');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#00ade6] hover:bg-[#0096c7] text-white text-xs font-bold font-mono"
                  >
                    Search In Catalog
                  </button>
                )}
                {onManualEntryRequested && scannedCode && (
                  <button
                    onClick={() => {
                      onManualEntryRequested(scannedCode);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#C0FF00] text-black text-xs font-bold font-mono hover:opacity-90"
                  >
                    Add Macros Manually
                  </button>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">Camera Unavailable</p>
              <p className="text-[11px] text-gray-400 max-w-xs">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="p-4 bg-[#141414] border-t border-[#222] space-y-2">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
            Or type barcode manually:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 8710400000000"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleResolveBarcode(manualCodeInput);
              }}
              className="flex-1 bg-[#0d0d0d] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
            />
            <button
              type="button"
              disabled={!manualCodeInput.trim() || status === 'resolving'}
              onClick={() => handleResolveBarcode(manualCodeInput)}
              className="px-4 py-2 rounded-xl bg-[#C0FF00] text-black text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity"
            >
              Lookup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
