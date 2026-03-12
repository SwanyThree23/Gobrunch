'use client';

/**
 * TranslationToggle - Language selector for multilingual chat
 * Supports 20+ languages with auto-detection
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SupportedLanguage, TranslationConfig } from '@/types';

interface TranslationToggleProps {
  config: TranslationConfig;
  onConfigChange: (config: Partial<TranslationConfig>) => void;
  languages: { code: SupportedLanguage; name: string }[];
}

export function TranslationToggle({ config, onConfigChange, languages }: TranslationToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          config.enabled
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-white/5 text-white/50 hover:bg-white/10'
        }`}
        title="Translation settings"
      >
        🌐 {config.enabled ? config.targetLanguages.length : 'Off'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="absolute bottom-full mb-2 right-0 w-64 bg-gray-900 rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Auto-Translate</span>
                <button
                  onClick={() => onConfigChange({ enabled: !config.enabled })}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    config.enabled ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                    config.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={config.showOriginal}
                  onChange={() => onConfigChange({ showOriginal: !config.showOriginal })}
                  className="rounded border-white/20"
                />
                <span className="text-xs text-white/50">Show original message</span>
              </label>
            </div>

            <div className="p-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-white/40 mb-2">Translate to:</p>
              <div className="space-y-1">
                {languages.map(lang => {
                  const isSelected = config.targetLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        const updated = isSelected
                          ? config.targetLanguages.filter(l => l !== lang.code)
                          : [...config.targetLanguages, lang.code];
                        onConfigChange({ targetLanguages: updated });
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                        isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <span>{lang.name}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TranslationToggle;
