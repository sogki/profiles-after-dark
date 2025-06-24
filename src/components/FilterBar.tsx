import React from 'react';
import { Filter, Grid, List } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalItems: number;
}

const categories = [
  { id: 'all', label: 'All Platforms', color: 'text-white' },
  { id: 'discord', label: 'Discord', color: 'text-indigo-400' },
  { id: 'twitter', label: 'Twitter', color: 'text-blue-400' },
  { id: 'instagram', label: 'Instagram', color: 'text-pink-400' },
  { id: 'general', label: 'General', color: 'text-purple-400' },
];

const types = [
  { id: 'all', label: 'All Types' },
  { id: 'profile', label: 'Profile Pictures' },
  { id: 'banner', label: 'Banners' },
];

export default function FilterBar({
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  viewMode,
  onViewModeChange,
  totalItems,
}: FilterBarProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border-y border-slate-700/50 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Categories */}
            <div className="flex items-center space-x-3">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Types */}
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onTypeChange(type.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedType === type.id
                      ? 'bg-gray-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* View controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}