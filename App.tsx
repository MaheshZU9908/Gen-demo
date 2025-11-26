import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Message, Attachment } from './types';
import { Volume2, VolumeX, Menu, Plus, Compass, Code, Lightbulb, PenTool } from 'lucide-react';

const SUGGESTIONS = [
  { text: "Plan a trip to Kyoto", subtext: "Include temples and food", icon: <Compass size={24} className="text-blue-400" /> },
  { text: "Explain React Hooks", subtext: "With code examples", icon: <Code size={24} className="text-purple-400" /> },
  { text: "Brainstorm blog titles", subtext: "About AI technology", icon: <Lightbulb size={24} className="text-yellow-400" /> },
  { text: "Write a short story", subtext: "Sci-fi genre", icon: <PenTool size={24} className="text-pink-400" /> },
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const speakingRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize Gemini chat on mount
    geminiService.startChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const speakText = (text: string) => {
    if (!isVoiceEnabled || !synthRef.current) return;

    // Cancel any current speaking
    synthRef.current.cancel();

    // Clean markdown for speech
    const cleanText = text.replace(/[*#`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || 
                           voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    speakingRef.current = true;
    utterance.onend = () => {
      speakingRef.current = false;
    };

    synthRef.current.speak(utterance);
  };

  const handleSend = async (text: string, attachments: Attachment[] = []) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Stop any previous speech
    if (synthRef.current) synthRef.current.cancel();

    // Create placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = {
      id: aiMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, aiMsgPlaceholder]);

    try {
      setIsLoading(false);
      setIsStreaming(true);

      let fullResponse = "";
      const stream = geminiService.sendMessageStream(text, attachments);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullResponse } : msg
          )
        );
      }
      
      // Finished streaming
      setIsStreaming(false);
      
      // Trigger voice if enabled
      if (isVoiceEnabled) {
        speakText(fullResponse);
      }

    } catch (error) {
      console.error("Error in chat loop:", error);
      setIsLoading(false);
      setIsStreaming(false);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: "Sorry, I encountered an error. Please check your connection or API key." } : msg
        )
      );
    }
  };

  const resetChat = () => {
    setMessages([]);
    if (synthRef.current) synthRef.current.cancel();
    geminiService.startChat();
    setSidebarOpen(false); // Close sidebar on mobile when starting new chat
  };

  return (
    <div className="flex h-screen bg-[#131314] text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[280px] bg-[#0b0b0b] flex flex-col transition-transform duration-300 ease-in-out border-r border-[#1E1F20]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4">
            <div className="flex items-center gap-2 mb-6 px-2">
                 <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
                 <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Mela</span>
            </div>

          <button 
            onClick={resetChat}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-full hover:bg-[#1E1F20] transition-colors text-sm text-gray-200 bg-[#1E1F20] border border-transparent hover:border-gray-700 shadow-sm"
          >
            <Plus size={18} />
            <span className="font-medium">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 mb-3 px-3 uppercase tracking-wider">Recent</div>
            {/* Mock History Items */}
            <div className="space-y-1">
                {messages.length > 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-100 bg-[#1E1F20] rounded-lg truncate cursor-pointer hover:bg-[#2A2B2C] transition-colors">
                        {messages[0].content.substring(0, 30) || "Conversation"}...
                    </div>
                ) : (
                    <div className="px-3 py-2 text-sm text-gray-600 italic">
                        Your history will appear here
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 border-t border-[#1E1F20]">
           <button className="flex items-center gap-3 w-full px-2 py-2 text-sm hover:bg-[#1E1F20] rounded-lg cursor-pointer transition-colors text-left">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300">
                U
              </div>
              <div className="flex-1">
                 <div className="font-medium text-gray-200">User Account</div>
                 <div className="text-xs text-gray-500">Free Plan</div>
              </div>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 md:px-6 absolute top-0 left-0 right-0 z-20 bg-[#131314]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
            >
                <Menu size={24} />
            </button>
            <span className="md:hidden text-lg font-semibold text-gray-200">Mela</span>
             <span className="hidden md:block text-lg font-medium text-gray-300 opacity-0">Mela AI</span> {/* Spacer/Placeholder */}
          </div>

          <button
            onClick={() => {
                const newState = !isVoiceEnabled;
                setIsVoiceEnabled(newState);
                if (!newState && synthRef.current) {
                    synthRef.current.cancel();
                }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              isVoiceEnabled 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                : 'bg-transparent text-gray-400 border-gray-700 hover:bg-[#1E1F20] hover:text-gray-200'
            }`}
          >
            {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden sm:inline">{isVoiceEnabled ? 'Voice Active' : 'Enable Voice'}</span>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto pt-20 pb-40 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 max-w-4xl mx-auto">
              
              <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Compass size={32} className="text-white" />
                  </div>
                  <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 mb-3">
                    Hello, User
                  </h1>
                  <h2 className="text-4xl font-semibold text-gray-600">
                    How can I help you today?
                  </h2>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mt-8">
                {SUGGESTIONS.map((sugg, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSend(sugg.text)}
                        className="flex flex-col items-start p-4 bg-[#1E1F20] hover:bg-[#2A2B2C] border border-gray-800 hover:border-gray-600 rounded-2xl text-left transition-all duration-200 group"
                    >
                        <div className="flex items-center justify-between w-full mb-2">
                             <div className="p-2 bg-[#131314] rounded-lg group-hover:scale-110 transition-transform">
                                {sugg.icon}
                             </div>
                        </div>
                        <span className="text-gray-200 font-medium">{sugg.text}</span>
                        <span className="text-gray-500 text-sm mt-1">{sugg.subtext}</span>
                    </button>
                ))}
              </div>

            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg, idx) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isLast={idx === messages.length - 1}
                  isStreaming={isStreaming}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Footer Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pb-8 pt-12 px-4">
          <ChatInput 
            onSend={handleSend} 
            isLoading={isLoading} 
            isStreaming={isStreaming}
          />
          <div className="text-center mt-3 text-xs text-gray-500 font-medium">
             Mela can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;