import React from 'react';
import { Check } from 'lucide-react';

interface PassFeature {
  text: string;
  included: boolean;
}

interface PassCardProps {
  title: string;
  price: string;
  duration: string;
  features: PassFeature[];
  popular?: boolean;
}

const PassCard: React.FC<PassCardProps> = ({ title, price, duration, features, popular }) => {
  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${popular ? 'border-2 border-indigo-500' : ''}`}>
      {popular && (
        <div className="bg-indigo-500 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="p-6 bg-white">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <div className="mt-4">
          <span className="text-4xl font-extrabold text-gray-900">₹{price}</span>
          <span className="text-base font-medium text-gray-500">/{duration}</span>
        </div>
        <ul className="mt-6 space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                feature.included ? 'text-green-500' : 'text-gray-300'
              }`}>
                <Check size={20} />
              </div>
              <p className={`ml-3 text-base ${
                feature.included ? 'text-gray-700' : 'text-gray-500 line-through'
              }`}>
                {feature.text}
              </p>
            </li>
          ))}
        </ul>
        <button className={`mt-8 w-full py-3 px-4 rounded-md shadow ${
          popular
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
        } font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default PassCard;