

export interface CarData {
  number: string;
  driverNumber: string;
  lapNumber: number;
  lapTimeStr: string;
  s1: number;
  s2: number;
  s3: number;
  speed: number;
  manufacturer: string;
  class: string;
  elapsed: string; // Time elapsed in race
}

export interface WeatherData {
  time: number; // UTC seconds
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
}

export interface TrackPoint {
  lat: number;
  lon: number;
  x: number; // Normalized 3D coordinate
  z: number; // Normalized 3D coordinate
}

export enum StrategyAction {
  PIT = 'PIT STOP',
  PUSH = 'PUSH',
  CONSERVE = 'CONSERVE',
  HOLD = 'HOLD GAP',
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND'
}

export interface CarStatus {
  position: number; // 0 to 1 along track spline
  lap: number;
  speed: number;
  braking: boolean;
  lastLapTime: string;
  gapToLeader: number;
  tireLife: number;
  strategy: StrategyAction;
  finished: boolean;
}

export interface SimulationState {
  currentTime: number;
  isPlaying: boolean;
  selectedCarId: string | null;
  cars: {
    [id: string]: CarStatus;
  };
}
