import React from 'react';

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
      <select
        id="nailTechFilter"
        className="form-select"
        value={selectedTechId}
        onChange={(e) => onTechChange(e.target.value)}
      >
        {showAllOption && <option value="all">All Nail Techs</option>}
        {nailTechs.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name} {tech.role ? `(${tech.role})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
