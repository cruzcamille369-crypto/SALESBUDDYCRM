
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlarmClock } from 'lucide-react';

interface CountdownBadgeProps {
  targetTimestamp: number;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({ targetTimestamp }) => {
  const [timeLeft, setTimeLeft] = useState<number>(() => targetTimestamp - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetTimestamp - Date.now());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  const formatDelta = (ms: number) => {
    const absMs = Math.abs(ms);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    const s = Math.floor((absMs % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const isOverdue = timeLeft < 0;
  const isCritical = timeLeft > 0 && timeLeft < 600000; // < 10 mins
  
  // Styles
  const overdueStyle = "bg-rose-500 text-surface-main animate-pulse border-rose-500 shadow-lg shadow-status-error/20";
  const criticalStyle = "bg-amber-500 text-surface-main border-amber-500 shadow-lg shadow-status-warning/20 animate-pulse";
  const normalStyle = "bg-surface-alt text-text-muted border-border-subtle";
  const futureStyle = "bg-indigo-600/10 text-indigo-600 border-indigo-600/20";

  let currentStyle = normalStyle;
  let icon = <Clock size={16} />;

  if (isOverdue) {
      currentStyle = overdueStyle;
      icon = <AlertTriangle size={16} />;
  } else if (isCritical) {
      currentStyle = criticalStyle;
      icon = <AlarmClock size={16} />;
  } else if (timeLeft < 3600000) {
      currentStyle = "bg-amber-500/10 text-amber-500 border-amber-500/30";
  } else {
      currentStyle = futureStyle;
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold  tracking-wider transition-colors ${currentStyle}`}>
      {icon}
      <span>
        {isOverdue ? `Overdue +${formatDelta(timeLeft)}` : `Due in ${formatDelta(timeLeft)}`}
      </span>
    </div>
  );
};
