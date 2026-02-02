import React from 'react';

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
    <div className={`card mb-4 filter-bar ${className}`}>
      <div className="card-body">
        <div className="row g-3" style={{ margin: 0 }}>
          {searchPlaceholder && (
            <div className="col-12 col-md-4">
              <label htmlFor="searchInput" className="form-label">
                Search
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control border-start-0"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            </div>
          )}

          {filters.map((filter) => (
            <div key={filter.key} className="col-12 col-md-4">
              <label htmlFor={filter.key} className="form-label">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  id={filter.key}
                  className="form-select"
                  value={filter.value || ''}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                >
                  <option value="">All {filter.label}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  id={filter.key}
                  className="form-control"
                  value={filter.value || ''}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
