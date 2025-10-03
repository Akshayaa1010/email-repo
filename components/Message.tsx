import React from 'react';
import { ChatMessage } from '../types';
import ChartRenderer from './ChartRenderer';
import { IngresLogo, UserIcon, SpeakerIcon, SpeakerWaveIcon } from './icons';
import { marked } from 'marked';

interface MessageProps {
  message: ChatMessage;
  handleSpeak: (messageId: string, text: string) => void;
  speakingMessageId: string | null;
}

const Message: React.FC<MessageProps> = ({ message, handleSpeak, speakingMessageId }) => {
  const isBot = message.sender === 'bot';
  const isSpeaking = speakingMessageId === message.id;
  const htmlContent = isBot ? marked.parse(message.text) : null;
  
  return (
    <div className={`flex items-start gap-4 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isBot ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
        {isBot ? <IngresLogo small={true} /> : <UserIcon />}
      </div>
      <div className={`max-w-2xl p-4 rounded-xl ${isBot ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow">
            {isBot && htmlContent ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
                <p>{message.text}</p>
            )}
          </div>
          <button 
            onClick={() => handleSpeak(message.id, message.text)} 
            className="flex-shrink-0 self-start text-current opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
            aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
          >
            {isSpeaking ? <SpeakerWaveIcon /> : <SpeakerIcon />}
          </button>
        </div>
        {message.chartData && (
          <div className="mt-4 bg-white p-4 rounded-lg">
            <ChartRenderer chartData={message.chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;