'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
    CalendarIcon,
    Grid,
    List,
    Search,
    SlidersHorizontal,
    X
} from 'lucide-react';
import { useState } from 'react';

interface TaskFilterBarProps {
  // View controls
  viewMode: 'table' | 'grid' | 'mobile';
  onViewModeChange: (mode: 'table' | 'grid' | 'mobile') => void;
  
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Filters
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  
  sortOption: string;
  onSortOptionChange: (option: string) => void;
  
  // Advanced filters
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  
  budgetRange?: { min?: number; max?: number };
  onBudgetRangeChange?: (range: { min?: number; max?: number }) => void;
  
  // Activity filters
  hasOffers?: boolean;
  onHasOffersChange?: (hasOffers: boolean) => void;
  
  hasMessages?: boolean;
  onHasMessagesChange?: (hasMessages: boolean) => void;
  
  // Active filter management
  activeFilters: number;
  onClearAllFilters: () => void;
}

const statusOptions = [
  { value: 'all', label: 'Kaikki tehtävät' },
  { value: 'in-progress', label: 'Meneillään' },
  { value: 'open', label: 'Avoimet' },
  { value: 'paid', label: 'Maksetut' },
  { value: 'in_progress', label: 'Työn alla' },
  { value: 'completed', label: 'Valmiit' },
  { value: 'cancelled', label: 'Perutut' },
  { value: 'disputed', label: 'Riitautetut' },
];

const sortOptions = [
  { value: 'newest', label: 'Uusin ensin' },
  { value: 'oldest', label: 'Vanhin ensin' },
  { value: 'budget-high', label: 'Korkein budjetti' },
  { value: 'budget-low', label: 'Matalin budjetti' },
  { value: 'most-offers', label: 'Eniten tarjouksia' },
  { value: 'scheduled-soon', label: 'Ajoitettu pian' },
];

const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
  dateRange,
  onDateRangeChange,
  budgetRange,
  onBudgetRangeChange,
  hasOffers,
  onHasOffersChange,
  hasMessages,
  onHasMessagesChange,
  activeFilters,
  onClearAllFilters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <div className="space-y-24">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hae tehtäviä..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('table')}
            className="flex items-center gap-1 h-8"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Taulukko</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="flex items-center gap-1 h-8"
          >
            <Grid className="h-4 w-4" />
            <span className="hidden sm:inline">Ruudukko</span>
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Suodattimet
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(({ value, label }) => (
          <Label
            key={value}
            htmlFor={`status-${value}`}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
              statusFilter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent hover:bg-accent'
            }`}
          >
            <RadioGroup value={statusFilter} onValueChange={onStatusFilterChange}>
              <RadioGroupItem
                value={value}
                id={`status-${value}`}
                className="sr-only"
              />
            </RadioGroup>
            <span className="text-sm">{label}</span>
          </Label>
        ))}
      </div>

      {/* Active Filters Display */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Aktiiviset suodattimet:</span>
          
          {hasOffers && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tarjouksia
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => onHasOffersChange?.(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {hasMessages && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Viestejä
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => onHasMessagesChange?.(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {dateRange?.from && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Päivämäärä: {format(dateRange.from, 'dd.MM.yyyy', { locale: fi })}
              {dateRange.to && ` - ${format(dateRange.to, 'dd.MM.yyyy', { locale: fi })}`}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => onDateRangeChange?.({ from: undefined, to: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(budgetRange?.min || budgetRange?.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Budjetti: {budgetRange.min || 0}€ - {budgetRange.max || '∞'}€
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => onBudgetRangeChange?.({ min: undefined, max: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Tyhjennä kaikki
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 bg-gray-50/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort Option */}
            <div className="space-y-2">
              <Label htmlFor="sort-select" className="text-sm font-medium">
                Järjestys
              </Label>
              <Select value={sortOption} onValueChange={onSortOptionChange}>
                <SelectTrigger id="sort-select">
                  <SelectValue placeholder="Valitse järjestys" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Päivämääräväli</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd.MM.yy', { locale: fi })} -{' '}
                          {format(dateRange.to, 'dd.MM.yy', { locale: fi })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd.MM.yyyy', { locale: fi })
                      )
                    ) : (
                      'Valitse päivät'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange?.from ? { from: dateRange.from, to: dateRange.to || undefined } as any : undefined}
                    onSelect={(range) => {
                      onDateRangeChange?.(range || { from: undefined, to: undefined });
                      if (range?.from && range?.to) {
                        setDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Budjetti (€)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={budgetRange?.min || ''}
                  onChange={(e) =>
                    onBudgetRangeChange?.({
                      ...budgetRange,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={budgetRange?.max || ''}
                  onChange={(e) =>
                    onBudgetRangeChange?.({
                      ...budgetRange,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Activity Filters */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Aktiviteetti</Label>
              <div className="space-y-2">
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOffers || false}
                    onChange={(e) => onHasOffersChange?.(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Sisältää tarjouksia</span>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMessages || false}
                    onChange={(e) => onHasMessagesChange?.(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Sisältää viestejä</span>
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilterBar;
