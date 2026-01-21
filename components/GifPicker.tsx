import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KlipyMedia } from '../services/klipyService';
import { getTrendingGifs, searchGifs } from '../services/klipyService';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<KlipyMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      const data = query.trim()
        ? await searchGifs(query.trim(), 30)
        : await getTrendingGifs(30);
      if (!cancelled) {
        setItems(data);
        setIsLoading(false);
        if (!data.length && !query.trim()) {
          setError('No GIFs available right now.');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0b141a] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <span className="font-bold text-sm sm:text-base">GIFs</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          ✕
        </button>
      </div>

      <div className="p-3 bg-[#0b141a] border-b border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white text-sm outline-none border border-white/10 focus:border-green-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-[#050b10] p-3">
        {isLoading && (
          <div className="text-center text-slate-400 text-sm py-8">
            Loading GIFs...
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center text-slate-400 text-sm py-8">
            {error}
          </div>
        )}
        {!isLoading && !error && !items.length && (
          <div className="text-center text-slate-400 text-sm py-8">
            No GIFs found.
          </div>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.fullUrl);
                onClose();
              }}
              className="relative group rounded-lg overflow-hidden bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <img
                src={item.previewUrl}
                alt="GIF"
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default GifPicker;

