'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWatchPartyStore, type AIMessage } from '@/lib/hooks/useWatchPartyStore';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { AI_MODELS } from '@/lib/constants';
import type { AIModel } from '@/types';

interface AIChatPanelProps {
  watchPartyId: string;
  videoTitle?: string;
}

export function AIChatPanel({ watchPartyId, videoTitle }: AIChatPanelProps) {
  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const {
    aiMessages,
    aiLoading,
    aiModel,
    addAIMessage,
    setAILoading,
    setAIModel,
    clearAIMessages,
  } = useWatchPartyStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || aiLoading) return;

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMsg);
    setInput('');
    setAILoading(true);

    try {
      const res = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          model: aiModel,
          context: {
            watchPartyId,
            videoTitle,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: AIMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date().toISOString(),
        };
        addAIMessage(assistantMsg);
      } else {
        const errorMsg: AIMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        };
        addAIMessage(errorMsg);
      }
    } catch {
      const errorMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I could not connect to the AI service. Please try again.',
        timestamp: new Date().toISOString(),
      };
      addAIMessage(errorMsg);
    } finally {
      setAILoading(false);
    }
  }

  const selectedModel = AI_MODELS.find((m) => m.id === aiModel);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-white/5 flex flex-col max-h-[400px]"
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Model picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              {selectedModel?.name || 'GPT-4o'}
              <ChevronDown size={10} />
            </button>
            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1 bg-dark-600 border border-white/10 rounded-lg shadow-xl z-50 min-w-[180px]">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setAIModel(model.id as AIModel);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      aiModel === model.id ? 'text-gold' : 'text-white/70'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-white/30 text-[10px]">{model.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={clearAIMessages}
            className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 min-h-[100px] max-h-[280px]">
        {aiMessages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-white/30">
              Ask me about the video, request trivia, or start a discussion topic!
            </p>
          </div>
        ) : (
          aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-purple-500/20 text-white/90'
                    : 'bg-white/5 text-white/70'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mb-1">
                    <Brain size={10} className="text-gold" />
                    <span className="text-[10px] font-semibold text-gold">SeeWhy AI</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {aiLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50">
              <div className="flex items-center gap-1 mb-1">
                <Brain size={10} className="text-gold" />
                <span className="text-[10px] font-semibold text-gold">SeeWhy AI</span>
              </div>
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 pt-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            disabled={aiLoading}
            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold/40 disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!input.trim() || aiLoading}
            className="!px-2"
          >
            <Send size={12} />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
