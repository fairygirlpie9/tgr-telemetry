
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { parseCarCsv, parseTrackData, parseWeatherCsv, parseTimeStr } from './utils';
import { RAW_CAR_DATA, RAW_TRACK_DATA, RAW_WEATHER_DATA } from './data';
import { CarData, TrackPoint, SimulationState, StrategyAction, WeatherData, CarStatus } from './types';
import TrackView from './components/TrackView';
import Leaderboard from './components/Leaderboard';
import StrategyPanel from './components/StrategyPanel';
import CarSchematic from './components/CarSchematic';
import GaugeCluster from './components/GaugeCluster';
import StrategyImpactPanel from './components/StrategyImpactPanel';

// Simulation Constants
const TIME_SCALE = 5.0; // Speed up simulation
const LAP_LENGTH_METERS = 3800; // Approx length of Barber

const App: React.FC = () => {
  // Data State
  const [carData, setCarData] = useState<CarData[]>([]);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  
  // Simulation State
  const [simTime, setSimTime] = useState<number>(0);
  const [simState, setSimState] = useState<SimulationState>({
    currentTime: 0,
    isPlaying: true,
    selectedCarId: null,
    cars: {}
  });

  // Fix: Provide initial value for useRef to match generic type usage in strict mode
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);

  // Initialization
  useEffect(() => {
    const cars = parseCarCsv(RAW_CAR_DATA);
    const track = parseTrackData(RAW_TRACK_DATA);
    const weather = parseWeatherCsv(RAW_WEATHER_DATA);

    setCarData(cars);
    setTrackPoints(track);
    setWeatherData(weather);

    // Initialize Sim State for unique cars
    const initialCars: SimulationState['cars'] = {};
    const uniqueIds = Array.from(new Set(cars.map(c => c.number)));
    
    uniqueIds.forEach(id => {
        initialCars[id] = {
            position: Math.random() * 0.15, // Stagger start
            lap: 0,
            speed: 100, // Start with some speed
            braking: false,
            lastLapTime: '',
            gapToLeader: 0,
            tireLife: 100 - (Math.random() * 10), // Random initial wear
            strategy: StrategyAction.PUSH,
            finished: false
        };
    });

    setSimState(prev => {
      const newState = { ...prev, cars: initialCars };
      if (uniqueIds.length > 0 && !prev.selectedCarId) {
        newState.selectedCarId = uniqueIds[0];
      }
      return newState;
    });
  }, []);

  // Simulation Loop
  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = (time - previousTimeRef.current) / 1000;
      
      setSimTime(prev => {
        const newTime = prev + (deltaTime * TIME_SCALE);
        
        setSimState(currentState => {
            const nextCars = { ...currentState.cars };
            
            // Define braking zones as approximate percentages of the track
            // 0.15 (T1/T2), 0.35 (T5), 0.55 (T7/8 complex), 0.85 (T14/15)
            const brakingZones = [0.15, 0.35, 0.55, 0.85];

            Object.keys(nextCars).forEach(carId => {
                const currentCar = nextCars[carId];
                
                // Get Data History
                const carHistory = carData.filter(c => c.number === carId).sort((a,b) => a.lapNumber - b.lapNumber);
                
                // Safety Check
                if (carHistory.length === 0) return;

                // Fallback if lap is out of bounds (should happen briefly before reset)
                const dataIndex = Math.min(currentCar.lap, carHistory.length - 1);
                const currentLapData = carHistory[dataIndex];
                
                if (currentLapData) {
                    // --- Realistic Speed Simulation ---
                    // Check if we are in a braking zone (within 5% of a braking point)
                    const isBraking = brakingZones.some(z => {
                        const dist = Math.abs(currentCar.position - z);
                        return dist < 0.05; // 5% window
                    });

                    // Target speeds
                    const maxSpeed = 225; // km/h on straights
                    const cornerSpeed = 70; // km/h in corners
                    
                    const targetSpeed = isBraking ? cornerSpeed : maxSpeed;
                    
                    // Interpolate current speed towards target (Simple physics)
                    const lerpFactor = isBraking ? 0.08 : 0.02; 
                    currentCar.speed = currentCar.speed + (targetSpeed - currentCar.speed) * lerpFactor;
                    
                    // Add slight noise
                    currentCar.speed += (Math.random() - 0.5) * 1.5;

                    // Calculate distance moved this frame based on current dynamic speed
                    const avgSpeedMps = (currentCar.speed / 3.6); // kph to mps
                    const distancePerFrame = avgSpeedMps * deltaTime * TIME_SCALE;
                    const progressDelta = distancePerFrame / LAP_LENGTH_METERS;
                    
                    let newPos = currentCar.position + progressDelta;
                    
                    if (newPos >= 1) {
                        newPos -= 1;
                        currentCar.lap += 1;
                        
                        // RESET LOGIC: If we run out of data, loop back to start
                        if (currentCar.lap >= carHistory.length) {
                            currentCar.lap = 0;
                            currentCar.tireLife = 100;
                            currentCar.lastLapTime = ''; 
                            // We keep position relative to start line
                        } else {
                            // Normal Lap Process
                            currentCar.lastLapTime = currentLapData.lapTimeStr;
                            // Simulate tire deg
                            currentCar.tireLife = Math.max(0, currentCar.tireLife - (Math.random() * 0.5));
                        }
                    }
                    
                    currentCar.position = newPos;
                    currentCar.braking = isBraking;
                }
            });

            return { ...currentState, cars: nextCars };
        });
        return newTime;
      });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [carData]);

  // Calculated gaps for the strategy panel
  const { gapAhead, gapBehind } = useMemo(() => {
     if (!simState.selectedCarId || Object.keys(simState.cars).length === 0) return { gapAhead: null, gapBehind: null };
     
     const sortedCars = (Object.entries(simState.cars) as [string, CarStatus][])
        .map(([id, car]) => ({
            id,
            totalDistance: car.lap + car.position,
            speed: car.speed
        }))
        .sort((a, b) => b.totalDistance - a.totalDistance); // Descending

     const myIndex = sortedCars.findIndex(c => c.id === simState.selectedCarId);
     
     if (myIndex === -1) return { gapAhead: null, gapBehind: null };

     let ahead = null;
     let behind = null;

     // Calc Gap Ahead
     if (myIndex > 0) {
         const carAhead = sortedCars[myIndex - 1];
         const myCar = sortedCars[myIndex];
         const distDiffLaps = carAhead.totalDistance - myCar.totalDistance;
         const distDiffMeters = distDiffLaps * LAP_LENGTH_METERS;
         // Time = Distance / Speed (mps)
         const speedMps = Math.max(myCar.speed / 3.6, 10); // avoid 0
         ahead = distDiffMeters / speedMps;
     }

     // Calc Gap Behind
     if (myIndex < sortedCars.length - 1) {
         const carBehind = sortedCars[myIndex + 1];
         const myCar = sortedCars[myIndex];
         const distDiffLaps = myCar.totalDistance - carBehind.totalDistance;
         const distDiffMeters = distDiffLaps * LAP_LENGTH_METERS;
         const speedMps = Math.max(carBehind.speed / 3.6, 10);
         behind = distDiffMeters / speedMps;
     }

     return { gapAhead: ahead, gapBehind: behind };

  }, [simState.cars, simState.selectedCarId]);


  const currentWeather = weatherData.length > 0 ? weatherData[0] : null;
  const selectedCarState = simState.selectedCarId ? simState.cars[simState.selectedCarId] : null;

  // Track Temp Logic: Use data if available, else Air Temp + 12
  const trackTempDisplay = currentWeather 
    ? (currentWeather.trackTemp > 0 ? currentWeather.trackTemp : (currentWeather.airTemp + 12).toFixed(1))
    : '--';

  return (
    <div className="flex flex-col min-h-screen md:h-screen w-full bg-black text-gray-200 md:overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 h-14 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tighter text-white font-['Saira']">
            TOYOTA <span className="text-red-600">GAZOO</span> RACING
          </h1>
          <div className="hidden sm:block text-xs px-2 py-1 bg-gray-800 rounded text-gray-400 border border-gray-700 font-['Share_Tech_Mono'] font-bold">
            BARBER MOTORSPORTS PARK
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-xs font-['Inter']">
           <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-gray-500 font-semibold font-['Share_Tech_Mono'] font-bold">AIR TEMP</span>
               <span className="font-bold text-white">{currentWeather?.airTemp || '--'}°C</span>
           </div>
           <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-gray-500 font-semibold font-['Share_Tech_Mono'] font-bold">TRACK TEMP</span>
               <span className="font-bold text-white text-red-400">{trackTempDisplay}°C</span>
           </div>
           <div className="flex flex-col items-end">
               <span className="text-gray-500 font-semibold font-['Share_Tech_Mono'] font-bold">SIM TIME</span>
               <span className="font-bold text-white">{(simTime / 60).toFixed(0)}:{(simTime % 60).toFixed(0).padStart(2, '0')}</span>
           </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        
        {/* Left: Leaderboard & Analysis */}
        <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col h-auto md:h-full">
            <div className="flex flex-col h-48 md:h-[60%] border-b border-gray-800">
                <div className="p-2 bg-gray-900 text-xs font-bold text-gray-500 border-b border-gray-800 uppercase font-['Share_Tech_Mono'] font-bold">
                    Live Standings
                </div>
                <Leaderboard 
                    simState={simState} 
                    onSelectCar={(id) => setSimState(prev => ({...prev, selectedCarId: id}))} 
                />
            </div>
            <div className="flex flex-col h-48 md:h-[40%]">
                <StrategyImpactPanel 
                    selectedCarId={simState.selectedCarId}
                    carData={carData}
                    currentLap={selectedCarState?.lap || 0}
                    currentTireLife={selectedCarState?.tireLife}
                    gapAhead={gapAhead}
                    gapBehind={gapBehind}
                />
            </div>
        </div>

        {/* Center: 3D View */}
        <div className="w-full md:flex-1 h-72 md:h-auto relative bg-black min-w-0 border-b md:border-b-0 border-gray-800">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 350, 250]} fov={45} />
                <OrbitControls 
                    enablePan={true} 
                    enableZoom={true} 
                    minDistance={20} 
                    maxDistance={600}
                    maxPolarAngle={Math.PI / 2.2}
                />
                <TrackView 
                    trackPoints={trackPoints} 
                    simState={simState} 
                    onSelectCar={(id) => setSimState(prev => ({...prev, selectedCarId: id}))}
                />
            </Canvas>
            
            {selectedCarState && (
                <div className="absolute top-4 right-4 bg-black/80 border border-gray-700 p-4 rounded shadow-lg backdrop-blur-sm pointer-events-none">
                    <div className="text-xs text-gray-500 uppercase font-['Share_Tech_Mono'] font-bold">Car #{simState.selectedCarId} Speed</div>
                    <div className="text-3xl font-bold text-white font-['Share_Tech_Mono']">
                        {selectedCarState.speed.toFixed(0)} <span className="text-sm text-gray-500 font-normal">KM/H</span>
                    </div>
                </div>
            )}
        </div>

        {/* Right: Data & Strategy */}
        <div className="w-full md:w-72 shrink-0 md:border-l border-gray-800 flex flex-col bg-gray-900/30 h-auto md:h-auto">
            <div className="h-64 md:h-1/4 border-b border-gray-800 flex flex-col min-h-[200px]">
                 <div className="p-2 bg-gray-900 text-xs font-bold text-gray-500 border-b border-gray-800 uppercase font-['Share_Tech_Mono'] font-bold">
                    Live Telemetry
                </div>
                <div className="flex-1 p-2">
                    {selectedCarState ? (
                        <GaugeCluster speed={selectedCarState.speed} />
                    ) : (
                         <div className="flex items-center justify-center h-full text-xs text-gray-600 font-['Inter']">Select Car</div>
                    )}
                </div>
            </div>

            <div className="h-64 md:h-1/3 border-b border-gray-800 flex flex-col min-h-[200px]">
                {selectedCarState ? (
                   <CarSchematic 
                        speed={selectedCarState.speed}
                        braking={selectedCarState.braking}
                        tireLife={selectedCarState.tireLife}
                   />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-gray-600 font-['Inter']">
                        Select Car for Diagnostics
                    </div>
                )}
            </div>

            <div className="h-auto md:flex-1 flex flex-col min-h-[200px]">
                <StrategyPanel 
                    selectedCarId={simState.selectedCarId} 
                    currentTireLife={selectedCarState?.tireLife}
                    gapAhead={gapAhead}
                    gapBehind={gapBehind}
                    onAction={(action) => console.log(`Car ${simState.selectedCarId} Strategy: ${action}`)}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
