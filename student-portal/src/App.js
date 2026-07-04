import React, { useState, useEffect } from 'react';
import './index.css';
import CBTSimulator from './CBTSimulator';

function App() {
  // --- Installation Gate State ---
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
  );
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  // --- Installation Logic ---
  useEffect(() => {
    if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) setIsIOS(true);
    
    const handleInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleInstall);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsStandalone(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstall);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  // --- 1. The Bouncer (Installation Gate) ---
  if (!isStandalone) {
    return (
      <div className="glass-container" style={{ justifyContent: 'center' }}>
        <div className="glass-card">
          <h2>App Installation Required</h2>
          <p style={{textAlign: 'center'}}>Please install EduSmart to access the portal.</p>
          {deferredPrompt && (
            <button className="glass-btn" onClick={handleInstallClick} style={{ background: '#007bff' }}>
              Install App
            </button>
          )}
          {isIOS && <p style={{ marginTop: '20px', textAlign: 'center' }}>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.</p>}
        </div>
      </div>
    );
  }

  // --- 2. Direct CBT Simulator Launch ---
  // If they are in the native app, immediately load the test.
  // The 'onClose' prop just reloads the app back to the instructions page.
  return <CBTSimulator onClose={() => window.location.reload()} />;
}

export default App;