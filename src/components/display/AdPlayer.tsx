import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ExternalLink, Info, X, ArrowRight, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Ad, News, supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { NewsService } from '../../services/NewsService';
import PingHandler from './PingHandler';

// Define content type for the player
type ContentType = 'ad' | 'news';

const AdPlayer: React.FC = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showEndQR, setShowEndQR] = useState(false);
  const [adImpression, setAdImpression] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('ad');
  const [newsEnabled, setNewsEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [rickshawId, setRickshawId] = useState<string | null>(null);
  const [rickshawInfo, setRickshawInfo] = useState<{name?: string, phone_number?: string} | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    fetchAds();
    fetchNews();
    fetchRickshawId();
    checkNewsSettings();
  }, []);

  const checkNewsSettings = async () => {
    const settings = await NewsService.getNewsSettings();
    setNewsEnabled(settings.enabled);
  };

  const fetchNews = async () => {
    try {
      // Try to fetch and store fresh news
      await NewsService.fetchAndStoreNews();
      
      // Get news from database
      const newsItems = await NewsService.getNews();
      setNews(newsItems);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchRickshawId = async () => {
    // Get rickshaw ID from local storage or URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const deviceId = localStorage.getItem('deviceId');
    
    let id = '';
    
    if (urlId) {
      // If ID is in URL, use it and save to localStorage
      id = urlId;
      localStorage.setItem('rickshawId', urlId);
      console.log('Using rickshaw ID from URL:', urlId);
    } else if (deviceId) {
      // If we have a device ID, fetch the associated rickshaw
      try {
        const { data, error } = await supabase
          .from('rickshaw_devices')
          .select('id, name, phone_number')
          .eq('id', deviceId)
          .single();
          
        if (data && !error) {
          id = data.id;
          setRickshawInfo({
            name: data.name,
            phone_number: data.phone_number
          });
          console.log('Using rickshaw ID from device:', id);
        } else {
          throw new Error('Device not found');
        }
      } catch (error) {
        console.error('Error fetching device:', error);
        // Fall back to stored ID or generate new one
      }
    }
    
    // If we still don't have an ID, check localStorage or generate one
    if (!id) {
      const storedId = localStorage.getItem('rickshawId');
      
      if (storedId) {
        id = storedId;
        console.log('Using rickshaw ID from localStorage:', storedId);
      } else {
        // If no ID found, generate a new one
        id = `rickshaw-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('rickshawId', id);
        console.log('Using generated rickshaw ID:', id);
      }
    }
    
    setRickshawId(id);
    
    // Try to fetch rickshaw info if we don't have it yet
    if (!rickshawInfo && id) {
      try {
        const { data, error } = await supabase
          .from('rickshaw_devices')
          .select('name, phone_number')
          .eq('id', id)
          .single();
          
        if (data && !error) {
          setRickshawInfo({
            name: data.name,
            phone_number: data.phone_number
          });
        }
      } catch (error) {
        console.error('Error fetching rickshaw info:', error);
      }
    }
  };

  useEffect(() => {
    // Cleanup function to clear the timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (contentType === 'ad' && ads.length === 0) return;
    if (contentType === 'news' && news.length === 0) return;
    
    if (contentType === 'ad') {
      playCurrentAd();
      // Track impression when ad changes
      trackAdImpression(ads[currentAdIndex].id);
      setAdImpression(true);
    } else {
      playCurrentNews();
    }
  }, [currentAdIndex, currentNewsIndex, ads, news, contentType]);

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Ensure URLs are properly formatted
        const processedData = data.map(ad => ({
          ...ad,
          url: ad.url.trim() // Ensure no whitespace
        }));
        setAds(processedData);
        setCurrentAdIndex(0);
        console.log('Loaded ads:', processedData);
      } else {
        setAds([]);
      }
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      toast.error(error.message || 'Failed to fetch ads');
    } finally {
      setIsLoading(false);
    }
  };

  const playCurrentAd = () => {
    if (ads.length === 0) return;
    
    setShowEndQR(false);
    const currentAd = ads[currentAdIndex];
    
    // Reset any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Handle video ads
    if (currentAd.type === 'video' && videoRef.current) {
      videoRef.current.play()
        .catch(error => {
          console.error('Error playing video:', error);
          showEndQRAndMoveNext();
        });
    } 
    // Handle image ads
    else if (currentAd.type === 'image') {
      timerRef.current = setTimeout(() => {
        showEndQRAndMoveNext();
      }, currentAd.duration * 1000);
    }
  };

  const playCurrentNews = () => {
    if (news.length === 0) {
      // If no news, move to next ad
      moveToNextContent();
      return;
    }
    
    // Reset any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Show news for 15 seconds
    timerRef.current = setTimeout(() => {
      moveToNextContent();
    }, 15000); // 15 seconds
  };

  const showEndQRAndMoveNext = () => {
    // Instead of showing the QR popup, show the details panel for 5 seconds
    setShowDetails(true);
    setCountdown(5);
    
    // Create an interval to update the countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    timerRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      setShowDetails(false);
      moveToNextContent();
    }, 5000); // 5 seconds
  };

  const moveToNextContent = () => {
    setShowDetails(false);
    setShowEndQR(false);
    setAdImpression(false);
    
    // If news is disabled, just cycle through ads
    if (!newsEnabled || news.length === 0) {
      if (ads.length === 0) return;
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      setContentType('ad');
      return;
    }
    
    // Alternate between ads and news
    if (contentType === 'ad') {
      // Move to news
      setContentType('news');
      // Only increment news index if we have news
      if (news.length > 0) {
        setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % news.length);
      }
    } else {
      // Move to ad
      setContentType('ad');
      // Only increment ad index if we have ads
      if (ads.length > 0) {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }
    }
  };

  const handleVideoEnded = () => {
    showEndQRAndMoveNext();
  };

  const toggleDetails = () => {
    // Only track analytics for ads, not news
    if (contentType === 'ad' && currentAd) {
      trackAdInteraction(currentAd.id, 'read_more_click');
    }
    setShowDetails(!showDetails);
  };

  const trackAdImpression = async (adId: string) => {
    if (adImpression || contentType !== 'ad') return; // Prevent duplicate impressions
    
    try {
      if (!rickshawId) {
        console.error('No rickshaw ID available');
        return;
      }
      
      // Create the payload
      const payload = {
        ad_id: adId,
        rickshaw_id: String(rickshawId),
        interaction_type: 'impression',
        timestamp: new Date().toISOString(),
        coordinates: null
      };
      
      // Record the impression in the database
      await supabase
        .from('ad_analytics')
        .insert(payload);
        
    } catch (error) {
      console.error('Failed to track ad impression:', error);
    }
  };

  const trackAdInteraction = async (adId: string, interactionType: string = 'read_more_click') => {
    try {
      if (!rickshawId) {
        console.error('No rickshaw ID available');
        return;
      }
      
      console.log('Tracking interaction for ad:', adId, 'with rickshaw ID:', rickshawId);
      
      // Get current position if available
      let coordinates = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('Got coordinates:', coordinates);
        } catch (geoError) {
          console.log('Geolocation error:', geoError);
          // Continue without coordinates
        }
      }
      
      // Create the payload - ensure rickshaw_id is stored as text
      const payload = {
        ad_id: adId,
        rickshaw_id: String(rickshawId), // Ensure it's a string
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
        coordinates: coordinates
      };
      
      console.log('Sending payload to Supabase:', payload);
      
      // Record the interaction in the database
      const { data, error } = await supabase
        .from('ad_analytics')
        .insert(payload)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        // Check if it's a foreign key constraint error
        if (error.code === '23503') {
          console.error('Foreign key constraint error. Check if ad_id exists in ads table.');
        }
        throw error;
      }
      
      console.log('Successfully recorded interaction:', data);
    } catch (error) {
      console.error('Failed to track ad interaction:', error);
      // Don't show error to user, silently fail
    }
  };

  const handleLogout = () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
    
    // Clear rickshaw ID from localStorage
    localStorage.removeItem('rickshawId');
    localStorage.removeItem('deviceId');
    
    // Navigate back to login page
    navigate('/');
    
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading content...</p>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="text-center p-6 bg-slate-800 bg-opacity-70 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-2xl font-bold mb-3">No content available</h3>
          <p className="text-lg">Please check back later for new content.</p>
        </div>
      </div>
    );
  }

  // Get current content based on type
  const currentAd = contentType === 'ad' ? ads[currentAdIndex] : null;
  const currentNewsItem = contentType === 'news' && news.length > 0 ? news[currentNewsIndex] : null;

  // Update the image rendering part with error handling and fallback
  // Update the renderAdContent function to ensure images display properly in full screen
  const renderAdContent = () => {
    if (contentType !== 'ad' || !currentAd) return null;
    
    if (currentAd.type === 'video') {
      return (
        <video
          ref={videoRef}
          src={currentAd.url}
          className="w-full h-full object-contain"
          onEnded={handleVideoEnded}
          autoPlay
          controls={false}
          muted={true}
          onError={(e) => {
            console.error('Video loading error:', e);
            showEndQRAndMoveNext();
          }}
        />
      );
    } else {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentAd.url}
            alt={currentAd.title}
            className="max-h-full max-w-full object-contain animate-subtle-zoom"
            onError={(e) => {
              console.error('Image loading error:', e.currentTarget.src);
              // Try with a cache-busting parameter and log more details
              console.log('Attempting to reload with cache busting');
              const originalSrc = currentAd.url;
              e.currentTarget.src = `${originalSrc}?t=${new Date().getTime()}`;
              
              // Set a fallback if the image still fails to load after retry
              e.currentTarget.onerror = () => {
                console.error('Image still failed to load after cache busting');
                e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Unavailable';
                e.currentTarget.onerror = null; // Prevent infinite loop
              };
            }}
            style={{ maxHeight: '100vh' }}
          />
        </div>
      );
    }
  };

  // Replace the content rendering in the return statement
  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Add PingHandler component if rickshawId exists */}
      {rickshawId && <PingHandler rickshawId={rickshawId} />}
      
      {/* Logout button - made more visible */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={handleLogout}
          className="bg-red-600 bg-opacity-80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
      
      {/* Rickshaw ID display */}
      <div className="absolute top-4 left-14 z-20">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium text-sm">
          {rickshawInfo?.name || rickshawId}
        </div>
      </div>
      
      {/* Content type indicator */}
      <div className="absolute top-4 right-24 z-10 bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium text-sm">
        {contentType === 'ad' ? 'Advertisement' : 'News'}
      </div>
      
      {/* Ad counter */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium text-sm">
        {contentType === 'ad' 
          ? `${currentAdIndex + 1} / ${ads.length}` 
          : `${currentNewsIndex + 1} / ${news.length}`}
      </div>
      
      <div className="flex h-full">
        {/* Main content area - takes 70% or 100% depending on whether details are shown */}
        <div className={`relative ${showDetails ? 'w-2/3' : 'w-full'} h-full transition-all duration-300 ease-in-out`}>
          <div className="relative h-full">
            {contentType === 'ad' && currentAd ? (
              renderAdContent()
            ) : (
              // News content (unchanged)
              currentNewsItem && (
                <div className="relative h-full overflow-hidden">
                  {/* Blurred background image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-md opacity-30"
                    style={{ backgroundImage: `url(${currentNewsItem.image_url})` }}
                  ></div>
                  
                  {/* Main news image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={currentNewsItem.image_url}
                      alt={currentNewsItem.title}
                      className="max-w-[80%] max-h-[60%] object-contain rounded-lg shadow-2xl"
                      onError={(e) => {
                        console.error('News image loading error');
                        e.currentTarget.src = 'https://via.placeholder.com/800x600?text=News+Image+Unavailable';
                      }}
                    />
                  </div>
                  
                  {/* News content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
                    <div className="max-w-3xl mx-auto">
                      <div className="text-white text-sm font-medium mb-2">
                        {currentNewsItem.source} • {new Date(currentNewsItem.published_at).toLocaleDateString()}
                      </div>
                      <h2 className="text-white text-3xl font-bold mb-3">{currentNewsItem.title}</h2>
                      <p className="text-gray-200 text-lg">{currentNewsItem.description}</p>
                    </div>
                  </div>
                </div>
              )
            )}
            
            {/* Subtle progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-900 bg-opacity-50">
              <div 
                className="h-full bg-white"
                style={{
                  width: showEndQR ? '100%' : '0%',
                  transition: contentType === 'ad' 
                    ? `width ${currentAd?.type === 'image' ? currentAd?.duration : 30}s linear`
                    : 'width 15s linear'
                }}
              />
            </div>
            
            {/* Subtle tap indicator - only for ads, not for news */}
            {contentType === 'ad' && !showDetails && !showEndQR && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="animate-pulse bg-white bg-opacity-30 backdrop-blur-sm rounded-full h-24 w-24 flex items-center justify-center shadow-lg">
                  <div className="bg-white bg-opacity-60 rounded-full h-16 w-16 flex items-center justify-center">
                    <p className="text-black font-bold text-base">TAP</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Ad info overlay at bottom - only for ads, not for news */}
            {contentType === 'ad' && currentAd && !showDetails && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white text-3xl font-bold">{currentAd.title}</h3>
                    <Button
                      onClick={toggleDetails}
                      variant="primary"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-6 py-3 rounded-full shadow-lg flex items-center animate-bounce-subtle"
                    >
                      <Info size={20} className="mr-2" />
                      Tap for Details
                    </Button>
                  </div>
                  
                  <p className="text-gray-200 text-lg mb-2">{currentAd.description.substring(0, 80)}{currentAd.description.length > 80 ? '...' : ''}</p>
                  
                  {/* Added interactive hint */}
                  <div className="mt-2 flex items-center">
                    <div className="mr-2 bg-white bg-opacity-20 p-1 rounded-full">
                      <Info size={16} className="text-white" />
                    </div>
                    <p className="text-gray-300 text-sm">Tap anywhere on screen for more information</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Side panel for QR code - only visible when details are shown and for ads */}
        {showDetails && contentType === 'ad' && currentAd && (
          <div className="w-1/3 h-full bg-white p-6 flex flex-col justify-center items-center animate-slide-in">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg relative">
              {/* Countdown indicator */}
              {countdown > 0 && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {countdown}
                </div>
              )}
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{currentAd.title}</h3>
                <button 
                  onClick={toggleDetails}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-800 text-base">{currentAd.description}</p>
              </div>
              
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-md">
                  <QRCodeSVG 
                    value={currentAd.external_link} 
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              
              <p className="text-center text-gray-600 text-base mb-2">
                Scan this QR code to learn more
              </p>
              
              {/* Removed the Next and Visit Website buttons */}
            </div>
          </div>
        )}
      </div>
      
      {/* Tap overlay to toggle details - covers the whole screen except when details are shown */}
      {!showDetails && !showEndQR && (
        <div 
          className="absolute inset-0 cursor-pointer z-10"
          onClick={toggleDetails}
          style={{ backgroundColor: 'transparent' }}
        />
      )}
    </div>
  );
};

export default AdPlayer;
