import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, StopCircle, ArrowUp } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, isStreaming }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading && !isStreaming) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // Stop after one sentence for auto-send
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        // Auto-send logic: Once we have a final result, send immediately
        onSend(finalTranscript, attachments); 
        setInput(''); // Clear input if any
        setAttachments([]);
        stopListening();
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Simple validation
      if (!file.type.startsWith('image/')) {
        alert('Only image files are currently supported.');
        return;
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Extract raw base64 without prefix
        const base64Content = base64Data.split(',')[1];

        const newAttachment: Attachment = {
          id: Date.now().toString(),
          mimeType: file.type,
          base64: base64Content,
          previewUrl: base64Data
        };

        setAttachments(prev => [...prev, newAttachment]);
      } catch (error) {
        console.error("Error reading file:", error);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-3 mb-3 px-1 overflow-x-auto">
          {attachments.map(att => (
            <div key={att.id} className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-700 bg-[#1E1F20]">
                <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 text-gray-400 hover:text-white border border-gray-600 shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className={`relative flex items-end gap-3 bg-[#1E1F20] rounded-[26px] p-2 pr-2 border transition-all duration-300 ${isListening ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-transparent focus-within:border-gray-600'}`}>
        
        {/* Start Icon (Attachment) */}
        {!isListening && (
           <div className="flex-shrink-0 mb-1 ml-1">
                <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-400 hover:text-gray-100 hover:bg-[#333537] rounded-full transition-colors"
                title="Attach file"
                >
                <Paperclip size={20} />
                </button>
                <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
                />
            </div>
        )}

        {isListening ? (
          // Listening Mode UI
          <div className="flex-1 flex items-center justify-between h-[52px] px-2">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-blue-500 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                    <span className="w-1 h-5 bg-purple-500 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                    <span className="w-1 h-8 bg-blue-500 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
                    <span className="w-1 h-5 bg-purple-500 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                    <span className="w-1 h-3 bg-blue-500 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                </div>
                <span className="text-gray-200 font-medium">Listening...</span>
            </div>
            
             <button
             onClick={stopListening}
             className="p-2.5 rounded-full bg-[#333537] text-gray-300 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors"
           >
             <X size={20} />
           </button>
          </div>
        ) : (
          // Standard Text Input Mode
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Mela anything..."
            disabled={isLoading || isStreaming}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none py-3.5 px-1 max-h-[200px] overflow-y-auto text-[16px]"
            rows={1}
          />
        )}

        {/* Action Button (Mic or Send) */}
        {!isListening && (
            <div className="flex-shrink-0 mb-1">
                 {input.trim() || attachments.length > 0 ? (
                    <button
                    onClick={handleSend}
                    disabled={isLoading || isStreaming}
                    className="p-2.5 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200"
                    >
                    {isLoading || isStreaming ? (
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <ArrowUp size={20} />
                    )}
                    </button>
                ) : (
                    <button
                    onClick={toggleListening}
                    className="p-2.5 rounded-full text-gray-400 bg-transparent hover:bg-[#333537] hover:text-white transition-colors"
                    title="Start voice input"
                    >
                    <Mic size={22} />
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};