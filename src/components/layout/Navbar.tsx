import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, CreditCard, User, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-indigo-600 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-white" />
              <span className="text-white text-xl font-bold">LRTS Delhi</span>
            </Link>
          </motion.div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/" isActive={isActive('/')}>Home</NavLink>
              <NavLink to="/#passes" isActive={false}>Passes</NavLink>
              <NavLink to="/zones" isActive={isActive('/zones')}>Zones</NavLink>
              <NavLink to="/planner" isActive={isActive('/planner')}>Trip Planner</NavLink>
              <NavLink to="/support" isActive={isActive('/support')}>Support</NavLink>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-200 hover:text-white transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink to="/" isActive={isActive('/')}>Home</MobileNavLink>
            <MobileNavLink to="/#passes" isActive={false}>Passes</MobileNavLink>
            <MobileNavLink to="/zones" isActive={isActive('/zones')}>Zones</MobileNavLink>
            <MobileNavLink to="/planner" isActive={isActive('/planner')}>Trip Planner</MobileNavLink>
            <MobileNavLink to="/support" isActive={isActive('/support')}>Support</MobileNavLink>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const NavLink = ({ to, children, isActive }: { to: string; children: React.ReactNode; isActive: boolean }) => (
  <Link
    to={to}
    className={`${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-gray-200 hover:text-white hover:bg-indigo-500'
    } px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, isActive }: { to: string; children: React.ReactNode; isActive: boolean }) => (
  <Link
    to={to}
    className={`${
      isActive
        ? 'bg-indigo-700 text-white'
        : 'text-gray-200 hover:text-white hover:bg-indigo-500'
    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
  >
    {children}
  </Link>
);

export default Navbar;