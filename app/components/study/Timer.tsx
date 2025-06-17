import { useEffect, useState } from 'react';

export interface TimerProps {
  startTime: Date;
  isRunning?: boolean;
  className?: string;
}

const Timer = ({ startTime, isRunning = true, className = '' }: TimerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 ${className}`}>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-mono text-sm" aria-label={`経過時間 ${formatTime(elapsedTime)}`}>
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};

export default Timer;