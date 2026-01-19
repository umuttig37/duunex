'use client';

import { SearchResult } from '@/app/api/search-templates/route';
import { useAuth } from '@/components/shared/providers/query-provider';
import { Input } from '@/components/ui/input';
import { trackEvent } from '@/services/notifications/analytics';
import { Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import SuggestionList from './suggestion-list';

interface HeroSearchBarProps {
  placeholder?: string;
  className?: string;
  onSelect?: (result: SearchResult) => void;
  /** Visual style variant. 'default' = legacy gradient hero styling, 'clean' = new minimalist pill style */
  variant?: 'default' | 'clean';
}

export default function HeroSearchBar({
  placeholder = 'Mitä tarvitset? Esim. lastenhoito, koiran ulkoilutus, siivous...',
  className = '',
  onSelect,
  variant = 'default',
}: HeroSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [defaultSuggestions, setDefaultSuggestions] = useState<SearchResult[]>(
    []
  );
  // UI state for internal interactions

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { user } = useAuth();

  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch default suggestions on component mount
  useEffect(() => {
    const fetchDefaultSuggestions = async () => {
      try {
        // Fetch popular templates and categories without a query
        const response = await fetch(
          '/api/search-templates?popular=true&limit=6'
        );
        if (response.ok) {
          const data = await response.json();
          setDefaultSuggestions(data.results || []);
        }
      } catch (error) {
        console.error('Error fetching default suggestions:', error);
      }
    };

    fetchDefaultSuggestions();
  }, []);

  const searchTemplates = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        // If no query, show default suggestions instead of clearing
        setResults(defaultSuggestions);
        setIsOpen(defaultSuggestions.length > 0);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search-templates?q=${encodeURIComponent(searchQuery)}&limit=8`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(data.results?.length > 0);
        } else {
          console.error('Search failed:', response.statusText);
          setResults(defaultSuggestions);
          setIsOpen(defaultSuggestions.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults(defaultSuggestions);
        setIsOpen(defaultSuggestions.length > 0);
      } finally {
        setIsLoading(false);
      }
    },
    [defaultSuggestions]
  );

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchTemplates(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
          trackEvent('hero_search_submit', { queryLength: query.length, via: 'keyboard' });
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else {
      // Default behavior: navigate to task creation with template/category
      let targetUrl = '/dashboard/tasks/new';

      if (result.type === 'template') {
        targetUrl += `?template=${result.id}`;
      } else if (result.type === 'category' || result.type === 'subcategory') {
        // Use the category ID instead of name to ensure accurate matching
        targetUrl += `?categoryId=${result.id}`;
      }

      // If user is not authenticated, they'll go through visitor flow
      if (user) {
        router.push(targetUrl);
      } else {
        // For visitors, save the intended destination and start task creation
        router.push(targetUrl);
      }
    }

    // Close dropdown and clear search
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const inputBaseClasses =
    'w-full text-lg md:text-xl transition-colors placeholder:text-gray-500 focus:outline-none';
  const variantClasses =
    variant === 'clean'
      ? 'pl-14 pr-36 py-6 md:py-7 rounded-full border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white shadow-lg'
      : 'pl-12 pr-12 py-4 text-lg rounded-2xl border-2 border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 bg-white/95 backdrop-blur-sm shadow-xl';
  return (
    <div
      ref={searchRef}
      className={`relative w-full mx-auto ${className}`}
      style={{ isolation: 'isolate', zIndex: 40, position: 'relative' }}
    >
      {/* Search Input (with optional action button for clean variant) */}
      <div className={`relative ${variant === 'clean' ? 'group' : ''}`}>
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() === '') {
              setResults(defaultSuggestions);
              setIsOpen(defaultSuggestions.length > 0);
            } else if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`${inputBaseClasses} ${variantClasses}`}
          aria-label="Hae tehtäväpohjia"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-activedescendant={
            selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
          }
          aria-controls="hero-search-listbox"
        />
        {variant === 'clean' && (
          <button
            type="button"
            onClick={() => {
              if (query.trim().length >= 2) {
                searchTemplates(query);
                trackEvent('hero_search_submit', { queryLength: query.length, via: 'button' });
              } else {
                setResults(defaultSuggestions);
                setIsOpen(defaultSuggestions.length > 0);
              }
            }}
            className="absolute top-1/2 -translate-y-1/2 right-2 md:right-2 h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm md:text-base shadow-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-colors"
            aria-label="Hae"
          >
            Hae
          </button>
        )}
        {isLoading && variant !== 'clean' && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 animate-spin" />
        )}
        {isLoading && variant === 'clean' && (
          <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 animate-spin" />
        )}
      </div>

      {/* Category badges intentionally removed to emphasize the professional category grid */}

      <SuggestionList
        results={results}
        isOpen={isOpen}
        onSelect={handleSelect}
        selectedIndex={selectedIndex}
        query={query}
        isLoading={isLoading}
      />
    </div>
  );
}