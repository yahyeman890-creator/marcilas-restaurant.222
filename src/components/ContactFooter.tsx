import { MapPin, Phone } from 'lucide-react';

function TikTokIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.02v12.18a2.91 2.91 0 0 1-2.91 2.73 2.91 2.91 0 0 1-2.91-2.91 2.91 2.91 0 0 1 2.91-2.91c.3 0 .59.04.86.12V8.32a5.99 5.99 0 0 0-.86-.06A5.92 5.92 0 0 0 3 14.18a5.92 5.92 0 0 0 5.92 5.92 5.92 5.92 0 0 0 5.92-5.92V8.86a7.82 7.82 0 0 0 4.57 1.46V7.3a4.83 4.83 0 0 1-.82-.61z" />
    </svg>
  );
}

function TelegramIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.18c-.25.25-.46.46-.94.46l.33-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.44 13.2l-4.64-1.45c-1.01-.32-1.03-1.01.21-1.5l18.13-6.99c.84-.31 1.57.2 1.4 1.34z" />
    </svg>
  );
}

export function ContactFooter() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl">Contact Us</h2>
          <p className="text-gray-400 text-sm mt-2">
            We'd love to hear from you — reach out anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Location */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center mb-4">
              <MapPin size={22} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">Location</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dire Dawa, Sabian,<br />on Brighton Mall
            </p>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center mb-4">
              <Phone size={22} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-base mb-2">Call Us</h3>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+251942922353"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Phone size={15} /> +251 942 922 353
              </a>
              <a
                href="tel:+251913784322"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <Phone size={15} /> +251 913 784 322
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-brand-400" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-base mb-3">Follow Us</h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.tiktok.com/@marsilas.restaurant"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white transition hover:bg-brand-600 hover:scale-110"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
              <a
                href="https://t.me/Kidusmichael1995"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white transition hover:bg-brand-600 hover:scale-110"
              >
                <TelegramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-center">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Marcilas Restaurant · Dire Dawa
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <span className="text-gray-500 text-xs tracking-wide">Designed &amp; Developed by</span>
            <span className="hidden sm:inline text-gray-700">·</span>
            <a
              href="tel:+251973680108"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-brand-400"
            >
              <Phone size={13} /> +251973680108
            </a>
            <span className="hidden sm:inline text-gray-700">·</span>
            <a
              href="https://t.me/Xo_silver"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition hover:text-brand-400"
            >
              <TelegramIcon className="w-3.5 h-3.5" /> @Xo_silver
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
