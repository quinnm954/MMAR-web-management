import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSignatureComplete: (signature: string) => void;
  onClear?: () => void;
  label?: string;
  compact?: boolean;
  existingSignature?: string | null;
  disabled?: boolean;
}

const SignaturePad = ({
  width = 400,
  height = 150,
  onSignatureComplete,
  onClear,
  label = "Signature",
  compact = false,
  existingSignature = null,
  disabled = false,
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Compact dimensions for initials
  const actualWidth = compact ? 80 : width;
  const actualHeight = compact ? 40 : height;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = compact ? 1.5 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, compact]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || existingSignature) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || existingSignature) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, actualWidth, actualHeight);
    setHasDrawn(false);
    onClear?.();
  };

  const handleAccept = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signature = canvas.toDataURL("image/png");
    onSignatureComplete(signature);
  };

  // If there's an existing signature, show it
  if (existingSignature) {
    return (
      <div className="print:block">
        <div className="flex flex-col items-start gap-2">
          <img
            src={existingSignature}
            alt={label}
            className="border border-gray-300"
            style={{ width: actualWidth, height: actualHeight }}
          />
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onClear?.()}
              className="print:hidden"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <p className="text-xs text-muted-foreground">{label}</p>
      <canvas
        ref={canvasRef}
        width={actualWidth}
        height={actualHeight}
        className="border border-gray-400 rounded cursor-crosshair touch-none bg-white"
        style={{ width: actualWidth, height: actualHeight }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!hasDrawn}
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleAccept}
          disabled={!hasDrawn}
        >
          <Check className="w-3 h-3 mr-1" />
          {compact ? "Accept" : "Accept & Sign"}
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
