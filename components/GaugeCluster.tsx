
import React, { useMemo } from 'react';

interface GaugeClusterProps {
  speed: number; // km/h
}

const GaugeCluster: React.FC<GaugeClusterProps> = ({ speed }) => {
  // Simulate Gear and RPM based on speed for visual effect
  const { gear, rpm, maxRpm } = useMemo(() => {
    const maxRpm = 7500;
    let gear = 1;
    let rpm = 0;

    // Simple fake transmission logic
    if (speed < 1) { gear = 1; rpm = 800; } // Idle
    else if (speed < 60) { gear = 1; rpm = (speed / 60) * maxRpm; }
    else if (speed < 105) { gear = 2; rpm = ((speed - 60) / 45) * maxRpm * 0.8 + 2000; }
    else if (speed < 150) { gear = 3; rpm = ((speed - 105) / 45) * maxRpm * 0.8 + 2500; }
    else if (speed < 190) { gear = 4; rpm = ((speed - 150) / 40) * maxRpm * 0.8 + 3000; }
    else if (speed < 220) { gear = 5; rpm = ((speed - 190) / 30) * maxRpm * 0.8 + 3500; }
    else { gear = 6; rpm = ((speed - 220) / 40) * maxRpm * 0.8 + 4000; }

    // Add some noise/fluctuation
    rpm = Math.min(maxRpm, Math.max(800, rpm));
    
    return { gear, rpm, maxRpm };
  }, [speed]);

  const rpmPercentage = rpm / maxRpm;
  const isRedline = rpm > 7000;

  // Calculate stroke dash for the RPM ring (approx 240 degrees visible)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const visibleCircumference = circumference * 0.75; // 75% of circle visible
  const strokeDashoffset = circumference - (rpmPercentage * visibleCircumference);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 border border-gray-800 relative font-['Share_Tech_Mono']">
      
      <div className="relative w-48 h-48 flex items-center justify-center mt-2">
        {/* Gauge SVG */}
        <svg width="100%" height="100%" viewBox="0 0 200 200" className="transform rotate-[135deg]">
          {/* Track BG */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#333"
            strokeWidth="12"
            strokeDasharray={`${visibleCircumference} ${circumference}`}
            strokeLinecap="round"
          />
          {/* RPM Fill */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={isRedline ? "#ef4444" : "#fff"}
            strokeWidth="12"
            strokeDasharray={`${visibleCircumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-100 ease-linear"
            style={{ filter: isRedline ? 'drop-shadow(0 0 8px rgba(239,68,68,0.8))' : 'none' }}
          />
        </svg>

        {/* Center Info (Rotated back to normal) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Gear */}
            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center mb-1 border border-gray-700 shadow-inner">
                <span className="text-2xl font-bold text-yellow-500">{gear}</span>
            </div>
            
            {/* Speed */}
            <div className="flex flex-col items-center -mt-1">
                <span className="text-5xl font-bold text-white tracking-tighter leading-none">
                    {Math.round(speed)}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">km/h</span>
            </div>
        </div>
        
        {/* RPM Label */}
        <div className="absolute bottom-4 text-[10px] text-gray-500 font-bold">
            {(rpm / 1000).toFixed(1)} x1000 r/min
        </div>
      </div>
    </div>
  );
};

export default GaugeCluster;
