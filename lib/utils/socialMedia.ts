export type SocialMediaPlatform = 'facebook' | 'instagram';

export function isSocialMediaPlatform(value?: string | null): value is SocialMediaPlatform {
  return value === 'facebook' || value === 'instagram';
}

export function socialMediaPlatformLabel(platform?: string | null): string {
  if (platform === 'instagram') return 'Instagram';
  if (platform === 'facebook') return 'Facebook';
  return '';
}

export function formatSocialMediaDisplay(name?: string | null, platform?: string | null): string {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return '';
  const label = socialMediaPlatformLabel(platform);
  return label ? `${label}: ${trimmed}` : trimmed;
}
