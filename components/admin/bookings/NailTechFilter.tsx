'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface NailTech {
  id: string;
  name: string;
  role?: string;
}

interface NailTechFilterProps {
  nailTechs: NailTech[];
  selectedTechId: string;
  onTechChange: (techId: string) => void;
  showAllOption?: boolean;
  className?: string;
}

export default function NailTechFilter({
  nailTechs,
  selectedTechId,
  onTechChange,
  showAllOption = true,
  className = '',
}: NailTechFilterProps) {
  return (
    <div className={className}>
      <label htmlFor="nailTechFilter" className="form-label fw-semibold">
        Filter by Nail Tech
      </label>
      <Select value={selectedTechId} onValueChange={onTechChange}>
        <SelectTrigger id="nailTechFilter" className="h-9">
          <SelectValue placeholder="All Nail Techs" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && <SelectItem value="all">All Nail Techs</SelectItem>}
          {nailTechs.map((tech) => (
            <SelectItem key={tech.id} value={tech.id}>
              {tech.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
