import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ControllerLayout from '../components/layout/ControllerLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MapPin, Clock, BarChart2, ArrowLeft, Eye, MousePointer } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

// Update the AdAnalytics type to include coordinates
type AdAnalytics = {
  id: string;
  ad_id: string;
  rickshaw_id: string;
  interaction_type: string;
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  ads: {
    title: string;
  };
};

type AnalyticsSummary = {
  totalInteractions: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRate: number;
  uniqueRickshaws: number;
  interactionsByAd: {
    adId: string;
    adTitle: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  interactionsByHour: {
    hour: string;
    impressions: number;
    clicks: number;
  }[];
  interactionsByRickshaw: {
    rickshawId: string;
    impressions: number;
    clicks: number;
  }[];
  interactionsByDay: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalInteractions: 0,
    totalImpressions: 0,
    totalClicks: 0,
    clickThroughRate: 0,
    uniqueRickshaws: 0,
    interactionsByAd: [],
    interactionsByHour: [],
    interactionsByRickshaw: [],
    interactionsByDay: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analytics.length > 0) {
      generateSummary();
    }
  }, [analytics]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_analytics')
        .select(`
          *,
          ads:ad_id (
            title
          )
        `)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      
      setAnalytics(data as AdAnalytics[]);
    } catch (error: any) {
      console.error('Error fetching analytics:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = () => {
    // Calculate total interactions
    const totalInteractions = analytics.length;
    
    // Calculate impressions and clicks
    const impressions = analytics.filter(item => item.interaction_type === 'impression').length;
    const clicks = analytics.filter(item => 
      item.interaction_type === 'link_click' || 
      item.interaction_type === 'read_more_click'
    ).length;
    
    // Calculate CTR
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    // Calculate unique rickshaws
    const uniqueRickshaws = new Set(analytics.map(item => item.rickshaw_id)).size;
    
    // Group interactions by ad
    const adGroups = analytics.reduce((acc, item) => {
      const adId = item.ad_id;
      const adTitle = item.ads?.title || 'Unknown Ad';
      
      if (!acc[adId]) {
        acc[adId] = {
          adId,
          adTitle,
          impressions: 0,
          clicks: 0,
          ctr: 0
        };
      }
      
      if (item.interaction_type === 'impression') {
        acc[adId].impressions++;
      } else if (item.interaction_type === 'link_click' || item.interaction_type === 'read_more_click') {
        acc[adId].clicks++;
      }
      
      return acc;
    }, {} as Record<string, { adId: string; adTitle: string; impressions: number; clicks: number; ctr: number }>);
    
    // Calculate CTR for each ad
    Object.values(adGroups).forEach(ad => {
      ad.ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
    });
    
    // Group interactions by hour
    const hourGroups = analytics.reduce((acc, item) => {
      const date = parseISO(item.timestamp);
      const hour = format(date, 'HH:00');
      
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          impressions: 0,
          clicks: 0
        };
      }
      
      if (item.interaction_type === 'impression') {
        acc[hour].impressions++;
      } else if (item.interaction_type === 'link_click' || item.interaction_type === 'read_more_click') {
        acc[hour].clicks++;
      }
      
      return acc;
    }, {} as Record<string, { hour: string; impressions: number; clicks: number }>);
    
    // Group interactions by rickshaw
    const rickshawGroups = analytics.reduce((acc, item) => {
      const rickshawId = item.rickshaw_id;
      
      if (!acc[rickshawId]) {
        acc[rickshawId] = {
          rickshawId,
          impressions: 0,
          clicks: 0
        };
      }
      
      if (item.interaction_type === 'impression') {
        acc[rickshawId].impressions++;
      } else if (item.interaction_type === 'link_click' || item.interaction_type === 'read_more_click') {
        acc[rickshawId].clicks++;
      }
      
      return acc;
    }, {} as Record<string, { rickshawId: string; impressions: number; clicks: number }>);
    
    // Group interactions by day (last 7 days)
    const dayGroups: Record<string, { date: string; impressions: number; clicks: number }> = {};
    
    // Initialize the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayGroups[date] = {
        date,
        impressions: 0,
        clicks: 0
      };
    }
    
    // Fill in the data
    analytics.forEach(item => {
      const date = format(parseISO(item.timestamp), 'yyyy-MM-dd');
      
      // Only consider the last 7 days
      if (dayGroups[date]) {
        if (item.interaction_type === 'impression') {
          dayGroups[date].impressions++;
        } else if (item.interaction_type === 'link_click' || item.interaction_type === 'read_more_click') {
          dayGroups[date].clicks++;
        }
      }
    });
    
    setSummary({
      totalInteractions,
      totalImpressions: impressions,
      totalClicks: clicks,
      clickThroughRate: ctr,
      uniqueRickshaws,
      interactionsByAd: Object.values(adGroups),
      interactionsByHour: Object.values(hourGroups).sort((a, b) => a.hour.localeCompare(b.hour)),
      interactionsByRickshaw: Object.values(rickshawGroups).sort((a, b) => b.impressions - a.impressions).slice(0, 10),
      interactionsByDay: Object.values(dayGroups)
    });
  };

  const filteredAnalytics = selectedAd
    ? analytics.filter(item => item.ad_id === selectedAd)
    : analytics;

  const formatCTR = (ctr: number) => {
    return ctr.toFixed(2) + '%';
  };

  return (
    <ControllerLayout>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/controller">
            <Button 
              variant="outline" 
              className="mr-4 flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ad Analytics</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 font-medium">Total Impressions</h3>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Eye size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.totalImpressions}</p>
              <p className="text-sm text-gray-500 mt-2">
                Ad views across all devices
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 font-medium">Total Clicks</h3>
                <div className="bg-green-100 p-2 rounded-lg">
                  <MousePointer size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.totalClicks}</p>
              <p className="text-sm text-gray-500 mt-2">
                User interactions with ads
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 font-medium">Click-Through Rate</h3>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart2 size={20} className="text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCTR(summary.clickThroughRate)}</p>
              <p className="text-sm text-gray-500 mt-2">
                Percentage of views resulting in clicks
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 font-medium">Active Rickshaws</h3>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <MapPin size={20} className="text-orange-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{summary.uniqueRickshaws}</p>
              <p className="text-sm text-gray-500 mt-2">
                Unique devices displaying ads
              </p>
            </div>
          </div>

          {/* Trend Chart - Last 7 Days */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Impressions vs Clicks (Last 7 Days)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={summary.interactionsByDay}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'impressions' ? 'Impressions' : 'Clicks']}
                    labelFormatter={(date) => format(parseISO(date as string), 'MMMM dd, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    name="Impressions" 
                    stroke="#0088FE" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    name="Clicks" 
                    stroke="#00C49F" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ad Performance Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ad Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.interactionsByAd.map((ad) => (
                    <tr key={ad.adId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ad.adTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ad.impressions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ad.clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCTR(ad.ctr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Impressions vs Clicks by Hour */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hourly Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.interactionsByHour}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="impressions" 
                      name="Impressions" 
                      fill="#0088FE" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="clicks" 
                      name="Clicks" 
                      fill="#00C49F" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ad Performance Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ad Impressions Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.interactionsByAd.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="impressions"
                      nameKey="adTitle"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {summary.interactionsByAd.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Interactions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Interactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rickshaw ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnalytics.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(item.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.ads?.title || 'Unknown Ad'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.rickshaw_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.interaction_type === 'impression' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.interaction_type === 'impression' ? 'View' : 'Click'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.coordinates ? (
                          <a 
                            href={`https://maps.google.com/?q=${item.coordinates.latitude},${item.coordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <MapPin size={14} className="mr-1" />
                            View Map
                          </a>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </ControllerLayout>
  );
};

export default AnalyticsPage;
