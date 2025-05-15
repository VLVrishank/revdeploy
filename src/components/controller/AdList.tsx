import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { Ad, supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';

const AdList: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setAds(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch ads');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setAds(ads.map(ad => {
        if (ad.id === id) {
          return { ...ad, is_active: !currentStatus };
        }
        return ad;
      }));
      
      toast.success(`Ad ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ad status');
    }
  };

  const deleteAd = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      setIsLoading(true);

      // First, get the ad details
      const { data: ad, error: fetchError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        const errorMessage = `Fetch Error: ${fetchError.message}, Code: ${fetchError.code}`;
        console.error(errorMessage, fetchError);
        toast.error(errorMessage);
        return;
      }

      if (!ad) {
        toast.error('Ad not found');
        return;
      }

      console.log('Ad to delete:', ad); // Log the ad data

      // Delete from storage if URL exists
      if (ad.url) {
        try {
          const fileUrl = new URL(ad.url);
          const pathSegments = fileUrl.pathname.split('/');
          const fileName = pathSegments[pathSegments.length - 1];
          const bucketPath = `ads/${fileName}`; // Include the folder name

          console.log('Attempting to delete file:', bucketPath);
          
          const { data: storageData, error: storageError } = await supabase.storage
            .from('ads')
            .remove([bucketPath]);

          if (storageError) {
            const storageErrorMsg = `Storage Error: ${storageError.message}, Code: ${storageError.name}`;
            console.error(storageErrorMsg, storageError);
            toast.error(storageErrorMsg);
            // Continue with database deletion even if storage fails
          } else {
            console.log('Storage deletion result:', storageData);
          }
        } catch (storageError: any) {
          const errorMsg = `Storage Error: ${storageError?.message || 'Unknown storage error'}`;
          console.error(errorMsg, storageError);
          toast.error(errorMsg);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (deleteError) {
        const dbErrorMsg = `Database Error: ${deleteError.message}, Code: ${deleteError.code}`;
        console.error(dbErrorMsg, deleteError);
        toast.error(dbErrorMsg);
        return;
      }

      // Update local state only after successful deletion
      setAds(prevAds => prevAds.filter(ad => ad.id !== id));
      toast.success('Ad deleted successfully');

    } catch (error: any) {
      const finalError = `Delete failed: ${error?.message || error?.error_description || 'Unknown error'}`;
      console.error('Full error details:', error);
      console.error('Error stack:', error?.stack);
      toast.error(finalError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center">
        <p className="text-gray-500">No ads have been uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ads.map((ad) => (
              <tr key={ad.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ad.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ad.type === 'video' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {ad.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ad.type === 'image' ? `${ad.duration} seconds` : 'Full play'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Toggle
                    enabled={ad.is_active}
                    onChange={() => toggleAdStatus(ad.id, ad.is_active)}
                    label={ad.is_active ? 'Active' : 'Inactive'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Button
                    variant="danger"
                    onClick={() => deleteAd(ad.id)}
                    className="inline-flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdList;
