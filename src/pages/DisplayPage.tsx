import React, { useEffect } from 'react';
import AdPlayer from '../components/display/AdPlayer';

const DisplayPage: React.FC = () => {
  useEffect(() => {
    // Function to request full screen
    const goFullScreen = () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen();
        }
        console.log('Entered fullscreen mode');
      } catch (error) {
        console.error('Failed to enter fullscreen mode:', error);
      }
    };

    // Request fullscreen on component mount
    goFullScreen();

    // Try to lock orientation to landscape
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(err => {
        console.error('Failed to lock orientation:', err);
      });
    }

    // Aggressive approach to prevent navigation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        goFullScreen();
      }
    };

    // Prevent all touch events at screen edges
    const preventTouchMove = (e: TouchEvent) => {
      const buffer = 40; // Larger buffer zone
      if (
        e.touches[0].clientX < buffer || 
        e.touches[0].clientX > window.innerWidth - buffer || 
        e.touches[0].clientY < buffer || 
        e.touches[0].clientY > window.innerHeight - buffer
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Block all multi-touch gestures
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Aggressively prevent back button
    const preventBackButton = () => {
      history.pushState(null, '', window.location.href);
    };

    // Block ALL keyboard shortcuts
    const blockAllKeyboardShortcuts = (e: KeyboardEvent) => {
      // Allow only Tab key for accessibility
      if (e.key !== 'Tab') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Prevent context menu (right-click)
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent selection
    const preventSelection = (e: Event) => {
      e.preventDefault();
    };

    // Prevent drag events
    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    // Set up all event listeners with capture phase to intercept early
    document.addEventListener('touchstart', preventMultiTouch, { passive: false, capture: true });
    document.addEventListener('touchmove', preventTouchMove, { passive: false, capture: true });
    document.addEventListener('keydown', blockAllKeyboardShortcuts, { capture: true });
    document.addEventListener('contextmenu', preventContextMenu, { capture: true });
    document.addEventListener('selectstart', preventSelection, { capture: true });
    document.addEventListener('dragstart', preventDrag as EventListener, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { capture: true });
    
    // Aggressively push state to prevent back navigation
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBackButton);
    
    // Force fullscreen every second (more aggressive)
    const fullscreenInterval = setInterval(goFullScreen, 1000);
    
    // Also check if we're still in the app
    const focusInterval = setInterval(() => {
      window.focus();
    }, 500);

    // Disable pull-to-refresh
    document.body.style.overscrollBehavior = 'none';
    
    // Disable all browser features that could navigate away
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registered');
      }).catch(err => {
        console.log('ServiceWorker registration failed', err);
      });
    }

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('touchstart', preventMultiTouch, { capture: true });
      document.removeEventListener('touchmove', preventTouchMove, { capture: true });
      document.removeEventListener('keydown', blockAllKeyboardShortcuts, { capture: true });
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
      document.removeEventListener('selectstart', preventSelection, { capture: true });
      document.removeEventListener('dragstart', preventDrag as EventListener, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange, { capture: true });
      window.removeEventListener('popstate', preventBackButton);
      clearInterval(fullscreenInterval);
      clearInterval(focusInterval);
      
      // Reset styles
      document.body.style.overscrollBehavior = '';
      
      // Unlock orientation
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  return <AdPlayer />;
};

export default DisplayPage;
