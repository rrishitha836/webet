import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div
      className={
        "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-md " +
        "bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 " +
        className
      }
      aria-hidden
    >
      {/* ShowChart-style: clean ascending line + bar accent */}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* Ascending trend line */}
        <polyline
          points="3 17 8 11 13 14 21 5"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead tip */}
        <polyline
          points="16 5 21 5 21 10"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
