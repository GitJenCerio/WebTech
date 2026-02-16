import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

function ModalRoot({ isOpen, onClose, title, children, size = 'md', className = '' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div
        className={`
          relative z-50 w-full ${sizeClasses[size]}
          bg-white rounded-[24px] shadow-xl
          max-h-[90vh] overflow-hidden
          flex flex-col
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={`px-6 py-2 ${className}`}>
      {children}
    </div>
  );
}

function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`px-6 pt-2 pb-4 overflow-y-auto flex-1 ${className}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`px-6 pt-3 pb-4 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
