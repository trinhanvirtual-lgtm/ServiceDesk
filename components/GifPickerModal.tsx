import React, { useState, useEffect, useCallback } from 'react';
import { SearchIcon, XIcon } from './icons';

const GIPHY_API_KEY = 'g3d4_public_beta_key'; // Public demo key
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

interface Gif {
  id: string;
  images: {
    fixed_width: {
      url: string;
      webp: string;
    };
  };
  title: string;
}

interface GifPickerModalProps {
  onClose: () => void;
  onSelectGif: (url: string) => void;
}

const GifPickerModal: React.FC<GifPickerModalProps> = ({ onClose, onSelectGif }) => {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifs = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    const endpoint = query
      ? `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24`
      : `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=24`;
    
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch GIFs from GIPHY.');
      }
      const json = await response.json();
      setGifs(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs(''); // Fetch trending on initial load
  }, [fetchGifs]);
  
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchGifs(searchTerm);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true">
        <div className="absolute inset-0" onClick={onClose}></div>
        <div className="relative w-full max-w-2xl h-[80vh] max-h-[600px] bg-[--color-surface-tertiary] rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
            <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-text-subtle]" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for GIFs"
                        className="w-full bg-[--color-surface-primary] border border-transparent focus:bg-[--color-surface-secondary] focus:border-[--color-accent-400] focus:ring-0 focus:outline-none placeholder:text-[--color-text-subtle] text-[--color-text-primary] rounded-full py-2 pl-10 pr-4 transition-all"
                    />
                </form>
                <button onClick={onClose} className="p-2 ml-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]" aria-label="Close">
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-t-transparent border-[--color-accent-500] rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="flex justify-center items-center h-full text-[--color-destructive-fg]">{error}</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {gifs.map(gif => (
                            <button
                                key={gif.id}
                                onClick={() => onSelectGif(gif.images.fixed_width.url)}
                                className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] dark:focus:ring-offset-slate-800"
                            >
                                <img src={gif.images.fixed_width.webp || gif.images.fixed_width.url} alt={gif.title} className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <footer className="p-2 text-center text-xs text-[--color-text-subtle] shrink-0">
                Powered by GIPHY
            </footer>
        </div>
    </div>
  );
};

export default GifPickerModal;