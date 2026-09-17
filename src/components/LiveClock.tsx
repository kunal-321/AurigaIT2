import { useEffect, useState } from 'react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;

  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-baseline gap-1 font-mono-plate">
        <span className="text-sm font-bold text-gray-900">
          {String(h12).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </span>
        <span className={`text-[10px] font-semibold ${seconds % 2 === 0 ? 'text-indigo-600' : 'text-gray-400'} transition-colors`}>
          :{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-[10px] font-bold text-gray-500">{ampm}</span>
      </div>
      <div className="text-[10px] text-gray-500 font-medium">{dateStr}</div>
    </div>
  );
}
