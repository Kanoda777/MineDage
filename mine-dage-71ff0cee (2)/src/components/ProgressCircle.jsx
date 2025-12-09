import React from "react";

export default function ProgressCircle({ completed, total }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="white"
          strokeWidth="12"
          fill="transparent"
          opacity="0.3"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-800">{completed}</span>
        <span className="text-lg text-gray-600">af {total}</span>
      </div>
    </div>
  );
}