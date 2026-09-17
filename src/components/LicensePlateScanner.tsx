import { useState, useRef, useEffect, useCallback } from 'react';
import Tesseract from 'tesseract.js';

interface LicensePlateScannerProps {
  onPlateDetected: (plate: string, confidence: number) => void;
  onClose: () => void;
}

export function LicensePlateScanner({ onPlateDetected, onClose }: LicensePlateScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [lastDetectedPlate, setLastDetectedPlate] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Indian license plate pattern: State Code (2 letters) + RTO Code (2 digits) + Series (1-3 letters) + Number (4 digits)
  // Examples: MH12AB1234, KA03CD5678, DL5EF1234
  const platePattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please grant camera permissions and try again.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob for OCR
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setProcessing(true);

      try {
        const result = await Tesseract.recognize(blob, 'eng', {
          logger: () => {}, // Suppress logging
        });

        const text = result.data.text.toUpperCase().replace(/\s/g, '');
        
        // Try to find license plate pattern in the recognized text
        const matches = text.match(platePattern);
        
        if (matches && matches[0]) {
          const detectedPlate = matches[0];
          const confidence = result.data.confidence;
          
          // Only accept if confidence is above threshold (60%)
          if (confidence > 60 && detectedPlate !== lastDetectedPlate) {
            setLastDetectedPlate(detectedPlate);
            onPlateDetected(detectedPlate, confidence);
            
            // Stop scanning after successful detection
            stopCamera();
          }
        }
      } catch (err) {
        console.error('OCR processing error:', err);
      } finally {
        setProcessing(false);
      }
    }, 'image/png');
  }, [processing, lastDetectedPlate, onPlateDetected, stopCamera]);

  // Continuous scanning loop
  useEffect(() => {
    if (!isScanning) return;

    const scanInterval = setInterval(() => {
      if (!processing) {
        processFrame();
      }
    }, 1500); // Process every 1.5 seconds

    return () => {
      clearInterval(scanInterval);
    };
  }, [isScanning, processing, processFrame]);

  // Start camera on mount
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Scan License Plate</h2>
              <p className="text-indigo-100 mt-1">Position the license plate within the frame</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-indigo-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-900">Camera Access Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={startCamera}
                className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-4 border-white border-opacity-50 w-3/4 h-1/2 rounded-lg relative">
                      {/* Scanning animation */}
                      <div className="absolute inset-0 border-t-4 border-indigo-500 animate-scan"></div>
                      
                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                    </div>
                  </div>
                )}

                {/* Processing indicator */}
                {processing && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">Tips for better recognition:</h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Ensure good lighting</li>
                  <li>• Hold the camera steady</li>
                  <li>• Position the plate within the frame</li>
                  <li>• Avoid glare and shadows</li>
                </ul>
              </div>

              {/* Manual entry fallback */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Having trouble scanning?</p>
                <button
                  onClick={handleClose}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                >
                  Enter plate number manually →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(calc(100% - 4px)); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
