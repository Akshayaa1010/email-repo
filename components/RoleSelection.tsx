import React from 'react';
import { UserRole } from '../types';
import { IngresLogo } from './icons';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

const RoleButton: React.FC<{
  title: string;
  onClick: () => void;
}> = ({ title, onClick }) => (
  <button
    onClick={onClick}
    className="w-full md:w-auto text-lg font-medium py-3 px-8 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    {title}
  </button>
);

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-4">
            <IngresLogo />
            <h1 className="text-5xl font-bold text-gray-800">INGRES</h1>
        </div>
        <p className="text-xl text-gray-600">AI-Powered Groundwater & Decision-Support Chatbot</p>
      </div>

      <div className="max-w-3xl w-full text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-8">Which category are you in?</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            {/* FIX: Removed buttons for 'General Public' and 'Policy Maker' to resolve errors.
                These roles are no longer defined in the UserRole enum as the app now focuses on the 'Researcher' experience. */}
            <RoleButton
                title="Student / Researcher"
                onClick={() => onSelectRole(UserRole.RESEARCHER)}
            />
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;