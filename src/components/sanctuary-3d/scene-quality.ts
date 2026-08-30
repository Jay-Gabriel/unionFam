export type SceneQuality = 'static' | 'low' | 'high';

type NavigatorWithDeviceMemory = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

export function getDeviceQualityPolicy(): SceneQuality {
  if (typeof window === 'undefined') {
    return 'static'; // Server side default
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return 'static';
  }

  const device = navigator as NavigatorWithDeviceMemory;

  if (device.connection?.saveData) {
    return 'static';
  }

  const hasLimitedCpu = (device.hardwareConcurrency || 8) <= 4;
  const hasLimitedMemory = typeof device.deviceMemory === 'number' && device.deviceMemory <= 4;
  const isCompactScreen = window.innerWidth < 1024;

  // Keep mobile/tablet on the poster path. The sanctuary is decorative and
  // must never compete with the app's interaction budget or battery.
  if (isCompactScreen) return 'static';
  if (hasLimitedCpu || hasLimitedMemory) return 'low';
  return 'high';
}
