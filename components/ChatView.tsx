
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UserRole, ChatMessage, ChatSession } from '../types';
import { generateResponse } from '../services/geminiService';
import Sidebar from './Sidebar';
import Message from './Message';
import { SendIcon, MicIcon, LoadingIcon, IngresLogo } from './icons';
import { LANGUAGE_CODES } from '../constants';

interface ChatViewProps {
  userRole: UserRole;
}

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors,
// as these types are not always included in standard DOM typings.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

const ChatView: React.FC<ChatViewProps> = ({ userRole }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = chatHistory.find(chat => chat.id === activeChatId);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('chatHistory');
      if (storedHistory) {
        setChatHistory(JSON.parse(storedHistory));
      }
      const storedActiveId = localStorage.getItem('activeChatId');
      if (storedActiveId) {
        setActiveChatId(storedActiveId);
      } else {
        handleNewChat(); // Create a new chat if none is active
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      handleNewChat();
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [chatHistory, activeChatId]);


  useEffect(() => {
    if (synthRef.current) {
      const updateVoices = () => {
        setVoices(synthRef.current!.getVoices());
      };
      synthRef.current.onvoiceschanged = updateVoices;
      updateVoices();
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      const languageCode = LANGUAGE_CODES[(activeChat?.language || 'English').split(' ')[0]] || 'en-IN';
      recognition.lang = languageCode;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error, event.message);
        let errorMessage = "An unknown speech recognition error occurred.";
        switch (event.error) {
            case 'no-speech':
                errorMessage = "Sorry, I didn't catch that. Please try again.";
                break;
            case 'not-allowed':
                errorMessage = "Microphone access is blocked. Please allow permissions.";
                break;
            case 'network':
                errorMessage = !navigator.onLine ? "You're offline. Please check your connection." : "A network error occurred with the speech service.";
                break;
        }
        setRecognitionError(errorMessage);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        inputRef.current?.focus();
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech recognition not supported.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeChat?.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [activeChat?.messages]);
  
  const updateActiveChat = (updater: (chat: ChatSession) => ChatSession) => {
    setChatHistory(prev => 
        prev.map(chat => chat.id === activeChatId ? updater(chat) : chat)
    );
  };

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading || !activeChat) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    updateActiveChat(chat => ({ ...chat, messages: [...chat.messages, userMessage] }));
    
    // Create a title for new chats
    if (activeChat.messages.length === 0) {
        updateActiveChat(chat => ({...chat, title: input}));
    }

    setInput('');
    setIsLoading(true);

    try {
      // PERFORMANCE FIX: Send only the last 6 messages to reduce token count and improve API response time.
      const recentMessages = activeChat.messages.slice(-6);
      const botResponse = await generateResponse(input, recentMessages, userRole, activeChat.language);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot',
        chartData: botResponse.chartData,
      };
      updateActiveChat(chat => ({ ...chat, messages: [...chat.messages, botMessage] }));

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong.",
        sender: 'bot',
      };
       updateActiveChat(chat => ({ ...chat, messages: [...chat.messages, errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeChat, userRole, setChatHistory]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        setRecognitionError("Speech recognition is not available.");
        return;
    }
    setRecognitionError(null);

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput(''); 
      recognitionRef.current.start();
    }
  };

  const handleSpeak = useCallback((messageId: string, text: string) => {
    if (!synthRef.current || !activeChat) return;
    
    if (speakingMessageId === messageId) {
        synthRef.current.cancel();
        setSpeakingMessageId(null);
        return;
    }
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const languageCode = LANGUAGE_CODES[activeChat.language.split(' ')[0]] || 'en-IN';
    utterance.lang = languageCode;

    // FIX: Refined voice selection with fallbacks for better multilingual support.
    let voice = voices.find(v => v.lang === languageCode); // Exact match
    if (!voice) {
        const langPart = languageCode.split('-')[0];
        voice = voices.find(v => v.lang.startsWith(langPart)); // Language prefix match
    }
    if (voice) {
      utterance.voice = voice;
    } else {
      console.warn(`No voice found for lang: ${languageCode}. Using default.`);
    }

    utterance.onstart = () => setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error(`Speech synthesis error: ${event.error}`);
        setSpeakingMessageId(null);
    };

    synthRef.current.speak(utterance);
  }, [activeChat, speakingMessageId, voices]);

  const handleNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      userRole: userRole,
      language: 'English',
    };
    setChatHistory(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, [userRole]);

  const handleLanguageChange = (lang: string) => {
    if (activeChat) {
      updateActiveChat(chat => ({...chat, language: lang}));
    }
  };
  
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all chat history? This action cannot be undone.")) {
        setChatHistory([]);
        setActiveChatId(null);
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('activeChatId');
        handleNewChat();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        chatHistory={chatHistory}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        selectedLanguage={activeChat?.language || 'English'}
        onLanguageChange={handleLanguageChange}
        onClearHistory={handleClearHistory}
      />
      <main className="flex flex-col flex-1 h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
               <IngresLogo />
               <h2 className="text-2xl font-semibold mt-4">Welcome to INGRES</h2>
               <p className="mt-1">You are interacting as: <span className="font-bold text-blue-600">{userRole}</span></p>
               <p>How can I help you today?</p>
            </div>
          ) : (
            activeChat.messages.map((msg) => <Message key={msg.id} message={msg} handleSpeak={handleSpeak} speakingMessageId={speakingMessageId} />)
          )}
           {isLoading && (
            <div className="flex items-center space-x-3 self-start">
               <div className="p-3 bg-gray-200 rounded-full">
                <IngresLogo small={true} />
               </div>
               <div className="flex items-center justify-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
               </div>
            </div>
           )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto">
            {recognitionError && (
              <p className="text-center text-red-500 text-sm mb-2">{recognitionError}</p>
            )}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? 'Listening...' : 'Type your message...'}
                className="w-full py-3 pl-4 pr-24 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={handleMicClick}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${isRecording ? 'bg-red-100 text-red-600 ring-2 ring-red-300 animate-pulse' : 'text-gray-500 hover:bg-gray-200 hover:text-blue-600 focus:ring-2 focus:ring-blue-300'}`}
                  disabled={isLoading}
                >
                  <MicIcon />
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading || input.trim() === ''}
                  className={`ml-2 p-2 rounded-full transition-colors ${isLoading || input.trim() === '' ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isLoading ? <LoadingIcon /> : <SendIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatView;
