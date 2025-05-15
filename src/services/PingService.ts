import { supabase } from '../lib/supabase';

// Add a test function to verify Supabase connection
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('rickshaw_devices').select('count(*)');
    if (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return false;
  }
};

// Test the connection when the service is loaded
testSupabaseConnection();

// Check if device_pings table exists, create if not
const checkPingsTable = async () => {
  try {
    // Try to query the table
    const { error } = await supabase
      .from('device_pings')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Error checking device_pings table:', error);
      console.log('Make sure the device_pings table exists in your Supabase database');
    } else {
      console.log('device_pings table exists');
    }
  } catch (error) {
    console.error('Exception checking device_pings table:', error);
  }
};

// Check the pings table
checkPingsTable();

interface PingResponse {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  is_active: boolean;
  battery_level: number;
}

export const PingService = {
  /**
   * Send a ping request to a rickshaw device
   */
  async pingRickshaw(rickshawId: string): Promise<string> {
    try {
      console.log(`Sending ping to device: ${rickshawId}`);
      
      // First update the device's last_ping_attempt
      await supabase
        .from('rickshaw_devices')
        .update({ last_ping_attempt: new Date().toISOString() })
        .eq('id', rickshawId);
      
      // Create a new ping record
      const { data, error } = await supabase
        .from('device_pings')
        .insert({
          rickshaw_id: rickshawId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error when creating ping:', error);
        throw error;
      }
      
      console.log(`Created ping with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Error sending ping:', error);
      throw new Error('Failed to send ping request');
    }
  },

  /**
   * Check for pending pings for a specific rickshaw
   */
  async checkPendingPings(rickshawId: string) {
    try {
      console.log(`Checking pending pings for device: ${rickshawId}`);
      
      const { data, error } = await supabase
        .from('device_pings')
        .select('*')
        .eq('rickshaw_id', rickshawId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;
      
      // Return the first pending ping if any
      if (data && data.length > 0) {
        console.log(`Found pending ping: ${data[0].id}`);
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for pings:', error);
      return null;
    }
  },

  /**
   * Respond to a ping request with device information
   */
  async respondToPing(pingId: string, response: PingResponse): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('device_pings')
        .update({
          status: 'completed',
          location: response.location,
          is_active: response.is_active,
          battery_level: response.battery_level,
          completed_at: new Date().toISOString()
        })
        .eq('id', pingId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error responding to ping:', error);
      
      // Try to update the ping status to failed
      try {
        await supabase
          .from('device_pings')
          .update({
            status: 'failed',
            error_message: 'Failed to process ping response'
          })
          .eq('id', pingId);
      } catch (updateError) {
        console.error('Error updating ping status to failed:', updateError);
      }
      
      return false;
    }
  },

  /**
   * Get the result of a ping request
   */
  async getPingResult(pingId: string) {
    try {
      const { data, error } = await supabase
        .from('device_pings')
        .select('*')
        .eq('id', pingId)
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting ping result:', error);
      return null;
    }
  }
};