import { useEffect, useState } from 'react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate minimum loading time for smooth UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="preloader">
      <img 
        src="/images/TRIPGEN_logo_white.png" 
        alt="TRIPGEN Logo" 
        className="preloader-logo"
      />
      <p className="preloader-text">Ваше путешествие начинается здесь</p>
      <div className="preloader-loader" />
    </div>
  );
}
