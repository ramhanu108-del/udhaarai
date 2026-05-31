import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateAIResponse } from '../utils/aiAssistant';
import { ArrowLeft, Send, Sparkles, User, FileText, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { PremiumGate } from '../components/PremiumGate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: { label: string; actionType: string; payload?: any }[];
}

const SUGGESTIONS = [
  "Aaj ki sales kitni hui?",
  "Sabse zyada udhaar kis par hai?",
  "Kin customers ko reminder bhejna chahiye?",
  "Low stock items dikhao",
  "Is month profit estimate?",
  "Aaj ka business summary",
  "Kaunsa item zyada bik raha hai?",
  "Pending udhaar kitna hai?"
];

export const AIAssistant = () => {
  const navigate = useNavigate();
  const state = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: (state.customers.length === 0 && (!state.sales || state.sales.length === 0))
        ? "Namaste! Main aapka AI Business Assistant hoon. Pehle kuch sales/customer data add karein, phir main useful summary dunga."
        : "Namaste! Main aapka AI Business Assistant hoon. Apna sawaal poochho ya neeche diye questions try karein."
    }
  ]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate slight delay for AI response
    setTimeout(() => {
      const response = generateAIResponse(text, state);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.text,
        actions: response.actions
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  const handleAction = (action: any) => {
    if (action.actionType === 'navigate') {
      navigate(action.payload);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:bg-slate-50 p-2 rounded-full -ml-2 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
               <Sparkles className="w-5 h-5 text-indigo-600" />
               AI Assistant
            </h1>
            <p className="text-xs text-indigo-600/70 font-medium">Business ka hisaab samjho</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <PremiumGate featureName="AI Business Assistant">
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-1 px-4 py-4 pb-24 space-y-4">
             <div className="text-center pb-2 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                   Local AI Mode - Aapka data safe hai
                </span>
                <span onClick={() => navigate('/premium')} className="cursor-pointer text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                   <Sparkles className="w-3 h-3" />
                   AI Pro Coming Soon - Advanced Suggestions
                </span>
             </div>

             {messages.map(msg => (
               <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                  }`}>
                     {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                           <Sparkles className="w-3.5 h-3.5" />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Assistant</span>
                        </div>
                     )}
                     <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{msg.text}</p>
                     
                     {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                           {msg.actions.map((act, idx) => (
                             <button 
                               key={idx}
                               onClick={() => handleAction(act)}
                               className="w-full flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                             >
                                {act.label}
                                <ChevronRight className="w-3.5 h-3.5" />
                             </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Slider */}
          <div className="bg-white border-t border-slate-100 pt-3 pb-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
             <div className="flex overflow-x-auto scrollbar-hide pb-2 gap-2">
                {SUGGESTIONS.map((sug, i) => (
                   <button
                     key={i}
                     onClick={() => handleSend(sug)}
                     className="flex-shrink-0 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors"
                   >
                      {sug}
                   </button>
                ))}
             </div>
             
             <div className="flex gap-2 items-end mt-1">
                <Input 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(inputText); }}
                  placeholder="Apna sawaal poochho..."
                  className="bg-slate-50 border-slate-200 h-12 text-sm flex-1 font-medium"
                />
                <button 
                  onClick={() => handleSend(inputText)}
                  className="w-12 h-12 flex-shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-50"
                  disabled={!inputText.trim()}
                >
                   <Send className="w-5 h-5 ml-1" />
                </button>
             </div>
          </div>
        </div>
      </PremiumGate>
    </div>
  );
};
