import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation, Search, MessageCircle } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import { delhiMetroStations } from '../data/stations';
import toast from 'react-hot-toast';

interface Location {
  name: string;
  type: 'station' | 'landmark';
}

const locations: Location[] = [
  ...delhiMetroStations.map(station => ({ name: station.name, type: 'station' as const })),
  { name: 'India Gate', type: 'landmark' },
  { name: 'Connaught Place', type: 'landmark' },
  { name: 'Qutub Minar', type: 'landmark' },
  { name: 'Red Fort', type: 'landmark' },
  { name: 'Lotus Temple', type: 'landmark' },
];

const TripPlanner: React.FC = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [query, setQuery] = useState('');
  const [showRoute, setShowRoute] = useState(false);

  const filteredLocations = query === ''
    ? locations
    : locations.filter((location) =>
        location.name.toLowerCase().includes(query.toLowerCase())
      );

  const handlePlanTrip = () => {
    if (!source || !destination) {
      toast.error('Please select both source and destination');
      return;
    }
    setShowRoute(true);
    toast.success('Route planned successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Plan Your Trip
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-3xl mx-auto">
            Find the best route for your journey using our rickshaw network
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="bg-white shadow-xl rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <Combobox value={source} onChange={setSource}>
                  <div className="relative mt-1">
                    <div className="relative w-full">
                      <Combobox.Input
                        className="w-full rounded-lg border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(name: string) => name}
                        placeholder="Enter pickup location"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredLocations.map((location) => (
                        <Combobox.Option
                          key={location.name}
                          value={location.name}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {location.name}
                              </span>
                              {location.type === 'station' && (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}>
                                  <MapPin className="h-4 w-4" aria-hidden="true" />
                                </span>
                              )}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <Combobox value={destination} onChange={setDestination}>
                  <div className="relative mt-1">
                    <div className="relative w-full">
                      <Combobox.Input
                        className="w-full rounded-lg border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onChange={(event) => setQuery(event.target.value)}
                        displayValue={(name: string) => name}
                        placeholder="Enter destination"
                      />
                      <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredLocations.map((location) => (
                        <Combobox.Option
                          key={location.name}
                          value={location.name}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {location.name}
                              </span>
                              {location.type === 'station' && (
                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-indigo-600'
                                }`}>
                                  <MapPin className="h-4 w-4" aria-hidden="true" />
                                </span>
                              )}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>

              <button
                onClick={handlePlanTrip}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Navigation className="h-5 w-5" />
                <span>Plan Trip</span>
              </button>
            </div>

            {showRoute && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-6 border-t pt-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-indigo-600" />
                      <span className="text-gray-700">Estimated Time: 25 mins</span>
                    </div>
                    <span className="text-lg font-semibold text-indigo-600">₹45</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">Route Details</h3>
                    <ul className="mt-2 space-y-2">
                      <li className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">Board rickshaw at {source}</span>
                      </li>
                      <li className="flex items-start">
                        <Navigation className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">10 minute ride to nearest metro station</span>
                      </li>
                      <li className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">Arrive at {destination}</span>
                      </li>
                    </ul>
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors duration-200">
                    <MessageCircle className="h-5 w-5" />
                    <span>Contact Support</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TripPlanner;