import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook for managing background trajectory tracking
 */
export function useGeolocationTracker() {
  const addPoint = useAppStore((state) => state.addTrajectoryPoint);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        addPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => console.error('Tracking Error:', err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [addPoint]);

  return { startTracking };
}
