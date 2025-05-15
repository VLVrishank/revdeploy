import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Newspaper } from 'lucide-react';
import Toggle from '../ui/Toggle';
import { NewsService } from '../../services/NewsService';
import PingController from './PingController';

const NewsSettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await NewsService.getNewsSettings();
      setIsEnabled(settings.enabled);
    } catch (error) {
      console.error('Error fetching news settings:', error);
      toast.error('Failed to load news settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      const success = await NewsService.updateNewsSettings(enabled);
      
      if (success) {
        setIsEnabled(enabled);
        toast.success(`News ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating news settings:', error);
      toast.error('Failed to update news settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Newspaper size={20} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">News Integration</h3>
          </div>
          <Toggle
            enabled={isEnabled}
            onChange={handleToggle}
            disabled={isLoading}
          />
        </div>
        <p className="text-gray-600">
          {isEnabled 
            ? 'News will be displayed between ads in the player.' 
            : 'News integration is currently disabled.'}
        </p>
      </div>
      
      <PingController />
    </>
  );
};

export default NewsSettings;