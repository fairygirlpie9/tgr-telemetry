
import React from 'react';
import { SimulationState, CarStatus } from '../types';

interface LeaderboardProps {
  simState: SimulationState;
  onSelectCar: (id: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ simState, onSelectCar }) => {
  const sortedCars = (Object.entries(simState.cars) as [string, CarStatus][]).sort(([, a], [, b]) => {
     if (a.lap !== b.lap) return b.lap - a.lap;
     return b.position - a.position;
  });

  return (
    <div className="h-full overflow-auto bg-gray-900/50 border border-gray-800 text-xs font-['Inter']">
      <table className="w-full text-left border-collapse">
        <thead className="bg-black sticky top-0 text-gray-400 uppercase font-['Share_Tech_Mono'] font-bold">
          <tr>
            <th className="p-2 border-b border-gray-800">Pos</th>
            <th className="p-2 border-b border-gray-800">Car</th>
            <th className="p-2 border-b border-gray-800">Lap</th>
            <th className="p-2 border-b border-gray-800">Last</th>
          </tr>
        </thead>
        <tbody>
          {sortedCars.map(([id, car], index) => (
            <tr 
              key={id} 
              onClick={() => onSelectCar(id)}
              className={`cursor-pointer hover:bg-gray-800 transition-colors ${simState.selectedCarId === id ? 'bg-red-900/20 border-l-2 border-red-600' : ''}`}
            >
              <td className="p-2 border-b border-gray-800/50 text-white font-bold">{index + 1}</td>
              <td className="p-2 border-b border-gray-800/50 text-red-500 font-bold font-['Share_Tech_Mono']">#{id}</td>
              <td className="p-2 border-b border-gray-800/50 text-gray-300">{car.lap}</td>
              <td className="p-2 border-b border-gray-800/50 font-mono text-[10px]">
                {car.finished ? (
                    <span className="text-yellow-500 font-bold">FIN</span>
                ) : (
                    car.lastLapTime || '--:--'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
