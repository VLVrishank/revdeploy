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

    // Also add a button click handler for iOS which requires user interaction
    const handleUserInteraction = () => {
      goFullScreen();
      // Remove the event listener after first interaction
      document.removeEventListener('click', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);

    // Implement kiosk mode by preventing navigation
    const preventNavigation = (event: BeforeUnloadEvent) => {
      // Show a confirmation dialog when user tries to navigate away
      event.preventDefault();
      // Chrome requires returnValue to be set
      event.returnValue = '';
      return '';
    };

    // Prevent back button navigation
    const preventBackButton = (event: PopStateEvent) => {
      // Push another state to prevent going back
      window.history.pushState(null, '', window.location.pathname);
      event.preventDefault();
    };

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (event: KeyboardEvent) => {
      // Prevent Alt+Left (back), Alt+Right (forward), F5 (refresh), Ctrl+R (refresh)
      if (
        (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
        event.key === 'F5' ||
        (event.ctrlKey && event.key === 'r')
      ) {
        event.preventDefault();
      }
    };

    // Set up all event listeners for kiosk mode
    window.addEventListener('beforeunload', preventNavigation);
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', preventBackButton);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('beforeunload', preventNavigation);
      window.removeEventListener('popstate', preventBackButton);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);

  return <AdPlayer />;
};

export default DisplayPage;
