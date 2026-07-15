'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

type MediaCategory = 'gallery' | 'service' | 'hero' | 'other';

type MediaAsset = {
  id: string;
  url: string;
  publicId: string;
  alt: string;
  title?: string;
  category: MediaCategory;
  refKey?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES: { value: MediaCategory; label: string; hint: string }[] = [
  { value: 'gallery', label: 'Gallery', hint: 'Photos shown in the website Gallery section' },
  { value: 'service', label: 'Services', hint: 'Images for service cards — set a Ref key to match a service' },
  { value: 'hero', label: 'Hero', hint: 'Homepage hero / banner imagery' },
  { value: 'other', label: 'Other', hint: 'General marketing assets' },
];

const SERVICE_REF_KEYS = [
  { value: 'service-1', label: 'Russian Manicure (Cleaning Only)' },
  { value: 'service-2', label: 'BIAB/Gel Overlay (No Extensions)' },
  { value: 'service-3', label: 'BIAB/Gel Overlay (With Extensions)' },
  { value: 'service-4', label: 'Nail Art' },
  { value: 'service-5', label: 'Russian Pedicure with Gel Overlay' },
  { value: 'service-6', label: 'Mani + Pedi Express' },
  { value: 'service-7', label: 'Nail Repair' },
];

export default function MediaManager() {
  const [category, setCategory] = useState<MediaCategory>('gallery');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [refKey, setRefKey] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMeta = useMemo(
    () => CATEGORIES.find((c) => c.value === category)!,
    [category]
  );

  const loadMedia = useCallback(async (cat: MediaCategory) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media?category=${cat}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load media');
      setMedia(data.media || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia(category);
    setRefKey('');
  }, [category, loadMedia]);

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) {
      setError('Please select image files (JPEG, PNG, WebP, or GIF)');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('category', category);
      if (alt.trim()) formData.append('alt', alt.trim());
      if (title.trim()) formData.append('title', title.trim());
      if (refKey.trim()) formData.append('refKey', refKey.trim());
      list.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setAlt('');
      setTitle('');
      await loadMedia(category);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const patchMedia = async (id: string, body: Record<string, unknown>) => {
    setError(null);
    const res = await fetch(`/api/admin/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    setMedia((prev) => prev.map((m) => (m.id === id ? data.media : m)));
    return data.media as MediaAsset;
  };

  const handleToggleActive = async (item: MediaAsset) => {
    try {
      await patchMedia(item.id, { isActive: !item.isActive });
    } catch (err: any) {
      setError(err.message || 'Failed to update visibility');
    }
  };

  const handleDelete = async (item: MediaAsset) => {
    if (!confirm(`Delete this ${item.category} image permanently?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const reordered = [...media];
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item);
    setMedia(reordered);

    try {
      await Promise.all(
        reordered.map((m, i) =>
          fetch(`/api/admin/media/${m.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      );
    } catch {
      setError('Failed to save new order');
      await loadMedia(category);
    }
  };

  const handleRefKeyChange = async (item: MediaAsset, value: string) => {
    try {
      await patchMedia(item.id, { refKey: value || null });
    } catch (err: any) {
      setError(err.message || 'Failed to update ref key');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Website Media</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload and manage photos for the gallery, services, and other site sections.
        </p>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-white p-1">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value} className="text-sm">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.value} value={c.value} className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upload to {c.label}</CardTitle>
                <CardDescription>{c.hint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="media-alt">Alt text</Label>
                    <Input
                      id="media-alt"
                      value={alt}
                      onChange={(e) => setAlt(e.target.value)}
                      placeholder="Describe the photo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="media-title">Label (optional)</Label>
                    <Input
                      id="media-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Internal label"
                    />
                  </div>
                  {c.value === 'service' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="media-ref">Service slot</Label>
                      <select
                        id="media-ref"
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        value={refKey}
                        onChange={(e) => setRefKey(e.target.value)}
                      >
                        <option value="">Assign later</option>
                        {SERVICE_REF_KEYS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {c.value === 'hero' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="media-ref-hero">Ref key</Label>
                      <Input
                        id="media-ref-hero"
                        value={refKey}
                        onChange={(e) => setRefKey(e.target.value)}
                        placeholder="hero (default)"
                      />
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver ? 'border-[#1a1a1a] bg-[#fafafa]' : 'border-[#e5e5e5] bg-white'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <ImagePlus className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                  <p className="mb-1 text-sm font-medium text-[#1a1a1a]">
                    Drag & drop images here, or choose files
                  </p>
                  <p className="mb-4 text-xs text-gray-500">JPEG, PNG, WebP, GIF · max 8MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                  />
                  <Button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select photos
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#1a1a1a]">
            {categoryMeta.label} photos ({media.length})
          </h2>
          <Button variant="outline" size="sm" onClick={() => loadMedia(category)} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : media.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-gray-500">
              No photos in this category yet. Upload some above — the public site will use them once
              they are active.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item, index) => (
              <Card key={item.id} className={!item.isActive ? 'opacity-60' : undefined}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-lg bg-[#f0f0f0]">
                  <Image
                    src={item.url}
                    alt={item.alt || 'Media'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                  {!item.isActive && (
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                      Hidden
                    </span>
                  )}
                </div>
                <CardContent className="space-y-3 p-3">
                  <div className="space-y-1">
                    <p className="truncate text-sm font-medium text-[#1a1a1a]">
                      {item.title || item.alt || 'Untitled'}
                    </p>
                    {category === 'service' && (
                      <select
                        className="w-full rounded-md border border-[#e5e5e5] bg-white px-2 py-1.5 text-xs"
                        value={item.refKey || ''}
                        onChange={(e) => handleRefKeyChange(item, e.target.value)}
                      >
                        <option value="">No service linked</option>
                        {SERVICE_REF_KEYS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {item.refKey && category !== 'service' && (
                      <p className="truncate text-xs text-gray-500">ref: {item.refKey}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      title="Move earlier"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={index === media.length - 1}
                      onClick={() => handleMove(index, 1)}
                      title="Move later"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handleToggleActive(item)}
                      title={item.isActive ? 'Hide from website' : 'Show on website'}
                    >
                      {item.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(item)}
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
