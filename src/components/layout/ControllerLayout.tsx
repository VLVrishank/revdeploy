import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Menu, X, BarChart2, List, Home } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
// Import the logo
import logo from '../../assets/images/logo.jpg';

interface ControllerLayoutProps {
  children: React.ReactNode;
}

const ControllerLayout: React.FC<ControllerLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/');
        return;
      }
      setUser(data.user);
    };

    checkUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow-sm border-r border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <span className="ml-2 text-lg font-bold text-gray-900">ProjectREV</span>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 flex-1 px-4 space-y-1">
            <Link to="/controller" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-100">
              <Home className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600" />
              Dashboard
            </Link>
            <Link to="/controller" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-100">
              <List className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600" />
              Ads
            </Link>
            <Link to="/analytics" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-100">
              <BarChart2 className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-600" />
              Analytics
            </Link>
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </p>
                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center mt-1"
                >
                  <LogOut size={14} className="mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                // Also update the mobile header:
                <div className="flex-shrink-0 flex items-center">
                  <img src={logo} alt="Logo" className="h-8 w-auto" />
                  <span className="ml-2 text-lg font-bold text-gray-900">ProjectREV</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-25" onClick={toggleMenu}>
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-4 py-6 space-y-6">
              <Link to="/controller" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100" onClick={toggleMenu}>
                Dashboard
              </Link>
              <Link to="/analytics" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100" onClick={toggleMenu}>
                Analytics
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2 text-sm text-gray-700">
                  {user?.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ControllerLayout;