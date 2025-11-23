
import React, { useMemo } from 'react';
import { CarData } from '../types';
import { parseTimeStr } from '../utils';

interface StrategyImpactPanelProps {
  selectedCarId: string | null;
  carData: CarData[];
  currentLap: number;
  currentTireLife?: number; // Live simulation data
  gapAhead: number | null;
  gapBehind: number | null;
}

const StrategyImpactPanel: React.FC<StrategyImpactPanelProps> = ({ 
  selectedCarId, 
  carData, 
  currentLap,
  currentTireLife,
  gapAhead,
  gapBehind 
}) => {
  
  const analysis = useMemo(() => {
    if (!selectedCarId || carData.length === 0) return null;

    // 1. Get History for Selected Car
    const fullHistory = carData
      .filter(c => c.number === selectedCarId)
      .sort((a, b) => a.lapNumber - b.lapNumber);

    if (fullHistory.length === 0) return null;

    // IMPORTANT: Limit analysis to what has happened so far in the current race cycle
    // This prevents the panel from looking into the "future" if we restart the lap count
    const historySoFar = fullHistory.filter(h => h.lapNumber <= currentLap);
    const lastLap = historySoFar[historySoFar.length - 1] || fullHistory[0];
    
    // 2. Tire Status (Using Live Sim Data)
    // Use the simulated tire life value which resets on race restart
    const tireLife = currentTireLife ?? 100;
    const tireStatus = tireLife > 80 ? 'FRESH' : tireLife > 40 ? 'USED' : 'OLD';
    
    // Degradation: Slope of last 3 valid flying laps *so far*
    let degradation = 0;
    const flyingLaps = historySoFar.filter(l => parseTimeStr(l.lapTimeStr) < 120); // Filter out pit laps/yellows
    if (flyingLaps.length >= 3) {
        const l1 = parseTimeStr(flyingLaps[flyingLaps.length - 1].lapTimeStr);
        const l3 = parseTimeStr(flyingLaps[flyingLaps.length - 3].lapTimeStr);
        degradation = (l1 - l3) / 2; // Seconds lost per lap
    }

    // 3. Sector Analysis
    // Compare against field average for the same lap
    const fieldThisLap = carData.filter(c => c.lapNumber === lastLap.lapNumber && c.number !== selectedCarId);
    
    let bestSector = "None";
    let sectorAdvantage = 0;

    if (fieldThisLap.length > 0) {
        const avgS1 = fieldThisLap.reduce((acc, c) => acc + c.s1, 0) / fieldThisLap.length;
        const avgS2 = fieldThisLap.reduce((acc, c) => acc + c.s2, 0) / fieldThisLap.length;
        const avgS3 = fieldThisLap.reduce((acc, c) => acc + c.s3, 0) / fieldThisLap.length;

        const diffS1 = avgS1 - lastLap.s1;
        const diffS2 = avgS2 - lastLap.s2;
        const diffS3 = avgS3 - lastLap.s3;

        // Find max advantage
        const maxDiff = Math.max(diffS1, diffS2, diffS3);
        if (maxDiff > 0) {
            if (maxDiff === diffS1) bestSector = "S1";
            else if (maxDiff === diffS2) bestSector = "S2";
            else bestSector = "S3";
            sectorAdvantage = maxDiff;
        }
    }

    // 4. Speed Advantage
    const avgFieldSpeed = fieldThisLap.reduce((acc, c) => acc + (c.speed || 0), 0) / Math.max(fieldThisLap.length, 1);
    const topSpeed = lastLap.speed || 0;
    const speedDiff = topSpeed - (avgFieldSpeed || 180);

    // 5. Strategic Recommendation
    // Colors matched exactly to StrategyPanel.tsx
    let action = "MAINTAIN";
    let confidence = 50;
    let reason = "Hold Position";
    let styleColor = "text-blue-400"; // Matches HOLD GAP

    if (tireLife < 40) {
        action = "PIT STOP";
        confidence = 95;
        reason = "High Tire Deg";
        styleColor = "text-red-500 animate-pulse"; // Matches PIT STOP
    } else if (gapAhead !== null && gapAhead < 1.2 && speedDiff > 2) {
        action = "ATTACK";
        confidence = 85;
        reason = `Pace Adv (${speedDiff.toFixed(0)}kph)`;
        styleColor = "text-orange-400"; // Matches ATTACK
    } else if (gapBehind !== null && gapBehind < 0.8) {
        action = "DEFEND";
        confidence = 90;
        reason = "Gap Critical";
        styleColor = "text-cyan-400"; // Matches DEFEND
    } else if (degradation > 0.3) {
        action = "CONSERVE";
        confidence = 70;
        reason = "Managing Wear";
        styleColor = "text-yellow-400"; // Matches CONSERVE
    } else if (gapAhead === null || gapAhead > 3.0) {
        action = "PUSH";
        confidence = 60;
        reason = "Clean Air";
        styleColor = "text-green-400"; // Matches PUSH
    }

    return {
        currentLap,
        degradation: degradation.toFixed(2),
        tireStatus,
        tireLife,
        bestSector,
        sectorAdvantage: sectorAdvantage.toFixed(2),
        speedDiff: speedDiff.toFixed(1),
        action,
        confidence,
        reason,
        styleColor,
        lastLapTime: lastLap.lapTimeStr,
        lapsAnalyzed: historySoFar.length
    };
  }, [selectedCarId, carData, currentLap, currentTireLife, gapAhead, gapBehind]);

  if (!selectedCarId) {
      return <div className="bg-gray-900/50 border-t border-gray-800 p-4 text-center text-xs text-gray-600 font-['Inter']">Select a car for analysis</div>;
  }

  if (!analysis) {
      return <div className="bg-gray-900/50 border-t border-gray-800 p-4 text-center text-xs text-gray-600 font-['Inter']">Insufficient data</div>;
  }

  const formatGap = (gap: number | null) => {
      if (gap === null) return 'CLEAR';
      const formatted = `+${gap.toFixed(2)}s`;
      if (gap > 5.0) return `${formatted} (CLEAR)`;
      if (gap > 2.0) return `${formatted} (SAFE)`;
      return formatted;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 border-t border-gray-800 font-['Inter']">
      <div className="p-2 bg-gray-900 text-xs font-bold text-gray-500 border-b border-gray-800 uppercase font-['Share_Tech_Mono'] font-bold">
        Strategy Impact
      </div>
      
      <div className="p-3 grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar">
        
        {/* Tire Status */}
        <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
            <div>
                <div className="text-[9px] text-gray-500 uppercase font-bold">Tire Status</div>
                <div className="text-xs text-white font-mono">
                    {Math.round(analysis.tireLife)}% <span className="text-gray-500">({analysis.tireStatus})</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-gray-500 uppercase font-bold">Degradation</div>
                <div className={`text-xs font-mono font-bold ${Number(analysis.degradation) > 0.5 ? 'text-red-500' : 'text-green-500'}`}>
                    {Number(analysis.degradation) > 0 ? `+${analysis.degradation}` : analysis.degradation} s/lap
                </div>
            </div>
        </div>

        {/* Sectors & Speed */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-800/50 pb-2">
            <div>
                <div className="text-[9px] text-gray-500 uppercase font-bold">Best Sector</div>
                <div className="text-xs text-white font-mono flex items-center gap-1">
                    <span className="text-yellow-400">{analysis.bestSector}</span>
                    {Number(analysis.sectorAdvantage) > 0 && (
                        <span className="text-[9px] text-gray-400 font-semibold">
                            (Adv: -{analysis.sectorAdvantage}s)
                        </span>
                    )}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-gray-500 uppercase font-bold">Speed Adv</div>
                <div className={`text-xs font-mono ${Number(analysis.speedDiff) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(analysis.speedDiff) > 0 ? '+' : ''}{analysis.speedDiff} kph
                </div>
            </div>
        </div>

        {/* Gaps */}
        <div className="grid grid-cols-2 gap-2 border-b border-gray-800/50 pb-2">
             <div>
                <div className="text-[9px] text-gray-500 uppercase font-bold">Gap Ahead</div>
                <div className="text-xs text-white font-mono">
                    {formatGap(gapAhead)}
                </div>
            </div>
            <div className="text-right">
                <div className="text-[9px] text-gray-500 uppercase font-bold">Gap Behind</div>
                <div className="text-xs text-white font-mono">
                    {formatGap(gapBehind)}
                </div>
            </div>
        </div>

        {/* Recommendation Box */}
        <div className="bg-black/40 border border-gray-700 rounded p-2 mt-1">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[9px] text-gray-500 uppercase font-bold">AI Recommendation</span>
                <span className="text-[9px] text-gray-400">{analysis.confidence}% (based on {analysis.lapsAnalyzed} laps)</span>
            </div>
            <div className="flex items-center justify-between">
                {/* Font set to default (Inter) to match Strategy Panel buttons */}
                <span className={`text-sm font-bold tracking-wide ${analysis.styleColor}`}>
                    {analysis.action}
                </span>
                <span className="text-[10px] text-gray-300 uppercase font-semibold">
                    {analysis.reason}
                </span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StrategyImpactPanel;
