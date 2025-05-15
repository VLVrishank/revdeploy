import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const [loginType, setLoginType] = useState<'controller' | 'display'>('controller');

  return (
    <AuthLayout
      title="ProjectREV"
      subtitle="Smart Digital Ad Platform for Auto-Rickshaws"
    >
      <div className="mb-6">
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => setLoginType('controller')}
            className={`w-1/2 py-2 text-sm font-medium ${
              loginType === 'controller'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Controller Login
          </button>
          <button
            type="button"
            onClick={() => setLoginType('display')}
            className={`w-1/2 py-2 text-sm font-medium ${
              loginType === 'display'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Rickshaw Display
          </button>
        </div>
      </div>

      <LoginForm isController={loginType === 'controller'} />
      
      {/* Test account details section removed */}
    </AuthLayout>
  );
};

export default HomePage;