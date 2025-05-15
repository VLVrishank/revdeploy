import React from 'react';
import { Clock, MapPin, CreditCard, Shield } from 'lucide-react';

const Benefits = () => {
  const benefits = [
    {
      title: 'Quick & Reliable',
      description: 'Get to your destination faster with our strategically placed rickshaw network',
      icon: Clock,
    },
    {
      title: 'Extensive Coverage',
      description: 'Operating in multiple zones across the city with dedicated routes',
      icon: MapPin,
    },
    {
      title: 'Affordable Passes',
      description: 'Choose from flexible daily, monthly, or annual subscription plans',
      icon: CreditCard,
    },
    {
      title: 'Safe & Secure',
      description: 'Verified drivers and regularly maintained vehicles for your safety',
      icon: Shield,
    },
  ];

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Benefits</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Why Choose LRTS?
          </p>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{benefit.title}</p>
                <p className="mt-2 ml-16 text-base text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Benefits;