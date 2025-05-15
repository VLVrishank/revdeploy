import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookText } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <BookText className="h-8 w-8 text-stone-800" />
            <span className="font-serif text-xl font-bold text-stone-800">Chronicle</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/recommendations" className="text-stone-600 hover:text-stone-900">
                  For You
                </Link>
                <Link to="/write" className="bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800">
                  Write
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-stone-600 hover:text-stone-900"
                >
                  Sign Out
                </button>
                {profile?.username && (
                  <span className="text-stone-600">@{profile.username}</span>
                )}
              </>
            ) : (
              <>
                <Link to="/signin" className="text-stone-600 hover:text-stone-900">
                  Sign In
                </Link>
                <Link to="/signup" className="bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;