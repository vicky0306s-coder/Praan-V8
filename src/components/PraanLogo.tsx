import React from 'react';

interface PraanLogoProps {
  className?: string;
  size?: number;
}

export const PraanLogo: React.FC<PraanLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={style}
      aria-label="Praan Heart Circuit Logo"
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="praanCircuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f4bd64" />
            <stop offset="50%" stopColor="#ba704f" />
            <stop offset="100%" stopColor="#c4684e" />
          </linearGradient>
          <linearGradient id="praanHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#166458" />
            <stop offset="100%" stopColor="#0e534d" />
          </linearGradient>
          <filter id="praanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Heart Shape in Deep Jade Green */}
        <path
          d="M100 178 C35 125 15 85 15 52 C15 25 36 8 64 8 C80 8 94 16 100 28 C106 16 120 8 136 8 C164 8 185 25 185 52 C185 85 165 125 100 178 Z"
          fill="url(#praanHeartGrad)"
        />

        {/* Inner Heart Cutout & Circuit Container */}
        {/* Left Circuit Pattern */}
        <path
          d="M42 54 C42 38 52 28 65 28 C74 28 82 33 87 42 C84 46 80 50 78 56 C74 65 74 85 74 100 C65 95 56 86 48 76 C44 70 42 62 42 54 Z"
          fill="url(#praanCircuitGrad)"
          opacity="0.95"
        />

        {/* Circuit Traces */}
        <path
          d="M62 40 L62 92 L88 118"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M74 42 L74 80 L96 102"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M86 48 L86 70 L108 92"
          stroke="#f4bd64"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Circuit Node Dots */}
        <circle cx="88" cy="118" r="4.5" fill="#ffffff" />
        <circle cx="62" cy="40" r="4" fill="#ffffff" />
        <circle cx="74" cy="42" r="3.5" fill="#f4bd64" />
        <circle cx="108" cy="92" r="4" fill="#f4bd64" />

        {/* Terracotta/Gold Data Nodes on Right Chamber */}
        <circle cx="124" cy="95" r="7.5" fill="#c4684e" />
        <circle cx="136" cy="120" r="6" fill="#f4bd64" />

        {/* Central Shield with Cross */}
        <path
          d="M100 115 L120 128 L120 152 Q120 162 100 172 Q80 162 80 152 L80 128 Z"
          fill="#ffffff"
          stroke="#166458"
          strokeWidth="2.5"
        />

        {/* Medical Cross Inside Shield */}
        <path
          d="M96 134 H104 V142 H112 V148 H104 V156 H96 V148 H88 V142 H96 V134 Z"
          fill="#c4684e"
        />
      </svg>
    </div>
  );
};
