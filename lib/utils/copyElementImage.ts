/**
 * Capture a live element the way the browser paints it, including the admin
 * fonts and spacing, then copy that image.
 */

import { toCanvas, toBlob } from 'html-to-image';

function captureOptions(source: HTMLElement) {
  return {
    pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
    backgroundColor: getComputedStyle(source).backgroundColor || '#fffcfa',
    preferredFontFormat: 'woff2',
    filter: (domNode: HTMLElement) => {
      if (!(domNode instanceof HTMLElement)) return true;
      return !domNode.hasAttribute('data-html2canvas-ignore');
    },
  };
}

export async function renderElementToCanvas(source: HTMLElement): Promise<HTMLCanvasElement> {
  return toCanvas(source, captureOptions(source));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type CopyImageResult = 'copied' | 'shared' | 'downloaded';

async function deliverImage(blob: Blob, filename: string): Promise<CopyImageResult> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return 'shared';
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return 'shared';
    }
  }
  downloadBlob(blob, filename);
  return 'downloaded';
}

/**
 * Call this directly from a click handler. The image is built inside the
 * clipboard promise so the browser still treats the write as a user action.
 */
export function copyElementAsImage(source: HTMLElement, downloadName = 'image.png'): Promise<CopyImageResult> {
  const blobPromise = toBlob(source, captureOptions(source)).then((blob) => {
    if (!blob) throw new Error('Could not create image');
    return blob;
  });

  const writeImage = async () => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('clipboard-unavailable');
    }
    const ClipboardItemWithPromise = ClipboardItem as unknown as new (
      items: Record<string, Blob | Promise<Blob>>
    ) => ClipboardItem;
    await navigator.clipboard.write([
      new ClipboardItemWithPromise({ 'image/png': blobPromise }),
    ]);
  };

  return writeImage().then(
    () => 'copied' as const,
    async (error: unknown) => {
      const blob = await blobPromise.catch(() => null);
      if (!blob) throw error;
      return deliverImage(blob, downloadName);
    }
  );
}
