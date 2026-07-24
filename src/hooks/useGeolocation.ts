import { useState, useCallback } from 'react';

interface GPSState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GPSState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  const getLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by your device.';
        setState((s) => ({ ...s, error: err }));
        reject(new Error(err));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({ lat: latitude, lng: longitude, loading: false, error: null });
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => {
          let message = 'Unable to get your location.';
          if (err.code === err.PERMISSION_DENIED) {
            message = 'Location permission denied. Please enable location access to place your order.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            message = 'Location information is unavailable. Please try again.';
          } else if (err.code === err.TIMEOUT) {
            message = 'Location request timed out. Please try again.';
          }
          setState({ lat: null, lng: null, loading: false, error: message });
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  const reset = useCallback(() => {
    setState({ lat: null, lng: null, loading: false, error: null });
  }, []);

  return { ...state, getLocation, reset };
}
