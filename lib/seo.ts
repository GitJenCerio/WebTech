const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.glammednailsbyjhen.com';

export function getCanonical(path: string) {
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export { siteUrl };
