'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/Dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ImageViewModalProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewModal({ src, alt = 'Image', open, onOpenChange }: ImageViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
        <VisuallyHidden.Root>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative flex items-center justify-center min-h-[50vh] max-h-[85vh] p-4">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
