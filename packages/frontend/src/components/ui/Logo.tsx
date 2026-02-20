import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  // Circular gradient badge with a compact "trend up" icon inside.
  // Used in the admin header — replaces the previous 'W' mark.
  return (
    <div
      className={"w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white " + className}
      aria-hidden
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* zig-zag trend line */}
        <polyline points="5 15 9 11 13 15 18 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* arrowhead at the end pointing up-right */}
        <path d="M17.8 8.2L20.8 8.2L20.8 11.2" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
