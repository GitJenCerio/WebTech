'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NailTechBasic {
  id: string;
  name: string;
  role?: string;
  discount?: number;
}

export function useNailTechs(): {
  nailTechs: NailTechBasic[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [nailTechs, setNailTechs] = useState<NailTechBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNailTechs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/nail-techs');
      if (!res.ok) throw new Error('Failed to load nail techs');
      const data = await res.json();
      const raw = data.nailTechs || [];
      setNailTechs(raw.map((t: { id?: string; _id?: string; name: string; role?: string; specialties?: string[]; discount?: number }) => ({
        id: t.id || t._id || '',
        name: t.name,
        role: t.specialties?.[0] || t.role || 'Nail Tech',
        discount: typeof t.discount === 'number' ? t.discount : undefined,
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load nail techs');
      setNailTechs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNailTechs();
  }, [fetchNailTechs]);

  return { nailTechs, loading, error, refetch: fetchNailTechs };
}
