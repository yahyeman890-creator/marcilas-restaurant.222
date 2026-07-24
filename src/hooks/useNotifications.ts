import { useEffect, useRef, useCallback } from 'react';

// ─── Notification sound (generated inline as a short beep via Web Audio API) ──

function createBeep(frequency = 880, durationMs = 180, volume = 0.4): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
    // close after the beep to avoid "too many AudioContext" warnings
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio not available – silent fallback
  }
}

function playNewOrderSound() {
  // Two ascending beeps
  createBeep(700, 150, 0.4);
  setTimeout(() => createBeep(1000, 200, 0.5), 170);
}

function playReadySound() {
  // Three fast beeps
  createBeep(900, 120, 0.4);
  setTimeout(() => createBeep(900, 120, 0.4), 140);
  setTimeout(() => createBeep(1200, 180, 0.5), 280);
}

function playDeliveredSound() {
  createBeep(600, 150, 0.3);
  setTimeout(() => createBeep(800, 150, 0.3), 170);
  setTimeout(() => createBeep(1100, 250, 0.5), 340);
}

// ─── Browser notification helper ─────────────────────────────────────────────

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showBrowserNotification(title: string, body: string, icon = '/vite.svg') {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon, silent: true });
  } catch {
    // Some browsers (Safari) require user gesture for first notification
  }
}

// ─── Deduplication ───────────────────────────────────────────────────────────

const notified = new Set<string>();

function dedup(key: string): boolean {
  if (notified.has(key)) return false;
  notified.add(key);
  // Auto-expire after 60 s so a real re-trigger works
  setTimeout(() => notified.delete(key), 60_000);
  return true;
}

// ─── Public hook ─────────────────────────────────────────────────────────────

export interface NotificationHandlers {
  notifyNewOrder: (orderId: string, customerName: string) => void;
  notifyOrderReady: (orderId: string, customerName: string) => void;
  notifyDriverAssigned: (orderId: string, driverName: string) => void;
  notifyDelivered: (orderId: string) => void;
}

export function useNotifications(): NotificationHandlers {
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (!permissionRequested.current) {
      permissionRequested.current = true;
      requestPermission();
    }
  }, []);

  const notifyNewOrder = useCallback((orderId: string, customerName: string) => {
    if (!dedup(`new-${orderId}`)) return;
    playNewOrderSound();
    showBrowserNotification('New Order Received', `${customerName} placed a new order`);
  }, []);

  const notifyOrderReady = useCallback((orderId: string, customerName: string) => {
    if (!dedup(`ready-${orderId}`)) return;
    playReadySound();
    showBrowserNotification('Order Ready for Delivery', `${customerName}'s order is ready for pickup`);
  }, []);

  const notifyDriverAssigned = useCallback((orderId: string, driverName: string) => {
    if (!dedup(`driver-${orderId}`)) return;
    playReadySound();
    showBrowserNotification('Driver Assigned', `${driverName} is delivering your order`);
  }, []);

  const notifyDelivered = useCallback((orderId: string) => {
    if (!dedup(`delivered-${orderId}`)) return;
    playDeliveredSound();
    showBrowserNotification('Order Delivered!', 'Your order has been delivered. Enjoy your meal!');
  }, []);

  return { notifyNewOrder, notifyOrderReady, notifyDriverAssigned, notifyDelivered };
}
