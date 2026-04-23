import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Sparkles, BookOpen, Atom, Wind, RefreshCw, Eraser } from 'lucide-react';
import { getCoachResponse } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'model',
  content: '你好，我是你的化学教练。二模的路上，你不是一个人。有什么迷茫的题目，或者觉得思维断层的地方，随时告诉我。\n\n我们可以一起探索这奇妙的微观世界。'
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const chatHistory = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await getCoachResponse(chatHistory);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: response,
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-10%] w-[35%] h-[35%] rounded-full bg-orange-50/50 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto min-h-screen flex flex-col p-4 md:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl shadow-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight">化学灵感笔记</h1>
              <p className="text-xs text-slate-400">微观重构 · 阶梯式启发</p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
            title="清空记录"
          >
            <Eraser size={20} />
          </button>
        </header>

        {/* Categories / Quick Actions */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {[
            { icon: Atom, label: '字母迷宫 (推断题)', prompt: '教练，我遇到一道推断题卡住了。' },
            { icon: Wind, label: '气流剧本 (实验题)', prompt: '教练，能帮我分析一下这个装置的气体流向吗？' },
            { icon: RefreshCw, label: '微观重构 (复分解)', prompt: '教练，复分解反应的沉淀条件我总是记不清。' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setInput(item.prompt)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all whitespace-nowrap"
            >
              <item.icon size={16} className="text-slate-400" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-8 pr-2 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "group flex flex-col",
                  m.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}
              >
                <div className={cn(
                  "max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap",
                  m.role === 'user' 
                    ? "bg-slate-900 text-slate-50 shadow-sm" 
                    : "bg-white border border-slate-100 shadow-sm text-slate-700"
                )}>
                  {m.role === 'model' ? (
                    <div className="prose prose-slate max-w-none prose-p:my-2 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
                <span className="mt-2 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.role === 'user' ? '探索者' : '教练'}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-slate-300 text-sm italic"
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span>教练正在构建逻辑阶梯...</span>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="mt-6 sticky bottom-0 bg-[#FDFDFD]/80 backdrop-blur-md pt-4 pb-8">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入你的困惑，或者上传题目图片..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 shadow-sm transition-all resize-none h-24 placeholder:text-slate-300"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-4 bottom-4 p-3 rounded-xl transition-all",
                input.trim() && !isLoading 
                  ? "bg-slate-900 text-white shadow-lg active:scale-95" 
                  : "bg-slate-50 text-slate-300"
              )}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-slate-300 italic">
            {'记得使用化学符号哦，例如 $\\text{O}_2$'}
          </p>
        </div>
      </div>
    </div>
  );
}
