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

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  return <AdPlayer />;
};

export default DisplayPage;
