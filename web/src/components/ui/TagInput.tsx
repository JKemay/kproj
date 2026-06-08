'use client';

import { useRef, useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ tags, onChange, placeholder = 'Add tag…', suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-');

  const addTag = (raw: string) => {
    const tag = normalise(raw);
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    onChange([...tags, tag]);
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const filteredSuggestions = input.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(normalise(s)))
    : [];

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-sm border px-2.5 py-1.5 transition-colors cursor-text ${
          focused ? 'border-[#c084fc]/60 ring-1 ring-[#c084fc]' : 'border-white/8 bg-[#111111]'
        } bg-[#111111]`}
      >
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-[2px] bg-[#c084fc]/15 border border-[#c084fc]/25 px-2 py-0.5 text-[11px] text-[#c084fc] leading-none"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="ml-0.5 text-[#c084fc]/60 hover:text-[#c084fc] transition-colors focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l6 6M7 1L1 7" />
              </svg>
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-[#f0f0f0] placeholder:text-[#404040] focus:outline-none"
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-sm border border-white/8 bg-[#141414] shadow-xl overflow-hidden">
          {filteredSuggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className="flex w-full items-center px-3 py-2 text-sm text-[#a0a0a0] hover:text-[#f0f0f0] hover:bg-white/[0.04] transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-[10px] text-[#383838]">Enter or comma to add · Backspace to remove last</p>
    </div>
  );
}
