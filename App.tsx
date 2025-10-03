
import React from 'react';
import { UserRole } from './types';
import ChatView from './components/ChatView';

const App: React.FC = () => {
  // The app now defaults to a single, powerful "Researcher" experience.
  // The role selection screen has been removed for a more direct user flow.
  return (
    <div className="h-screen w-screen bg-white font-sans">
      <ChatView userRole={UserRole.RESEARCHER} />
    </div>
  );
};

export default App;
