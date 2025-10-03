import React, { useState, useRef, useEffect } from 'react';
import { IngresLogo, PlusIcon, LanguageIcon, ThreeDotsIcon } from './icons';
import { LANGUAGES } from '../constants';
import { ChatSession } from '../types';

interface SidebarProps {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    chatHistory,
    activeChatId,
    onSelectChat,
    onNewChat,
    selectedLanguage, 
    onLanguageChange,
    onClearHistory
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex-col justify-between hidden md:flex">
        <div>
            <div className="flex items-center gap-2 mb-8">
                <IngresLogo />
                <h1 className="text-xl font-bold text-gray-800">INGRES</h1>
            </div>
            <button 
                onClick={onNewChat}
                className="flex items-center justify-between w-full p-2 text-left bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                New Chat
                <PlusIcon />
            </button>
            <div className="mt-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chat History</h2>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                {chatHistory.length > 0 ? (
                    chatHistory.map(chat => (
                        <button 
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            className={`w-full text-left text-sm p-2 rounded-lg truncate ${
                                chat.id === activeChatId 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {chat.title}
                        </button>
                    ))
                ) : (
                    <div className="text-sm text-gray-400 p-2">No recent chats</div>
                )}
                </div>
            </div>
        </div>
        <div className="relative" ref={menuRef}>
            {menuOpen && (
                <div className="absolute bottom-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button 
                        onClick={() => {
                            onClearHistory();
                            setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Clear History
                    </button>
                </div>
            )}
            <div className="mb-2">
                <label htmlFor="language-select" className="flex items-center text-sm text-gray-600 mb-1">
                    <LanguageIcon />
                    <span className="ml-2">Language</span>
                </label>
                <select 
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang} value={lang.split(' ')[0]}>{lang}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={() => setMenuOpen(prev => !prev)}
                className="flex items-center justify-end w-full p-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                aria-label="More options"
            >
                <ThreeDotsIcon />
            </button>
        </div>
    </aside>
  );
};

export default Sidebar;