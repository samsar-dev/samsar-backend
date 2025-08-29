// Vehicle Data Index - Centralized import for all vehicle types
import { CARS_DATA } from './cars.data.js';
import { MOTORCYCLES_DATA } from './motorcycles.data.js';
import { PASSENGER_VEHICLES_DATA } from './passenger.data.js';
import { COMMERCIAL_TRANSPORT_DATA } from './commercial.data.js';
import { CONSTRUCTION_VEHICLES_DATA } from './construction.data.js';

export interface VehicleData {
  makes: string[];
  models: Record<string, string[]>;
}

export interface VehicleDataMap {
  [key: string]: VehicleData;
}

// Centralized vehicle data for Syrian market
export const VEHICLE_DATA: VehicleDataMap = {
  CARS: CARS_DATA,
  MOTORCYCLES: MOTORCYCLES_DATA,
  PASSENGER_VEHICLES: PASSENGER_VEHICLES_DATA,
  COMMERCIAL_TRANSPORT: COMMERCIAL_TRANSPORT_DATA,
  CONSTRUCTION_VEHICLES: CONSTRUCTION_VEHICLES_DATA,
};

// Helper functions for vehicle data access
export const getVehicleMakes = (subcategory: string): string[] => {
  console.log("🔍 getVehicleMakes called with:", subcategory);
  const normalizedSubcategory = subcategory.toUpperCase();
  console.log("🔄 Normalized subcategory:", normalizedSubcategory);
  console.log("📊 Available vehicle data keys:", Object.keys(VEHICLE_DATA));
  
  const data = VEHICLE_DATA[normalizedSubcategory];
  console.log("📋 Data found for subcategory:", !!data);
  
  if (data) {
    console.log("✅ Makes count:", data.makes?.length || 0);
    console.log("🚗 First few makes:", data.makes?.slice(0, 5));
  }
  
  return data?.makes || [];
};

export const getVehicleModels = (subcategory: string, make: string): string[] => {
  const normalizedSubcategory = subcategory.toUpperCase();
  return VEHICLE_DATA[normalizedSubcategory]?.models[make] || [];
};

export const getAllVehicleData = (subcategory: string): VehicleData | null => {
  const normalizedSubcategory = subcategory.toUpperCase();
  return VEHICLE_DATA[normalizedSubcategory] || null;
};

export const isValidSubcategory = (subcategory: string): boolean => {
  const normalizedSubcategory = subcategory.toUpperCase();
  return Object.keys(VEHICLE_DATA).includes(normalizedSubcategory);
};

export const isValidMake = (subcategory: string, make: string): boolean => {
  const makes = getVehicleMakes(subcategory);
  return makes.includes(make);
};

export const getSubcategories = (): string[] => {
  return Object.keys(VEHICLE_DATA);
};

// Statistics helpers
export const getVehicleStats = () => {
  const stats: Record<string, { totalMakes: number; totalModels: number }> = {};
  
  Object.entries(VEHICLE_DATA).forEach(([subcategory, data]) => {
    const totalModels = Object.values(data.models).flat().length;
    stats[subcategory] = {
      totalMakes: data.makes.length,
      totalModels,
    };
  });
  
  return stats;
};
