
import React from 'react';
import { StrategyAction } from '../types';

interface StrategyPanelProps {
  selectedCarId: string | null;
  currentTireLife?: number;
  gapAhead?: number | null; // Time in seconds
  gapBehind?: number | null; // Time in seconds
  onAction: (action: StrategyAction) => void;
}

const StrategyPanel: React.FC<StrategyPanelProps> = ({ selectedCarId, currentTireLife, gapAhead, gapBehind, onAction }) => {
  if (!selectedCarId) {
    return (
        <div className="p-4 text-gray-500 text-xs italic border border-gray-800 bg-gray-900/50 h-full flex items-center justify-center font-['Inter']">
            Select a car to view strategy options
        </div>
    );
  }

  const tireLife = currentTireLife || 100;

  // --- Strategy Logic ---
  
  // 1. PIT STOP: Critical tire wear
  const isPitRecommended = tireLife < 40;

  // 2. ATTACK: Car ahead is close (< 2s) and tires aren't dead
  const isAttackRecommended = !isPitRecommended && gapAhead !== null && gapAhead !== undefined && gapAhead < 2.0 && tireLife > 30;

  // 3. DEFEND: Car behind is close (< 1.5s)
  const isDefendRecommended = !isPitRecommended && gapBehind !== null && gapBehind !== undefined && gapBehind < 1.5;

  // 4. CONSERVE: Tires are wearing (40-60%) but not critical yet, or stuck in traffic but can't pass
  const isConserveRecommended = !isPitRecommended && !isAttackRecommended && !isDefendRecommended && (tireLife < 60 || (gapAhead !== null && gapAhead < 1.0));

  // 5. PUSH: Clear air (gap ahead > 2s) and good tires (> 60%)
  const isPushRecommended = !isPitRecommended && !isDefendRecommended && tireLife >= 60 && (gapAhead === null || gapAhead > 2.0);

  // 6. HOLD GAP: Comfortable gaps front and back
  const isHoldRecommended = !isPitRecommended && !isPushRecommended && !isConserveRecommended && !isAttackRecommended && !isDefendRecommended;

  // Helper for button styles
  const getButtonStyle = (isActive: boolean, baseBorderColor: string, activeTextColor: string) => {
    return `p-3 bg-gray-800 text-xs font-bold transition-all uppercase tracking-wide relative overflow-hidden group
        ${isActive 
            ? `border-2 ${baseBorderColor} ${activeTextColor} shadow-[0_0_15px_rgba(0,0,0,0.5)] scale-[1.02] z-10` 
            : 'border border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500'
        }`;
  };

  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 h-full flex flex-col font-['Inter']">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b border-gray-800 pb-2 font-['Share_Tech_Mono'] font-bold">
        Race Strategy: Car #{selectedCarId}
      </h3>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Option 1: PIT STOP */}
        <button 
            onClick={() => onAction(StrategyAction.PIT)}
            className={getButtonStyle(isPitRecommended, 'border-red-500', 'text-red-500 animate-pulse')}
        >
            <span className="relative z-10">{isPitRecommended ? 'BOX BOX BOX' : 'PIT STOP'}</span>
            {isPitRecommended && (
                 <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping mr-1 mt-1"></div>
            )}
        </button>

        {/* Option 2: PUSH */}
        <button 
             onClick={() => onAction(StrategyAction.PUSH)}
             className={getButtonStyle(isPushRecommended, 'border-green-500', 'text-green-400')}
        >
            PUSH MODE
            {isPushRecommended && <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>}
        </button>

        {/* Option 3: ATTACK */}
        <button 
             onClick={() => onAction(StrategyAction.ATTACK)}
             className={getButtonStyle(isAttackRecommended, 'border-orange-500', 'text-orange-400')}
        >
            ATTACK
             {isAttackRecommended && <div className="absolute inset-0 bg-orange-500/5 animate-pulse"></div>}
        </button>

        {/* Option 4: DEFEND */}
        <button 
             onClick={() => onAction(StrategyAction.DEFEND)}
             className={getButtonStyle(isDefendRecommended, 'border-cyan-500', 'text-cyan-400')}
        >
            DEFEND
             {isDefendRecommended && <div className="absolute inset-0 bg-cyan-500/5 animate-pulse"></div>}
        </button>

        {/* Option 5: CONSERVE */}
        <button 
             onClick={() => onAction(StrategyAction.CONSERVE)}
             className={getButtonStyle(isConserveRecommended, 'border-yellow-500', 'text-yellow-400')}
        >
            CONSERVE
        </button>

        {/* Option 6: HOLD GAP */}
        <button 
             onClick={() => onAction(StrategyAction.HOLD)}
             className={getButtonStyle(isHoldRecommended, 'border-blue-500', 'text-blue-400')}
        >
            HOLD GAP
        </button>
      </div>

      <div className="bg-black/50 p-2 border border-gray-800 mt-auto flex flex-col min-h-0">
        <div className="text-[10px] text-gray-500 mb-1 font-['Share_Tech_Mono'] font-bold shrink-0 uppercase">AI STRATEGY INSIGHT</div>
        <div className="overflow-y-auto custom-scrollbar pr-1 max-h-24">
            <p className="text-xs text-gray-300 leading-relaxed">
                {isPitRecommended ? (
                     <span>
                        <span className="text-red-500 font-bold animate-pulse">CRITICAL:</span> Tire degradation high ({Math.round(tireLife)}%). Box now to maintain net position.
                     </span>
                ) : isAttackRecommended ? (
                    <span>
                        <span className="text-orange-400 font-bold">OVERTAKE:</span> Gap ahead is {(gapAhead || 0).toFixed(1)}s. Tires optimal. Increase engine mode and attack.
                    </span>
                ) : isDefendRecommended ? (
                    <span>
                        <span className="text-cyan-400 font-bold">DEFEND:</span> Car behind within {(gapBehind || 0).toFixed(1)}s. Use energy deployment to break tow on straights.
                    </span>
                ) : isConserveRecommended ? (
                    <span>
                         <span className="text-yellow-400 font-bold">MANAGE:</span> Tire wear accumulating. Lift and coast to extend stint length.
                    </span>
                ) : isPushRecommended ? (
                    <span>
                        <span className="text-green-400 font-bold">PUSH:</span> Clean air. Hammer time. Maximize pace to build gap.
                    </span>
                ) : (
                    <span>
                        <span className="text-blue-400 font-bold">HOLD:</span> Gaps stable. Maintain target lap delta.
                    </span>
                )}
            </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;
