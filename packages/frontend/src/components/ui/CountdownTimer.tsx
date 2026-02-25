'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date | string;
  onExpire?: () => void;
}

export function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        onExpire?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (!timeLeft) {
    return <span className="text-red-600 font-semibold">Expired</span>;
  }

  return (
    <div className="flex gap-2 items-center">
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{timeLeft.days}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Days</span>
        </div>
      )}
      <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">Hours</span>
      </div>
      <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
      <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">Mins</span>
      </div>
      <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
      <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
        <span className="text-xl font-bold text-gray-900 dark:text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">Secs</span>
      </div>
    </div>
  );
}
