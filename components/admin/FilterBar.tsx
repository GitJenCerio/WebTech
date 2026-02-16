import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'date';
    options?: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
  }>;
  className?: string;
}

export default function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  className = '',
}: FilterBarProps) {
  return (
    <Card className={`mb-4 filter-bar ${className}`}>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {searchPlaceholder && (
            <div className="space-y-2">
              <Label htmlFor="searchInput">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  id="searchInput"
                  className="pl-10"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            </div>
          )}

          {filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <Label htmlFor={filter.key}>{filter.label}</Label>
              {filter.type === 'select' ? (
                <Select
                  value={filter.value || '__all__'}
                  onValueChange={(value) => filter.onChange?.(value === '__all__' ? '' : value)}
                >
                  <SelectTrigger id={filter.key}>
                    <SelectValue placeholder={`All ${filter.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All {filter.label}</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="date"
                  id={filter.key}
                  value={filter.value || ''}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
