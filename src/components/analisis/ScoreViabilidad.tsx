"use client";

import { cn } from "@/lib/utils";

interface ScoreViabilidadProps {
  score: number;
  razon: string;
  className?: string;
}

export function ScoreViabilidad({ score, razon, className }: ScoreViabilidadProps) {
  const isHigh = score >= 70;
  const isMid = score >= 40 && score < 70;

  const color = isHigh
    ? "text-green-600"
    : isMid
    ? "text-yellow-600"
    : "text-red-600";

  const trackColor = isHigh
    ? "stroke-green-500"
    : isMid
    ? "stroke-yellow-500"
    : "stroke-red-500";

  const label = isHigh
    ? "Alta viabilidad"
    : isMid
    ? "Viabilidad media"
    : "Baja viabilidad";

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={trackColor}
            strokeWidth="10"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", color)}>{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <span className={cn("text-sm font-semibold mt-2", color)}>{label}</span>
      <p className="text-xs text-gray-500 text-center mt-1 max-w-xs">{razon}</p>
    </div>
  );
}
