import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { PingService } from '../../services/PingService';

interface PingHandlerProps {
  rickshawId: string;
}

const PingHandler: React.FC<PingHandlerProps> = ({ rickshawId }) => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const forceRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start checking for pings when component mounts
    startPingCheck();
    
    // Start checking for force refresh signals
    startForceRefreshCheck();

    // Clean up when component unmounts
    return () => {
      stopPingCheck();
      stopForceRefreshCheck();
    };
  }, [rickshawId]);

  const startPingCheck = () => {
    // Check for pings every 10 seconds
    checkIntervalRef.current = setInterval(checkForPings, 10000);
    // Also check immediately
    checkForPings();
  };

  const stopPingCheck = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  };
  
  const startForceRefreshCheck = () => {
    // Check for force refresh signal every 5 seconds
    forceRefreshIntervalRef.current = setInterval(checkForceRefresh, 5000);
    // Also check immediately
    checkForceRefresh();
  };
  
  const stopForceRefreshCheck = () => {
    if (forceRefreshIntervalRef.current) {
      clearInterval(forceRefreshIntervalRef.current);
      forceRefreshIntervalRef.current = null;
    }
  };
  
  const checkForceRefresh = async () => {
    try {
      const { data, error } = await supabase
        .from('rickshaw_devices')
        .select('force_refresh, force_refresh_timestamp')
        .eq('id', rickshawId)
        .single();

      if (error) {
        console.error('Error checking force refresh:', error);
        return;
      }
      
      // Only refresh if force_refresh is true AND we have a timestamp
      // This prevents constant refreshing if the flag is stuck on true
      if (data?.force_refresh && data?.force_refresh_timestamp) {
        // Check if the timestamp is recent (within the last 30 seconds)
        const refreshTime = new Date(data.force_refresh_timestamp);
        const currentTime = new Date();
        const timeDiff = (currentTime.getTime() - refreshTime.getTime()) / 1000; // in seconds
        
        if (timeDiff < 30) {
          console.log('Force refresh signal received, reloading page...');
          
          // Reset the flag before reloading to prevent refresh loops
          await supabase
            .from('rickshaw_devices')
            .update({ force_refresh: false })
            .eq('id', rickshawId);
            
          window.location.reload();
        } else {
          console.log('Ignoring stale force refresh signal');
          
          // Reset stale force refresh flag
          await supabase
            .from('rickshaw_devices')
            .update({ force_refresh: false })
            .eq('id', rickshawId);
        }
      }
    } catch (error) {
      console.error('Error checking force refresh:', error);
    }
  };

  const checkForPings = async () => {
    if (!rickshawId) return;

    try {
      console.log(`Checking for pings for device: ${rickshawId}`);
      const pendingPing = await PingService.checkPendingPings(rickshawId);
      
      if (pendingPing) {
        console.log('Received ping request:', pendingPing);
        await handlePingRequest(pendingPing.id);
      }
    } catch (error) {
      console.error('Error checking for pings:', error);
    }
  };

  const handlePingRequest = async (pingId: string) => {
    try {
      // Get location
      let location = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (geoError) {
        console.log('Geolocation error:', geoError);
        // Continue without location
      }
      
      // Get battery level
      let batteryLevel = 100; // Default value
      try {
        // @ts-ignore - Battery API may not be typed
        const battery = await navigator.getBattery();
        batteryLevel = Math.round(battery.level * 100);
      } catch (batteryError) {
        console.log('Battery API error:', batteryError);
        // Continue with default battery level
      }
      
      // Respond to ping (without selfie)
      await PingService.respondToPing(pingId, {
        location: location || undefined,
        is_active: true,
        battery_level: batteryLevel
      });
      
      console.log('Successfully responded to ping');
    } catch (error) {
      console.error('Error handling ping request:', error);
    }
  };

  // No need for video element anymore
  return null;
};

export default PingHandler;