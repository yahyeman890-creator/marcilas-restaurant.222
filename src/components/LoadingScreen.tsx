import { useEffect, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

/**
 * Full-screen loading screen shown on first paint, dismissed once the app
 * signals it is ready (via the `__appReady` window flag set in main.tsx) or
 * after a short safety timeout.
 */
export function LoadingScreen() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setHidden(true);
    };

    // The app sets this flag once React has mounted.
    (window as any).__appReady = finish;

    // Safety timeout in case the flag is never set.
    const t = setTimeout(finish, 2500);
    return () => clearTimeout(t);
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-500"
      style={{ opacity: hidden ? 0 : 1 }}
      aria-hidden={hidden}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full border-2 border-brand-600/30 border-t-brand-500 animate-spin" />
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center animate-pulse">
          <UtensilsCrossed className="text-white" size={24} />
        </div>
      </div>
      <p className="mt-6 font-display font-bold text-lg text-white tracking-wide">Marcilas</p>
      <p className="mt-1 text-xs text-gray-400">Dire Dawa</p>
    </div>
  );
}
