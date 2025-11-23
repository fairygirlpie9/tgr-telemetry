
import React from 'react';

interface CarSchematicProps {
  speed: number;
  braking: boolean;
  tireLife: number;
}

const CarSchematic: React.FC<CarSchematicProps> = ({ speed, braking, tireLife }) => {
  // Helper to determine tire color based on wear
  const getTireColor = (life: number) => {
    if (life > 70) return '#22c55e'; // Green
    if (life > 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const tireColor = getTireColor(tireLife);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-900/50 border border-gray-800 relative overflow-hidden">
      <div className="absolute top-2 left-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider font-['Share_Tech_Mono']">
        Chassis Telemetry
      </div>
      
      {/* Main Container SVG */}
      <svg viewBox="0 0 200 300" className="w-full h-full max-h-[280px] drop-shadow-2xl">
        
        {/* --- MECHANICAL PARTS UNDERLAY --- */}

        {/* Rear Axle (Drive) */}
        <rect x="40" y="215" width="120" height="6" fill="#333" />
        
        {/* Front Axle */}
        <rect x="40" y="65" width="120" height="6" fill="#333" />
        
        {/* Driveshaft */}
        <rect x="98" y="140" width="4" height="75" fill="#222" />

        {/* --- BODYWORK (GR86 Silhouette) --- */}
        {/* 
            Toyota GR86 proportions adjusted:
            - Straightened door panels (no hourglass pinch)
            - Flared fenders kept
            - Integrated ducktail
        */}
        <path 
            d="
            M 100 35
            C 115 35 130 40 140 50  
            Q 148 60 148 80       
            L 148 180             
            C 148 200 155 215 155 215 
            Q 155 240 145 260     
            Q 140 270 100 275     
            Q 60 270 55 260       
            Q 45 240 45 215       
            C 45 215 52 200 52 180 
            L 52 80               
            Q 52 60 60 50         
            C 70 40 85 35 100 35
            Z
            " 
            fill="none" 
            stroke="#777" 
            strokeWidth="2" 
        />

        {/* Hood Lines (Long Hood) */}
        <path d="M 75 50 Q 70 90 70 105" fill="none" stroke="#333" strokeWidth="1" opacity="0.5"/>
        <path d="M 125 50 Q 130 90 130 105" fill="none" stroke="#333" strokeWidth="1" opacity="0.5"/>

        {/* Windshield (Set back) */}
        <path d="M 70 110 Q 100 105 130 110 L 135 135 Q 100 130 65 135 Z" fill="#111" stroke="#333" strokeWidth="1" opacity="0.3" />
        
        {/* Side Windows / Roofline */}
        <path d="M 65 135 L 65 190 Q 100 190 135 190 L 135 135" fill="none" stroke="#333" strokeWidth="1" />

        {/* Rear Window / Deck */}
        <path d="M 68 195 Q 100 190 132 195 L 130 215 Q 100 210 70 215 Z" fill="#111" stroke="#333" strokeWidth="1" opacity="0.3" />

        {/* Ducktail Spoiler Line */}
        <path d="M 55 260 Q 100 250 145 260" fill="none" stroke="#777" strokeWidth="2" />

        {/* Wing Mirrors */}
        <path d="M 55 115 L 40 110 L 42 125 Z" fill="#333" stroke="#555" strokeWidth="1" />
        <path d="M 145 115 L 160 110 L 158 125 Z" fill="#333" stroke="#555" strokeWidth="1" />

        {/* Engine / Center Block - Reacts to Speed */}
        <rect 
            x="85" 
            y="70" 
            width="30" 
            height="35" 
            rx="2"
            fill={speed > 100 ? `rgba(255, 165, 0, ${Math.min(speed / 250, 1)})` : '#222'}
            stroke="#444"
            className="transition-colors duration-200"
        />
        <text x="100" y="91" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="Share Tech Mono">
            FA24
        </text>

        {/* --- TIRES (Wider track width) --- */}
        
        {/* Front Left */}
        <g transform="translate(30, 60)">
           {/* Brake Heat Indicator */}
           {braking && (
             <circle cx="10" cy="20" r="18" fill="url(#brakeGlow)" opacity="0.8" />
           )}
           <rect x="0" y="0" width="20" height="35" rx="3" fill="#1a1a1a" stroke={tireColor} strokeWidth="2" />
        </g>

        {/* Front Right */}
        <g transform="translate(150, 60)">
           {braking && (
             <circle cx="10" cy="20" r="18" fill="url(#brakeGlow)" opacity="0.8" />
           )}
           <rect x="0" y="0" width="20" height="35" rx="3" fill="#1a1a1a" stroke={tireColor} strokeWidth="2" />
        </g>

        {/* Rear Left */}
        <g transform="translate(30, 210)">
           {/* Brake Heat */}
           {braking && (
             <circle cx="10" cy="20" r="16" fill="url(#brakeGlow)" opacity="0.6" />
           )}
           <rect x="0" y="0" width="22" height="35" rx="3" fill="#1a1a1a" stroke={tireColor} strokeWidth="2" />
        </g>

        {/* Rear Right */}
        <g transform="translate(148, 210)">
           {braking && (
             <circle cx="10" cy="20" r="16" fill="url(#brakeGlow)" opacity="0.6" />
           )}
           <rect x="0" y="0" width="22" height="35" rx="3" fill="#1a1a1a" stroke={tireColor} strokeWidth="2" />
        </g>

        {/* Tire Info Labels (Centered relative to axles, larger font) */}
        <text x="25" y="82" textAnchor="end" fill={tireColor} fontSize="12" fontWeight="bold" fontFamily="Share Tech Mono">{Math.round(tireLife)}%</text>
        <text x="175" y="82" textAnchor="start" fill={tireColor} fontSize="12" fontWeight="bold" fontFamily="Share Tech Mono">{Math.round(tireLife)}%</text>
        <text x="25" y="232" textAnchor="end" fill={tireColor} fontSize="12" fontWeight="bold" fontFamily="Share Tech Mono">{Math.round(tireLife)}%</text>
        <text x="175" y="232" textAnchor="start" fill={tireColor} fontSize="12" fontWeight="bold" fontFamily="Share Tech Mono">{Math.round(tireLife)}%</text>


        {/* Brake Glow Gradient Definition */}
        <defs>
            <radialGradient id="brakeGlow">
                <stop offset="0%" stopColor="#ff4500" stopOpacity="1" />
                <stop offset="70%" stopColor="#ff0000" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
            </radialGradient>
        </defs>

      </svg>

      {/* Status Text Overlay */}
      <div className="absolute bottom-2 w-full flex justify-between px-6 text-xs font-['Inter']">
        <div className="flex flex-col items-center">
            <span className="text-gray-500 text-[9px] font-['Share_Tech_Mono'] uppercase">BRAKE</span>
            <span className={`font-bold text-[10px] ${braking ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                {braking ? 'ACTIVE' : 'OFF'}
            </span>
        </div>
        <div className="flex flex-col items-center w-16">
            <span className="text-gray-500 text-[9px] font-['Share_Tech_Mono'] uppercase">THROTTLE</span>
            <div className="w-full h-1.5 bg-gray-800 rounded mt-1 overflow-hidden">
                <div 
                    className="h-full bg-green-500 rounded transition-all duration-100" 
                    style={{width: braking ? '0%' : `${Math.min(speed/2.2, 100)}%`}}
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CarSchematic;
