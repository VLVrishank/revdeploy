import React, { useEffect, useState } from 'react';
import AdPlayer from '../components/display/AdPlayer';

const DisplayPage: React.FC = () => {
  const [isKioskReady, setIsKioskReady] = useState(false);

  useEffect(() => {
    // Function to request full screen with all available options
    const goFullScreen = async () => {
      try {
        const elem = document.documentElement;
        
        // Try all possible fullscreen methods with all possible options
        if (elem.requestFullscreen) {
          await elem.requestFullscreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen({ navigationUI: 'hide' } as any);
        }
        
        // For Android Chrome, try to hide system UI
        if ('screen' in window && 'orientation' in screen) {
          try {
            // @ts-ignore - Android-specific API
            if (window.AndroidInterface && window.AndroidInterface.enterImmersiveMode) {
              // Call Android WebView interface if available
              window.AndroidInterface.enterImmersiveMode();
            }
          } catch (e) {
            console.log('Android interface not available', e);
          }
        }
        
        console.log('Entered fullscreen mode');
        setIsKioskReady(true);
      } catch (error) {
        console.error('Failed to enter fullscreen mode:', error);
      }
    };

    // Lock orientation to landscape
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(err => {
        console.error('Failed to lock orientation:', err);
      });
    }

    // Prevent ALL touch events to block notification bar pull-down
    const blockAllTouchEvents = (e: TouchEvent) => {
      // Block ALL touch events at the edges of the screen
      const touchX = e.touches[0]?.clientX || 0;
      const touchY = e.touches[0]?.clientY || 0;
      
      // Block top edge completely to prevent notification bar
      if (touchY < 50) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block edge gestures that trigger Android navigation
      if (
        touchX < 50 || // Left edge
        touchX > window.innerWidth - 50 || // Right edge
        touchY > window.innerHeight - 50 // Bottom edge
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block multi-touch gestures
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent all default behaviors that might exit kiosk mode
    const preventDefaultBehaviors = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent Android back button
    const preventBackButton = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Block ALL keyboard shortcuts
    const blockAllKeyboardShortcuts = (e: KeyboardEvent) => {
      // Block ALL keyboard shortcuts
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent selection
    const preventSelection = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Prevent scroll events
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Request fullscreen immediately and on any user interaction
    const setupKioskMode = () => {
      goFullScreen();
      
      // Remove the event listener after first interaction
      document.removeEventListener('click', setupKioskMode);
      document.removeEventListener('touchstart', setupKioskMode);
    };

    // Set up event listeners for initial kiosk setup
    document.addEventListener('click', setupKioskMode);
    document.addEventListener('touchstart', setupKioskMode);
    
    // Initial setup
    setupKioskMode();

    // Set up aggressive event capturing for all possible navigation events
    document.addEventListener('touchstart', blockAllTouchEvents, { capture: true, passive: false });
    document.addEventListener('touchmove', blockAllTouchEvents, { capture: true, passive: false });
    document.addEventListener('touchend', blockAllTouchEvents, { capture: true, passive: false });
    
    // Prevent browser navigation
    window.addEventListener('popstate', preventBackButton, { capture: true });
    window.history.pushState(null, '', window.location.href);
    
    // Block all keyboard shortcuts
    document.addEventListener('keydown', blockAllKeyboardShortcuts, { capture: true });
    document.addEventListener('keyup', blockAllKeyboardShortcuts, { capture: true });
    
    // Prevent context menu and selection
    document.addEventListener('contextmenu', preventContextMenu, { capture: true });
    document.addEventListener('selectstart', preventSelection, { capture: true });
    
    // Prevent browser gestures
    document.addEventListener('gesturestart', preventDefaultBehaviors, { capture: true, passive: false });
    document.addEventListener('gesturechange', preventDefaultBehaviors, { capture: true, passive: false });
    document.addEventListener('gestureend', preventDefaultBehaviors, { capture: true, passive: false });
    
    // Prevent scrolling
    document.addEventListener('scroll', preventScroll, { capture: true, passive: false });
    document.addEventListener('wheel', preventScroll, { capture: true, passive: false });

    // Ensure we stay in fullscreen and prevent navigation
    const kioskInterval = setInterval(() => {
      // Check if we're still in fullscreen
      if (!document.fullscreenElement) {
        goFullScreen();
      }
      
      // Keep pushing history state to prevent back button
      window.history.pushState(null, '', window.location.href);
      
      // Try to hide Android system UI again
      try {
        // @ts-ignore - Android-specific API
        if (window.AndroidInterface && window.AndroidInterface.enterImmersiveMode) {
          window.AndroidInterface.enterImmersiveMode();
        }
      } catch (e) {
        // Ignore errors
      }
    }, 500); // Check more frequently

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('click', setupKioskMode);
      document.removeEventListener('touchstart', setupKioskMode);
      document.removeEventListener('touchstart', blockAllTouchEvents, { capture: true });
      document.removeEventListener('touchmove', blockAllTouchEvents, { capture: true });
      document.removeEventListener('touchend', blockAllTouchEvents, { capture: true });
      window.removeEventListener('popstate', preventBackButton, { capture: true });
      document.removeEventListener('keydown', blockAllKeyboardShortcuts, { capture: true });
      document.removeEventListener('keyup', blockAllKeyboardShortcuts, { capture: true });
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
      document.removeEventListener('selectstart', preventSelection, { capture: true });
      document.removeEventListener('gesturestart', preventDefaultBehaviors, { capture: true });
      document.removeEventListener('gesturechange', preventDefaultBehaviors, { capture: true });
      document.removeEventListener('gestureend', preventDefaultBehaviors, { capture: true });
      document.removeEventListener('scroll', preventScroll, { capture: true });
      document.removeEventListener('wheel', preventScroll, { capture: true });
      clearInterval(kioskInterval);
      
      // Unlock orientation when component unmounts
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, []);

  // Add CSS to prevent pull-down and other gestures
  return (
    <>
      <style jsx global>{`
        /* Prevent pull-down refresh and other gestures */
        html, body {
          overscroll-behavior: none;
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-overflow-scrolling: none;
        }
        
        /* Hide scrollbars */
        ::-webkit-scrollbar {
          display: none;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
      <AdPlayer />
    </>
  );
};

export default DisplayPage;
