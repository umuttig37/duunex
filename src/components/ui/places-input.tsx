'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, X } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
    country?: string;
  };
}

interface PlacesInputProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function PlacesInput({
  value,
  onChange,
  placeholder = "Osoite tai alue",
  className,
  disabled = false,
}: PlacesInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Search Nominatim when debounced value changes
  useEffect(() => {
    const searchAddress = async () => {
      if (debouncedSearch.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Nominatim API - free and open source
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: debouncedSearch,
            format: 'json',
            addressdetails: '1',
            limit: '5',
            countrycodes: 'fi', // Restrict to Finland
            'accept-language': 'fi',
          }),
          {
            headers: {
              'User-Agent': 'TaskMVP/1.0', // Required by Nominatim ToS
            },
          }
        );

        if (response.ok) {
          const data: NominatimResult[] = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Nominatim search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchAddress();
  }, [debouncedSearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Update parent without coordinates until selection
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = useCallback((suggestion: NominatimResult) => {
    const coordinates = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };
    
    // Format address nicely
    const formattedAddress = formatAddress(suggestion);
    
    setInputValue(formattedAddress);
    onChange(formattedAddress, coordinates);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onChange]);

  const formatAddress = (result: NominatimResult): string => {
    const addr = result.address;
    const parts: string[] = [];
    
    // Street address
    if (addr.road) {
      let street = addr.road;
      if (addr.house_number) {
        street += ' ' + addr.house_number;
      }
      parts.push(street);
    }
    
    // City
    const city = addr.city || addr.town || addr.village || addr.municipality;
    if (city) {
      if (addr.postcode) {
        parts.push(`${addr.postcode} ${city}`);
      } else {
        parts.push(city);
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : result.display_name.split(',').slice(0, 3).join(',');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
            "placeholder:text-gray-400 text-sm",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            className
          )}
          autoComplete="off"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0",
                index === selectedIndex && "bg-emerald-50"
              )}
            >
              <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {formatAddress(suggestion)}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {suggestion.display_name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && inputValue.length >= 3 && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
          Osoitetta ei löytynyt. Yritä tarkentaa hakua.
        </div>
      )}
    </div>
  );
}
