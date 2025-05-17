import React, { useEffect } from 'react';
import AdPlayer from '../components/display/AdPlayer';

const DisplayPage: React.FC = () => {
  useEffect(() => {
    // Function to request full screen
    const goFullScreen = () => {
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) { // Firefox
          (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) { // Chrome, Safari
          (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) { // IE/Edge
          (document.documentElement as any).msRequestFullscreen();
        }
        console.log('Entered fullscreen mode');
      } catch (error) {
        console.error('Failed to enter fullscreen mode:', error);
      }
    };

    // Request fullscreen on component mount
    goFullScreen();

    // Lock orientation to landscape if possible (works on some Android devices)
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(err => {
        console.error('Failed to lock orientation:', err);
      });
    }

    // Prevent Android navigation gestures
    const preventTouchMove = (e: TouchEvent) => {
      // Prevent edge swipes that trigger Android navigation
      if (
        e.touches[0].clientX < 20 || // Left edge
        e.touches[0].clientX > window.innerWidth - 20 || // Right edge
        e.touches[0].clientY < 20 || // Top edge
        e.touches[0].clientY > window.innerHeight - 20 // Bottom edge
      ) {
        e.preventDefault();
      }
    };

    // Prevent default touch behaviors that might trigger navigation
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) { // Multi-touch gestures
        e.preventDefault();
      }
    };

    // Prevent Android back button and other navigation
    const preventBackButton = () => {
      window.history.pushState(null, '', window.location.pathname);
    };

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Alt+Left (back), Alt+Right (forward), F5 (refresh), Ctrl+R (refresh)
      if (
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
        e.key === 'F5' ||
        (e.ctrlKey && e.key === 'r') ||
        e.key === 'Escape' || // Prevent Escape key
        e.key === 'Home' // Prevent Home key
      ) {
        e.preventDefault();
      }
    };

    // Set up all event listeners for kiosk mode
    document.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    window.addEventListener('popstate', preventBackButton);
    window.history.pushState(null, '', window.location.pathname);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    
    // Periodically ensure we're in fullscreen (in case user exits)
    const fullscreenInterval = setInterval(() => {
      if (!document.fullscreenElement) {
        goFullScreen();
      }
    }, 3000);

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('touchstart', preventDefaultTouch);
      document.removeEventListener('touchmove', preventTouchMove);
      window.removeEventListener('popstate', preventBackButton);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      clearInterval(fullscreenInterval);
      
      // Unlock orientation when component unmounts
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return <AdPlayer />;
};

export default DisplayPage;
