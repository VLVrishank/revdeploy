import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Battery, Loader, RefreshCw, RotateCw } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { PingService } from '../../services/PingService';

interface RickshawDevice {
  id: string;
  name: string;
  phone_number?: string;
  last_active?: string;
}

interface PingResult {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  is_active: boolean;
  battery_level: number;
  completed_at?: string;
}

const PingController: React.FC = () => {
  const [devices, setDevices] = useState<RickshawDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingResult, setPingResult] = useState<PingResult | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      
      // First, check if we can connect to Supabase at all
      console.log('Attempting to connect to Supabase...');
      
      // Check if the table exists by querying its structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('rickshaw_devices')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('Table check error:', tableError);
        // If the table doesn't exist, create it
        if (tableError.code === '42P01') { // PostgreSQL code for undefined_table
          console.log('Table does not exist, creating it...');
          await createDevicesTable();
          await addSampleDevice();
        } else {
          throw tableError;
        }
      }
      
      // Now try to fetch the devices
      const { data, error } = await supabase
        .from('rickshaw_devices')
        .select('id, name, phone_number, last_active')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched devices:', data);
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createDevicesTable = async () => {
    try {
      // We can't create tables directly with the Supabase JS client
      // This is just a placeholder - you would need to create the table in the Supabase dashboard
      console.log('Please create the rickshaw_devices table in your Supabase dashboard');
      toast.error('The rickshaw_devices table does not exist. Please create it in your Supabase dashboard.');
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };
  
  const addSampleDevice = async () => {
    try {
      const { error } = await supabase
        .from('rickshaw_devices')
        .insert([
          { 
            id: 'sample-device-1',
            name: 'Sample Rickshaw 1',
            phone_number: '+1234567890',
            pin: '1234',
            last_active: new Date().toISOString()
          }
        ]);
        
      if (error) throw error;
      console.log('Added sample device');
    } catch (error) {
      console.error('Error adding sample device:', error);
    }
  };

  const handlePing = async () => {
    if (!selectedDevice) {
      toast.error('Please select a device to ping');
      return;
    }

    try {
      setIsPinging(true);
      setPingResult(null);
      
      console.log(`Pinging device: ${selectedDevice}`);
      
      // Send ping request
      const pingId = await PingService.pingRickshaw(selectedDevice);
      console.log(`Ping sent with ID: ${pingId}`);
      toast.success('Ping sent successfully');
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 15; // 30 seconds with 2-second intervals
      
      const checkInterval = setInterval(async () => {
        attempts++;
        console.log(`Checking ping result (attempt ${attempts}/${maxAttempts})...`);
        
        const result = await PingService.getPingResult(pingId);
        console.log('Ping result:', result);
        
        if (result && (result.status === 'completed' || result.status === 'failed')) {
          clearInterval(checkInterval);
          
          if (result.status === 'completed') {
            setPingResult({
              id: result.id,
              status: result.status,
              location: result.location,
              is_active: result.is_active || false,
              battery_level: result.battery_level || 0,
              completed_at: result.completed_at
            });
            toast.success('Ping completed successfully');
          } else {
            toast.error('Ping failed: ' + (result.error_message || 'Unknown error'));
          }
          
          setIsPinging(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setIsPinging(false);
          toast.error('Ping timed out. Device may be offline.');
        }
      }, 2000); // Check every 2 seconds
      
    } catch (error) {
      console.error('Error pinging device:', error);
      toast.error('Failed to ping device');
      setIsPinging(false);
    }
  };

  // Update the handleForceRefresh function
  const handleForceRefresh = async () => {
    if (!selectedDevice) {
      toast.error('Please select a device to refresh');
      return;
    }

    try {
      setIsRefreshing(true);
      
      // Update the force_refresh flag for the selected device
      const { error } = await supabase
        .from('rickshaw_devices')
        .update({ 
          force_refresh: true,
          force_refresh_timestamp: new Date().toISOString()
        })
        .eq('id', selectedDevice);

      if (error) throw error;
      
      toast.success('Refresh signal sent to device');
      
      // Reset the flag after a short delay to allow for future refreshes
      setTimeout(async () => {
        try {
          await supabase
            .from('rickshaw_devices')
            .update({ force_refresh: false })
            .eq('id', selectedDevice);
        } catch (resetError) {
          console.error('Error resetting force refresh flag:', resetError);
        } finally {
          setIsRefreshing(false);
        }
      }, 10000); // Increased to 10 seconds to ensure device has time to detect the signal
      
    } catch (error) {
      console.error('Error sending refresh signal:', error);
      toast.error('Failed to send refresh signal');
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-purple-100 p-2 rounded-lg mr-3">
            <RefreshCw size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Ping Devices</h3>
        </div>
        <Button 
          onClick={fetchDevices} 
          variant="outline" 
          className="text-sm py-1 px-2"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>
      
      <p className="text-gray-600 mb-4">
        Ping a device to check its status, location, and battery level.
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader className="animate-spin text-gray-500" size={24} />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Device
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={isPinging || isRefreshing}
            >
              <option value="">Select a device</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} {device.phone_number ? `(${device.phone_number})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button
              onClick={handlePing}
              disabled={!selectedDevice || isPinging || isRefreshing}
              isLoading={isPinging}
              className="flex-1"
            >
              {isPinging ? 'Pinging...' : 'Ping Device'}
            </Button>
            
            <Button
              onClick={handleForceRefresh}
              disabled={!selectedDevice || isPinging || isRefreshing}
              isLoading={isRefreshing}
              variant="outline"
              className="flex-1"
            >
              <RotateCw size={16} className="mr-1" />
              {isRefreshing ? 'Refreshing...' : 'Force Refresh'}
            </Button>
          </div>
          
          {pingResult && (
            <div className="mt-6 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Ping Result</h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-2">
                    <Battery size={16} className={pingResult.is_active ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-gray-600">
                      {pingResult.is_active ? 'Active' : 'Inactive'} • 
                      Battery: {pingResult.battery_level}% • 
                      Last Response: {formatDate(pingResult.completed_at)}
                    </p>
                  </div>
                </div>
                
                {pingResult.location ? (
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-2">
                      <MapPin size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-600">
                        Lat: {pingResult.location.latitude.toFixed(6)}, 
                        Lng: {pingResult.location.longitude.toFixed(6)}
                        {pingResult.location.accuracy && ` • Accuracy: ${pingResult.location.accuracy.toFixed(0)}m`}
                      </p>
                      <button 
                        onClick={() => openGoogleMaps(pingResult.location!.latitude, pingResult.location!.longitude)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        View on Google Maps
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-full mr-2">
                      <MapPin size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-gray-600">
                        No location data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PingController;