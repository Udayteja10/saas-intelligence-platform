import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, Sparkles, User, HelpCircle } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'ai', 
      text: "### 👋 Hello! I am your SubTrack AI Assistant.\n\nI have scanned your organization directory. Ask me any optimization or cash flow forecast questions to manage your SaaS portfolio." 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Exact suggested prompts from requirements
  const quickQuestions = [
    "How can we reduce costs?",
    "Show unused licenses.",
    "Analyze vendor risks.",
    "Forecast next quarter.",
    "Why is our SaaS Health Score low?"
  ];

  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/query', { query: textToSend });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: "⚠️ An error occurred processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Custom client-side markdown formatter to render headers, lists, and tables beautifully
  const parseMarkdown = (md: string) => {
    const lines = md.split('\n');
    let insideTable = false;
    let tableHeaders: string[] = [];
    const htmlElements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|')) {
        // Table row parsing
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (line.includes('---') || line.includes(':---')) {
          // Separator row, skip
          continue;
        }

        if (!insideTable) {
          insideTable = true;
          tableHeaders = cells;
          continue;
        }

        // Render standard rows
        const rowIndex = i;
        htmlElements.push(
          <div key={`table-row-${rowIndex}`} className="grid grid-cols-4 gap-2 text-xs border-b border-slate-200/50 dark:border-slate-800/60 py-2.5 px-2 bg-slate-500/5 hover:bg-slate-500/10">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={`${cIdx === 0 ? 'font-bold text-slate-850 dark:text-slate-200' : 'text-slate-550 dark:text-slate-400'}`}>
                {cell.replace(/\*\*/g, '').replace(/`/g, '')}
              </span>
            ))}
          </div>
        );
        continue;
      } else {
        if (insideTable) {
          insideTable = false;
          // Wrap headers at the top of the accumulated list
          const heads = tableHeaders;
          if (heads.length > 0) {
            htmlElements.splice(htmlElements.length - htmlElements.filter((e: any) => e && e.key && e.key.toString().startsWith('table-row')).length, 0, (
              <div key={`table-header-${i}`} className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 px-2 mt-4 mb-1">
                {heads.map((h, hIdx) => (
                  <span key={hIdx}>{h.replace(/\*\*/g, '').replace(/`/g, '')}</span>
                ))}
              </div>
            ));
          }
        }
      }

      if (line.startsWith('###')) {
        htmlElements.push(<h3 key={i} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-6 mb-2 tracking-wide flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> {line.replace('###', '').trim()}
        </h3>);
      } else if (line.startsWith('####')) {
        htmlElements.push(<h4 key={i} className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-4 mb-2">{line.replace('####', '').trim()}</h4>);
      } else if (line.startsWith('-') || line.startsWith('*')) {
        htmlElements.push(
          <li key={i} className="text-xs text-slate-650 dark:text-slate-300 ml-4 list-disc py-1 select-text">
            {parseInlineMarkdown(line.substring(1).trim())}
          </li>
        );
      } else if (line.startsWith('1.')) {
        htmlElements.push(
          <li key={i} className="text-xs text-slate-650 dark:text-slate-300 ml-4 list-decimal py-1 select-text">
            {parseInlineMarkdown(line.substring(2).trim())}
          </li>
        );
      } else if (line) {
        htmlElements.push(
          <p key={i} className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed py-1.5 select-text">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    }

    return htmlElements;
  };

  // Parses bold and inline code segments within table cells/bullets
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">{part.substring(2, part.length - 2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-indigo-650 dark:text-indigo-400">{part.substring(1, part.length - 1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between font-sans relative text-left">
      
      {/* Messaging Panel */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 p-5 rounded-2xl border transition-all ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white border-transparent ml-12 rounded-tr-none shadow-sm' 
                : 'bg-slate-100/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 mr-12 shadow-sm'
            }`}
          >
            {/* Sender Badge */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-white/10 text-white' 
                : 'bg-indigo-600 text-white'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
            </div>

            <div className="flex-1 space-y-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-455 dark:text-slate-500'
              }`}>
                {msg.sender === 'user' ? 'You' : 'SubTrack AI Analyst'}
              </span>
              <div className={msg.sender === 'user' ? 'text-white' : ''}>{parseMarkdown(msg.text)}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 p-5 mr-12 bg-slate-100/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-indigo-200" />
            </div>
            <div className="flex-1 space-y-2 py-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Thinking...</span>
              <div className="h-3 bg-slate-200 dark:bg-slate-900 rounded-full w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-900 rounded-full w-1/2" />
            </div>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Suggested Questions & Input */}
      <div className="mt-4 space-y-4">
        {/* Quick pills */}
        <div className="flex flex-wrap gap-2 py-2 items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5 mr-1">
            <HelpCircle className="w-4 h-4 text-slate-500" /> Suggestions:
          </span>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-900 pl-6 pr-20 py-5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            placeholder="Query spend optimization, forecasts, renewals, and duplicate tools..."
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            title="Send query"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
