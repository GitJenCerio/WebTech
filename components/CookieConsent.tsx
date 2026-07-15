import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie-consent');
      setVisible(!consent);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#111] text-white px-6 py-4 border border-[#111] flex flex-col items-center gap-2 max-w-xs w-full shadow-lg">
      <span className="text-sm text-center tracking-wide">This website uses cookies to enhance your experience. See our <a href="/cookies-policy" className="underline hover:text-[#d4d4d8]">Cookies Policy</a>.</span>
      <button onClick={accept} className="mt-2 px-4 py-2 bg-white text-[#111] text-sm font-medium border border-white hover:bg-transparent hover:text-white transition-colors">Accept</button>
    </div>
  );
}

