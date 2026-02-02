import React from 'react';

interface Action {
  label: string;
  icon: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

interface ActionDropdownProps {
  actions: Action[];
  buttonClassName?: string;
}

export default function ActionDropdown({ actions, buttonClassName = '' }: ActionDropdownProps) {
  return (
    <div className="dropdown">
      <button
        className={`btn btn-sm btn-outline-secondary dropdown-toggle ${buttonClassName}`}
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-three-dots-vertical"></i>
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        {actions.map((action, index) => (
          <li key={index}>
            <button
              className={`dropdown-item ${action.variant === 'danger' ? 'text-danger' : ''}`}
              onClick={action.onClick}
            >
              <i className={`bi ${action.icon} me-2`}></i>
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
