import React, { useEffect } from 'react';
import AdPlayer from '../components/display/AdPlayer';

const DisplayPage: React.FC = () => {
  useEffect(() => {
    // Function to request full screen with all available options
    const goFullScreen = () => {
      try {
        const elem = document.documentElement;
        
        // Try all possible fullscreen methods with all possible options
        if (elem.requestFullscreen) {
          elem.requestFullscreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).mozRequestFullScreen) {
          (elem as any).mozRequestFullScreen({ navigationUI: 'hide' } as any);
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen({ navigationUI: 'hide' } as any);
        }
        
        console.log('Entered fullscreen mode');
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

    // Prevent all touch events that could trigger navigation
    const preventAllTouchEvents = (e: TouchEvent) => {
      // Check if this is a navigation gesture (edge swipe)
      const isEdgeSwipe = 
        e.touches[0].clientX < 30 || // Left edge
        e.touches[0].clientX > window.innerWidth - 30 || // Right edge
        e.touches[0].clientY < 30 || // Top edge
        e.touches[0].clientY > window.innerHeight - 30; // Bottom edge
      
      // If it's an edge swipe or multi-touch, prevent default
      if (isEdgeSwipe || e.touches.length > 1) {
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
      history.pushState(null, '', window.location.href);
    };

    // Block all keyboard shortcuts
    const blockAllKeyboardShortcuts = (e: KeyboardEvent) => {
      // Block ALL keyboard shortcuts that could exit the app
      if (
        e.key === 'Escape' || 
        e.key === 'F11' || 
        e.key === 'F5' || 
        e.key === 'Home' ||
        e.key === 'Tab' ||
        (e.ctrlKey && (e.key === 'r' || e.key === 'w' || e.key === 't')) ||
        (e.altKey && (e.key === 'Left' || e.key === 'Right' || e.key === 'F4')) ||
        e.key === 'BrowserHome' ||
        e.key === 'BrowserBack'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
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

    // Request fullscreen immediately
    goFullScreen();

    // Set up aggressive event capturing for all possible navigation events
    document.addEventListener('touchstart', preventAllTouchEvents, { capture: true, passive: false });
    document.addEventListener('touchmove', preventAllTouchEvents, { capture: true, passive: false });
    document.addEventListener('touchend', preventAllTouchEvents, { capture: true, passive: false });
    
    // Prevent browser navigation
    window.addEventListener('popstate', preventBackButton, { capture: true });
    history.pushState(null, '', window.location.href);
    
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

    // Ensure we stay in fullscreen
    const fullscreenInterval = setInterval(() => {
      if (!document.fullscreenElement) {
        goFullScreen();
      }
      
      // Keep pushing history state to prevent back button
      history.pushState(null, '', window.location.href);
    }, 1000);

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('touchstart', preventAllTouchEvents, { capture: true });
      document.removeEventListener('touchmove', preventAllTouchEvents, { capture: true });
      document.removeEventListener('touchend', preventAllTouchEvents, { capture: true });
      window.removeEventListener('popstate', preventBackButton, { capture: true });
      document.removeEventListener('keydown', blockAllKeyboardShortcuts, { capture: true });
      document.removeEventListener('keyup', blockAllKeyboardShortcuts, { capture: true });
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
      document.removeEventListener('selectstart', preventSelection, { capture: true });
      document.removeEventListener('gesturestart', preventDefaultBehaviors, { capture: true });
      document.removeEventListener('gesturechange', preventDefaultBehaviors, { capture: true });
      document.removeEventListener('gestureend', preventDefaultBehaviors, { capture: true });
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
