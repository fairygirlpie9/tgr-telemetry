import * as THREE from 'three';
import { CarData, WeatherData, TrackPoint } from './types';

// Helper to parse time string "1:54.168" to seconds
export const parseTimeStr = (str: string): number => {
  if (!str) return 0;
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str);
};

// Parse CSV Data
export const parseCarCsv = (csv: string): CarData[] => {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const data: CarData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < 10) continue;
    data.push({
      number: row[0],
      driverNumber: row[1],
      lapNumber: parseInt(row[2]),
      lapTimeStr: row[3],
      s1: parseTimeStr(row[4]),
      s2: parseTimeStr(row[5]),
      s3: parseTimeStr(row[6]),
      speed: parseFloat(row[7]),
      elapsed: row[8],
      manufacturer: row[15] || 'Toyota',
      class: row[14] || 'Am'
    });
  }
  return data;
};

export const parseWeatherCsv = (csv: string): WeatherData[] => {
  const lines = csv.trim().split('\n');
  const data: WeatherData[] = [];
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');
    if (row.length < 5) continue;
    data.push({
      time: parseInt(row[0]),
      airTemp: parseFloat(row[2]),
      trackTemp: parseFloat(row[3]),
      humidity: parseFloat(row[4]),
      windSpeed: parseFloat(row[6]),
      windDirection: parseInt(row[7])
    });
  }
  return data;
};

export const parseTrackData = (text: string): TrackPoint[] => {
  const lines = text.trim().split('\n');
  const points: TrackPoint[] = [];
  
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts[0] === 'T') {
      const lat = parseFloat(parts[1]);
      const lon = parseFloat(parts[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, x: 0, z: 0 });
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      }
    }
  }

  // Normalize to 3D space centered at 0,0
  // We scale up by a factor to make it usable in Three.js
  const SCALE = 200; 
  return points.map(p => ({
    ...p,
    z: (p.lat - (minLat + maxLat) / 2) / (maxLat - minLat) * SCALE * -1, // Invert lat for Z
    x: (p.lon - (minLon + maxLon) / 2) / (maxLon - minLon) * SCALE 
  }));
};

// Create a CurvePath for the car to follow
export const createTrackCurve = (points: TrackPoint[]): THREE.CatmullRomCurve3 => {
  const vectors = points.map(p => new THREE.Vector3(p.x, 0, p.z));
  return new THREE.CatmullRomCurve3(vectors, true); // Closed loop
};
