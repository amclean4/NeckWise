import React from 'react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const scoreColor = score > 85 ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-500';
  const circumference = 2 * Math.PI * 54; // 2 * pi * radius
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        {/* Background Circle */}
        <circle
          className="text-slate-700"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r="54"
          cx="60"
          cy="60"
        />
        {/* Progress Circle */}
        <circle
          className={`${scoreColor} transition-all duration-500 ease-in-out`}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="54"
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-5xl font-bold ${scoreColor} transition-colors duration-500`}>{score}</span>
      </div>
    </div>
  );
};

export default ScoreDisplay;
