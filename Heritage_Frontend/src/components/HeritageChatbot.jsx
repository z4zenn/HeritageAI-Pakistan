import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Landmark, X, Send } from 'lucide-react';
import axios from 'axios';

// Helper to strip any model reasoning/thinking text before displaying to user
const cleanResponseText = (text) => {
  if (!text) return '';
  
  // 1. Remove complete <think>...</think> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. If <think> was unclosed or if the model placed its entire answer inside <think>, extract dialogue from inside <think>:
  if (!cleaned) {
    const rawNoTags = text.replace(/<think>|<\/think>/gi, '');

    // Check for quoted dialogue e.g. "Welcome to Harappa..."
    const quotedMatches = [...rawNoTags.matchAll(/["“]([A-Z][^"”]{30,})["”]/g)];
    if (quotedMatches && quotedMatches.length > 0) {
      cleaned = quotedMatches[quotedMatches.length - 1][1];
    } else {
      const paragraphs = rawNoTags.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      const cleanParagraphs = paragraphs.filter(p =>
        !/^\s*(?:\d+\.|\*|-)\s*\*\*/.test(p) &&
        !/^(Analyze|Identify|Draft|Check|Final|Revised|Count:|Tone:|Context:|Here's|Thinking|Ready|Output|Proceeds|\[Self-Correction|- First|- Answers)/i.test(p)
      );
      cleaned = cleanParagraphs[cleanParagraphs.length - 1] || text;
    }
  }

  // 3. Post-Processing Sanitizer (Failsafe Regex)
  cleaned = cleaned
    .replace(/^(?:\d+\.\s*\*\*.*?\*\*[\s\S]*?)+/i, '')
    .replace(/^\s*(?:\d+\.|\*|-)\s*\*\*:?.*$/gmi, '')
    .replace(/^\s*(?:-\s*First word.*|-\s*Answers directly.*|---\s*|Self-Critique:.*|Checklist:.*|Let's refine.*|Here's a breakdown.*|Let's make sure.*|Here's a thinking process:.*)\n+/gmi, '')
    .replace(/^(?:Count:|Tone:|Context:|Constraints:|Proceeds|Output matches|Self-Correction|\[Output|All constraints|Proceed|Revised:).*$/gmi, '')
    .replace(/\s*->\s*Exactly \d+ sentences.*$/gi, '')
    .replace(/\s*->\s*Meets all criteria.*$/gi, '')
    .trim();

  return cleaned;
};

// Send message to backend API instead of calling Groq directly in the browser
const sendMessage = async (userMessage, siteData, history) => {
  const response = await axios.post('/api/ai/chat', {
    message: userMessage,
    siteData,
    history
  }, { timeout: 30000 });

  if (response.data && response.data.success) {
    return cleanResponseText(response.data.data.reply);
  }
  throw new Error(response.data?.message || 'Chat request failed');
};

export default function HeritageChatbot({ site }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulseRing, setShowPulseRing] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Manage conversation history for Anthropic API
  const [history, setHistory] = useState([]);

  // UI message list (starts with welcome message)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Salaam! I'm your AI guide for ${site?.name || 'this heritage site'}. Ask me anything — history, legends, best time to visit, what to expect, or stories about this place. 🏛️`
    }
  ]);

  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Disable pulse ring on first interaction or opening chat
  const handleOpenChat = () => {
    setIsOpen(true);
    setShowPulseRing(false);
  };

  // Map site schema to the exact prompt siteData shape
  const siteDataForPrompt = {
    name: site?.name || 'Heritage Site',
    type: site?.siteType || 'Monument',
    city: site?.city || 'Pakistan',
    province: site?.province || 'Pakistan',
    era: site?.civilizationEra || 'Ancient History',
    period: site?.period || 'Unknown',
    description: site?.description || ''
  };

  // Core handler to process sending messages
  const handleSend = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    // 1. Add user message to UI messages list
    const userMsg = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // 2. Show typing indicator
    setIsLoading(true);

    try {
      // Create user-assistant message turns history array
      const apiHistory = history.map(h => ({
        role: h.role,
        content: h.content
      }));

      // 3. Call Claude API with user input and current history
      const responseText = await sendMessage(textToSend, siteDataForPrompt, apiHistory);

      // 4. Add to history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: textToSend },
        { role: 'assistant', content: responseText }
      ]);

      // 5. Add AI response to UI messages list
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: responseText }
      ]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      // Gracefully show error bubble
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      // 6. Remove typing indicator
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(inputMessage);
  };

  // Reset chatbot states on site ID change (navigation)
  useEffect(() => {
    setIsOpen(false);
    setHistory([]);
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Salaam! I'm your AI guide for ${site?.name || 'this heritage site'}. Ask me anything — history, legends, best time to visit, what to expect, or stories about this place. 🏛️`
      }
    ]);
    setShowPulseRing(true);
  }, [site?.id]);

  const suggestedQuestions = [
    "Tell me the history",
    "Any legends or stories?",
    "Best time to visit?"
  ];

  return (
    <>
      {/* Component Specific Keyframes and Scrollbar Customization */}
      <style>{`
        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.65);
            opacity: 0;
          }
        }
        .animate-ring-pulse {
          animation: ringPulse 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes onlinePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .animate-pulse-online {
          animation: onlinePulse 2s infinite ease-in-out;
        }

        @keyframes typingDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-typing-dot-1 { animation: typingDot 1.2s infinite ease-in-out; }
        .animate-typing-dot-2 { animation: typingDot 1.2s infinite ease-in-out 0.2s; }
        .animate-typing-dot-3 { animation: typingDot 1.2s infinite ease-in-out 0.4s; }

        .chatbot-messages-container::-webkit-scrollbar {
          width: 3px;
        }
        .chatbot-messages-container::-webkit-scrollbar-track {
          background: #141618;
        }
        .chatbot-messages-container::-webkit-scrollbar-thumb {
          background: #3D494F;
          border-radius: 1.5px;
        }
        .chatbot-messages-container::-webkit-scrollbar-thumb:hover {
          background: #1D9E75;
        }
      `}</style>

      {/* ── CHAT WINDOW ── */}
      <div
        ref={chatWindowRef}
        className={`fixed z-[10001] bg-[#141618] border-[0.5px] border-[#3D494F] overflow-hidden transition-all duration-300 ease-out flex flex-col w-[360px] h-[500px] bottom-[96px] right-[28px] rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] max-md:w-full max-md:h-[60vh] max-md:bottom-0 max-md:right-0 max-md:rounded-t-[20px] max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0 ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 max-md:translate-y-full opacity-0 pointer-events-none'
          }`}
      >
        {/* Header */}
        <div className="bg-[#23282D] px-5 py-4 flex items-center justify-between border-b border-[#3D494F]/30 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-[32px] h-[32px] rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/35 flex items-center justify-center shrink-0">
              <Landmark className="w-4.5 h-4.5 text-[#1D9E75]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse-online shrink-0" />
                <span className="font-sans font-medium text-[14px] text-[#EDE9DF] truncate leading-tight" title={site?.name}>
                  {site?.name}
                </span>
              </div>
              <span className="font-sans font-light text-[11px] text-[#C8B89A] italic mt-0.5 leading-none">
                AI Heritage Guide
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[#C8B89A] hover:text-[#EDE9DF] cursor-pointer bg-transparent border-none outline-none p-1 transition-colors flex items-center justify-center"
            aria-label="Close Chatbot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141618] chatbot-messages-container">
          {messages.map((msg, index) => {
            const isAI = msg.sender === 'ai';
            const isFirstAI = isAI && index === 0;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 max-w-full ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {/* 14px Monument Icon before first AI message only */}
                {isFirstAI && (
                  <Landmark className="w-[14px] h-[14px] text-[#1D9E75] mt-3.5 shrink-0" />
                )}
                {/* Visual offset matching icon spacing for subsequent left bubbles */}
                {isAI && !isFirstAI && <div className="w-[14px]" />}

                <div
                  className={`px-3.5 py-2.5 rounded-2xl ${isAI
                    ? 'bg-[#23282D] border-[0.5px] border-[#3D494F] text-[#EDE9DF] rounded-[16px_16px_16px_4px] max-w-[85%] font-sans font-light text-[13px] leading-[1.6]'
                    : 'border-[0.5px] border-[#1D9E75] text-[#EDE9DF] rounded-[16px_16px_4px_16px] max-w-[75%] font-sans font-normal text-[13px]'
                    }`}
                  style={{
                    background: !isAI ? 'linear-gradient(135deg, #1a3a30, #0f2420)' : undefined
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2 justify-start">
              <div className="w-[14px]" />
              <div className="bg-[#23282D] border-[0.5px] border-[#3D494F] rounded-[16px_16px_16px_4px] px-3.5 py-3.5 max-w-[85%]">
                <div className="flex items-center gap-1.5 py-1 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-typing-dot-3" />
                </div>
              </div>
            </div>
          )}

          {/* Suggested Pills (shown only at onboarding state) */}
          {messages.length === 1 && !isLoading && (
            <div className="flex flex-col gap-2 pt-2 items-start pl-[22px]">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="bg-[#23282D] border-[0.5px] border-[#3D494F] text-[#C8B89A] hover:border-[#1D9E75] hover:text-[#EDE9DF] font-sans font-normal text-[12px] rounded-[20px] px-3.5 py-1.5 transition-all duration-200 cursor-pointer text-left w-fit shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#23282D] border-t border-[#3D494F]/40 p-4 flex items-center justify-between shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="bg-[#141618] border-[0.5px] border-[#3D494F] rounded-[50px] px-4 py-2.5 font-sans font-normal text-[13px] text-[#EDE9DF] placeholder-[#3D494F] focus:border-[#1D9E75] focus:outline-none w-[calc(100%-44px)] shrink-0 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="w-9 h-9 rounded-full bg-[#1D9E75] hover:scale-[1.05] active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2 border-none outline-none"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4 text-white fill-white" />
          </button>
        </form>
      </div>

      {/* ── FLOATING CHAT BUTTON ── */}
      <div className={`fixed bottom-[28px] right-[28px] z-[10000] group flex items-center select-none ${isOpen ? 'max-md:hidden' : ''}`}>
        {/* Hover Tooltip */}
        <div className="absolute right-[68px] top-1/2 -translate-y-1/2 bg-[#23282D] text-[#EDE9DF] border border-[#3D494F]/50 font-sans font-light text-[12px] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          Ask your Heritage Guide
        </div>

        {/* Pulse Ring (Fires once on first load) */}
        {showPulseRing && (
          <div className="absolute inset-0 rounded-full border border-[#1D9E75] animate-ring-pulse pointer-events-none" />
        )}

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : handleOpenChat())}
          className="w-[56px] h-[56px] rounded-full flex items-center justify-center cursor-pointer hover:scale-[1.08] active:scale-95 transition-all duration-200 ease-out border-none outline-none"
          style={{
            background: 'linear-gradient(135deg, #1D9E75, #15705A)',
            boxShadow: isOpen
              ? '0 8px 32px rgba(29,158,117,0.6)'
              : '0 8px 24px rgba(29,158,117,0.4)'
          }}
          aria-label="Toggle AI Heritage Guide Chat"
        >
          {isOpen ? (
            <X className="w-[22px] h-[22px] text-white" />
          ) : (
            <MessageSquare className="w-[22px] h-[22px] text-white fill-white" />
          )}
        </button>
      </div>
    </>
  );
}
