import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ControllerLayout from '../components/layout/ControllerLayout';
import AdUploadForm from '../components/controller/AdUploadForm';
import AdList from '../components/controller/AdList';
import Button from '../components/ui/Button';
import { List, Plus, BarChart2, Truck, Activity, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NewsSettings from '../components/controller/NewsSettings';

const ControllerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('list');
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0,
    rickshaws: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total and active ads
      const { data: adsData } = await supabase
        .from('ads')
        .select('id, is_active');
      
      const totalAds = adsData?.length || 0;
      const activeAds = adsData?.filter(ad => ad.is_active).length || 0;
      
      // Get analytics data
      const { data: analyticsData } = await supabase
        .from('ad_analytics')
        .select('interaction_type, rickshaw_id');
      
      const totalImpressions = analyticsData?.filter(item => item.interaction_type === 'impression').length || 0;
      const totalClicks = analyticsData?.filter(item => item.interaction_type === 'link_click' || item.interaction_type === 'read_more_click').length || 0;
      
      // Get unique rickshaws
      const uniqueRickshaws = new Set(analyticsData?.map(item => item.rickshaw_id)).size || 0;
      
      setStats({
        totalAds,
        activeAds,
        totalImpressions,
        totalClicks,
        rickshaws: uniqueRickshaws
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <ControllerLayout>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your ads and view performance metrics
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total Ads</h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <List size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAds}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.activeAds} active ads
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Impressions</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <Activity size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalImpressions}</p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.totalClicks} total clicks
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">CTR</h3>
            <div className="bg-purple-100 p-2 rounded-lg">
              <BarChart2 size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalImpressions > 0 
              ? `${((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}%` 
              : '0%'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click-through rate
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Rickshaws</h3>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Truck size={20} className="text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.rickshaws}</p>
          <p className="text-sm text-gray-500 mt-2">
            Active devices
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button
          variant={activeTab === 'list' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('list')}
          className="flex items-center"
        >
          <List size={16} className="mr-2" />
          View Ads
        </Button>
        <Button
          variant={activeTab === 'upload' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('upload')}
          className="flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Upload New
        </Button>
        <Link to="/analytics">
          <Button
            variant="outline"
            className="flex items-center"
          >
            <BarChart2 size={16} className="mr-2" />
            Analytics
          </Button>
        </Link>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {activeTab === 'upload' ? <AdUploadForm /> : <AdList />}
      </div>
      
      {/* News Settings */}
      <div className="mb-8">
        <NewsSettings />
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        {/* ... existing tab code ... */}
      </div>
      
      {/* Content */}
      <div>
        {/* ... existing content code ... */}
      </div>
    </ControllerLayout>
  );
};

export default ControllerPage;