'use client';

import { SearchResult } from '@/app/api/search-templates/route';
import { categoryIconMap } from '@/constants/categories-with-icons';
import {
    Baby,
    Car,
    FileText,
    Folder,
    FolderOpen,
    Home,
    Laptop,
    PawPrint,
    Search as SearchIcon,
    Wrench
} from 'lucide-react';

interface SuggestionListProps {
  results: SearchResult[];
  isOpen: boolean;
  onSelect: (result: SearchResult) => void;
  selectedIndex: number;
  query: string;
  isLoading: boolean;
}

export default function SuggestionList({
  results,
  isOpen,
  onSelect,
  selectedIndex,
  query,
  isLoading,
}: SuggestionListProps) {
  // Accessibility: ensure listbox has unique id prefix
  const listboxId = 'hero-search-listbox';
  // Get icon component for result
  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'template':
        return FileText;
      case 'category':
        return Folder;
      case 'subcategory':
        return FolderOpen;
      default:
        return SearchIcon;
    }
  };

  // Get category-specific icon based on slug/name
  const getCategoryIcon = (result: SearchResult) => {
    if (result.type === 'category' || result.type === 'subcategory') {
      // Try to find icon from categoryIconMap first
      const slug = result.name.toLowerCase().replace(/\s+/g, '');
      if (categoryIconMap[slug]) {
        return categoryIconMap[slug];
      }
      
      // Fallback to manual mapping for common categories
      const name = result.name.toLowerCase();
      if (name.includes('laste') || name.includes('baby') || name.includes('hoito')) {
        return Baby;
      } else if (name.includes('koira') || name.includes('kissa') || name.includes('eläin') || name.includes('pet')) {
        return PawPrint;
      } else if (name.includes('auto') || name.includes('car') || name.includes('muutto')) {
        return Car;
      } else if (name.includes('koti') || name.includes('siivous') || name.includes('home') || name.includes('clean')) {
        return Home;
      } else if (name.includes('tietokone') || name.includes('tekniikka') || name.includes('computer') || name.includes('tech')) {
        return Laptop;
      } else if (name.includes('korjaus') || name.includes('asennus') || name.includes('repair')) {
        return Wrench;
      }
    }
    return getResultIcon(result);
  };

  // Get result type label
  const getTypeLabel = (result: SearchResult) => {
    switch (result.type) {
      case 'template':
        return 'Valmis pohja';
      case 'category':
        return 'Kategoria';
      case 'subcategory':
        return 'Alakategoria';
      default:
        return '';
    }
  };

  // Get type color
  const getTypeColor = (result: SearchResult) => {
    switch (result.type) {
      case 'template':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'category':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'subcategory':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-6 text-center" style={{ zIndex: 41 }} role="status" aria-live="polite">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
          <div
            className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="w-4 h-4 bg-blue-400 rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
        <p className="text-gray-500 mt-2">Haetaan tuloksia...</p>
      </div>
    );
  }

  // No results
  if (query.length >= 2 && results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-6 text-center" style={{ zIndex: 41 }}>
        <div className="text-gray-400 mb-3">
          <SearchIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 font-medium mb-2">
          Ei tuloksia haulle "{query}"
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Kokeile eri hakusanoja tai selaa kategorioita alta
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Suosittuja hakuja:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Lastenhoito</span>
            <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium">Siivous</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">Muuttoapu</span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">Koiran ulkoilutus</span>
          </div>
        </div>
      </div>
    );
  }

  // Results list
  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto backdrop-blur-sm"
      role="listbox"
      id={listboxId}
      style={{ 
        isolation: 'isolate', 
        zIndex: 41, 
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0
      }}
    >
      {results.map((result, index) => {
        const IconComponent = getCategoryIcon(result);
        return (
          <div
            key={`${result.type}-${result.id}`}
            id={`search-result-${index}`}
            className={`flex items-center space-x-4 p-4 hover:bg-blue-50 cursor-pointer transition-all duration-150 border-b border-gray-100 last:border-b-0 ${
              selectedIndex === index ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : ''
            }`}
            onClick={() => onSelect(result)}
            role="option"
            aria-selected={selectedIndex === index}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                result.type === 'template' 
                  ? 'bg-sky-100 text-sky-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900 truncate">
                  {result.name}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(result)}`}>
                  {getTypeLabel(result)}
                </span>
              </div>
              
              {result.description && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {result.description}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Footer with navigation tips */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">↑↓</kbd>
              <span className="font-medium">Navigoi</span>
            </span>
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Enter</kbd>
              <span className="font-medium">Valitse</span>
            </span>
          </div>
          <span className="text-gray-500 font-medium">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm mr-1">ESC</kbd>
            sulkee
          </span>
        </div>
      </div>
    </div>
  );
}