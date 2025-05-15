import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import { Ad, supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Toggle from '../ui/Toggle';

const AdList: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

      setAds(ads.map(ad => ad.id === id ? { ...ad, is_active: !currentStatus } : ad));
      toast.success(Ad ${!currentStatus ? 'activated' : 'deactivated'});
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ad status');
    }
  };

  const deleteAd = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;

    setIsDeleting(id);

    try {
      const adToDelete = ads.find(ad => ad.id === id);
      if (!adToDelete?.url) {
        toast.error('Could not find ad URL.');
        return;
      }

      const url = adToDelete.url;
      const filePath = url.split('/storage/v1/object/public/ads/')[1];

      if (!filePath) {
        toast.error('Invalid file path.');
        return;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage.from('ads').remove([filePath]);
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        toast.error('Failed to delete video from storage');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('ads')
        .delete()
        .eq('id', id)
        .select();

      if (dbError) {
        toast.error('Failed to delete ad from database');
        return;
      }

      // Update state
      setAds(prev => prev.filter(ad => ad.id !== id));
      toast.success('Ad deleted successfully');

      // Clean localStorage playlist
      try {
        const savedPlaylist = localStorage.getItem('adPlaylist');
        if (savedPlaylist) {
          const parsedPlaylist = JSON.parse(savedPlaylist);
          const updatedPlaylist = parsedPlaylist.filter(
            (item: any) => item.type !== 'ad' || item.adId !== id
          );
          localStorage.setItem('adPlaylist', JSON.stringify(updatedPlaylist));
        }
      } catch (err) {
        console.error('Error updating localStorage:', err);
      }
    } catch (err: any) {
      console.error('Error deleting ad:', err);
      toast.error(err.message || 'Failed to delete ad');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return <div className="text-center py-6">Loading ads...</div>;
  }

  return (
    <div className="bg-white rounded shadow-sm">
      {ads.length === 0 ? (
        <p className="text-center py-6 text-gray-500">No ads uploaded.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ads.map(ad => (
              <tr key={ad.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ad.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{ad.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {ad.type === 'image' ? ${ad.duration} seconds : 'Full play'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Toggle
                    enabled={ad.is_active}
                    onChange={() => toggleAdStatus(ad.id, ad.is_active)}
                    label={ad.is_active ? 'Active' : 'Inactive'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Button
                    variant="danger"
                    onClick={() => deleteAd(ad.id)}
                    disabled={isDeleting === ad.id}
                    className="inline-flex items-center"
                  >
                    {isDeleting === ad.id ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-1"></span>
                    ) : (
                      <Trash2 size={16} className="mr-1" />
                    )}
                    {isDeleting === ad.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdList;
