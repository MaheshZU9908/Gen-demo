import React from 'react';
import { Message } from '../types';
import { TypewriterEffect } from './TypewriterEffect';
import { Sparkles } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, isStreaming }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`w-full py-6 md:py-8 ${isUser ? 'bg-transparent' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto flex gap-6 px-4 md:px-0">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${isUser ? 'bg-gray-700' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
          {isUser ? (
             <span className="text-xs font-medium text-white">YOU</span>
          ) : (
             <Sparkles size={16} className="text-white" />
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="font-medium text-sm mb-1.5 text-gray-400 select-none">
            {isUser ? 'You' : 'Mela'}
          </div>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map(att => (
                    <div key={att.id} className="rounded-xl overflow-hidden max-w-[200px] border border-gray-700 shadow-sm">
                        <img src={att.previewUrl} alt="attachment" className="w-full h-auto" />
                    </div>
                ))}
             </div>
          )}

          <div className="text-[16px] leading-7 text-gray-100 font-light">
             <TypewriterEffect 
                content={message.content} 
                isStreaming={isLast && isStreaming} 
             />
          </div>
        </div>
      </div>
    </div>
  );
};