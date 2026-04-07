import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Sliders, X, DollarSign, Users, ArrowDownUp, Filter, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';

export interface FilterOptions {
  selectedGenres: string[];
  minCost: number;
  maxCost: number;
  ticketCount: number;
  jointBudget: number;
  sortBy: 'vibe' | 'cost_low' | 'cost_high' | 'date';
  dateRange: 'all' | 'week' | 'month' | '3months';
  distance: number; // in miles
}

interface ConcertFiltersProps {
  availableGenres: string[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  concertCount: number;
  filteredCount: number;
}

export function ConcertFilters({ 
  availableGenres, 
  filters, 
  onFilterChange,
  concertCount,
  filteredCount
}: ConcertFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const toggleGenre = (genre: string) => {
    const newGenres = filters.selectedGenres.includes(genre)
      ? filters.selectedGenres.filter(g => g !== genre)
      : [...filters.selectedGenres, genre];
    
    onFilterChange({ ...filters, selectedGenres: newGenres });
  };

  const clearFilters = () => {
    onFilterChange({
      selectedGenres: [],
      minCost: 0,
      maxCost: 1000,
      ticketCount: 1,
      jointBudget: 0,
      sortBy: 'date',
      dateRange: 'all',
      distance: 25
    });
  };

  const hasActiveFilters = 
    filters.selectedGenres.length > 0 || 
    filters.minCost > 0 || 
    filters.maxCost < 1000 || 
    filters.ticketCount > 1 || 
    filters.jointBudget > 0 ||
    filters.dateRange !== 'all' ||
    filters.distance > 0;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
        >
          <Sliders className="w-5 h-5" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
              {filteredCount} / {concertCount}
            </Badge>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <Card className="p-6 space-y-6 bg-gradient-to-br from-orange-50/50 to-amber-50/50 border-orange-200 backdrop-blur-sm">
          {/* Date Range Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => onFilterChange({ ...filters, dateRange: value as FilterOptions['dateRange'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Upcoming Events</SelectItem>
                <SelectItem value="week">Next 7 Days</SelectItem>
                <SelectItem value="month">Next 30 Days</SelectItem>
                <SelectItem value="3months">Next 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distance Filter */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Search Radius
            </Label>
            <Select 
              value={filters.distance.toString()} 
              onValueChange={(value) => onFilterChange({ ...filters, distance: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Distances</SelectItem>
                <SelectItem value="10">Within 10 miles</SelectItem>
                <SelectItem value="25">Within 25 miles</SelectItem>
                <SelectItem value="50">Within 50 miles</SelectItem>
                <SelectItem value="100">Within 100 miles</SelectItem>
                <SelectItem value="150">Within 150 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" />
                Filter by Genre
                {filters.selectedGenres.length > 0 && (
                  <span className="text-xs text-gray-500">({filters.selectedGenres.length} selected)</span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => {
                  const isSelected = filters.selectedGenres.includes(genre);
                  return (
                    <Badge
                      key={genre}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'hover:bg-orange-50'
                      }`}
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                      {isSelected && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-cost">Min Price ($)</Label>
              <Input
                id="min-cost"
                type="number"
                min="0"
                value={filters.minCost}
                onChange={(e) => onFilterChange({ ...filters, minCost: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="max-cost">Max Price ($)</Label>
              <Input
                id="max-cost"
                type="number"
                min="0"
                value={filters.maxCost === 1000 ? '' : filters.maxCost}
                onChange={(e) => onFilterChange({ ...filters, maxCost: parseFloat(e.target.value) || 1000 })}
                placeholder="No limit"
              />
            </div>
          </div>

          {/* Joint Budget Calculator */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              Group Budget Calculator
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-count" className="text-xs text-gray-600">
                  Number of Tickets
                </Label>
                <Input
                  id="ticket-count"
                  type="number"
                  min="1"
                  value={filters.ticketCount}
                  onChange={(e) => onFilterChange({ ...filters, ticketCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="joint-budget" className="text-xs text-gray-600">
                  Total Budget ($)
                </Label>
                <Input
                  id="joint-budget"
                  type="number"
                  min="0"
                  value={filters.jointBudget === 0 ? '' : filters.jointBudget}
                  onChange={(e) => onFilterChange({ ...filters, jointBudget: parseFloat(e.target.value) || 0 })}
                  placeholder="Optional"
                />
              </div>
            </div>
            {filters.ticketCount > 1 && (
              <p className="text-xs text-gray-600 mt-2">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Showing concerts where {filters.ticketCount} tickets fit
                {filters.jointBudget > 0 && ` within $${filters.jointBudget} budget`}
              </p>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-white rounded-lg p-4 border-l-4 border-orange-600">
              <p className="text-sm font-semibold mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {filters.selectedGenres.length > 0 && (
                  <Badge variant="outline" className="bg-orange-50">
                    {filters.selectedGenres.length} genre{filters.selectedGenres.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {filters.minCost > 0 && (
                  <Badge variant="outline" className="bg-orange-50">
                    Min: ${filters.minCost}
                  </Badge>
                )}
                {filters.maxCost < 1000 && (
                  <Badge variant="outline" className="bg-orange-50">
                    Max: ${filters.maxCost}
                  </Badge>
                )}
                {filters.ticketCount > 1 && (
                  <Badge variant="outline" className="bg-orange-50">
                    {filters.ticketCount} tickets
                  </Badge>
                )}
                {filters.jointBudget > 0 && (
                  <Badge variant="outline" className="bg-orange-50">
                    Budget: ${filters.jointBudget}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}