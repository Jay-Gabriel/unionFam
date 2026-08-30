import { SanctuaryVariant } from './types';

interface PresetConfig {
  bgColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  lightIntensity: number;
  lightColor: string;
  particleCount: number;
  cameraZ: number;
}

export const scenePresets: Record<SanctuaryVariant, PresetConfig> = {
  'landing-dusk': {
    bgColor: '#3D4138', // forest-dusk
    fogColor: '#3D4138',
    fogNear: 5,
    fogFar: 30,
    lightIntensity: 1.5,
    lightColor: '#D9CB8F', // pollen
    particleCount: 48,
    cameraZ: 10,
  },
  'app-morning': {
    bgColor: '#263128', // deep-moss (Relaxing App Default)
    fogColor: '#263128',
    fogNear: 5,
    fogFar: 35,
    lightIntensity: 1.2,
    lightColor: '#B9C6A5',
    particleCount: 24,
    cameraZ: 12,
  },
  'conversation': {
    bgColor: '#3D4138',
    fogColor: '#3D4138',
    fogNear: 2,
    fogFar: 20,
    lightIntensity: 1.0,
    lightColor: '#EEF1EA',
    particleCount: 10,
    cameraZ: 14,
  },
  'questions': {
    bgColor: '#263128',
    fogColor: '#263128',
    fogNear: 8,
    fogFar: 25,
    lightIntensity: 1.5,
    lightColor: '#D9CB8F',
    particleCount: 16,
    cameraZ: 14,
  },
  'life-map': {
    bgColor: '#222A23', // ink (deepest for overview)
    fogColor: '#222A23',
    fogNear: 15,
    fogFar: 60,
    lightIntensity: 2.0,
    lightColor: '#B9C6A5',
    particleCount: 32,
    cameraZ: 22,
  }
};
