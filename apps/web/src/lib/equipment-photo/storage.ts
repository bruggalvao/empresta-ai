// The only place in apps/web that knows where equipment photos live.
// Photos are addressed by object path; a URL is never accepted as input.

export const PHOTO_BUCKET = 'equipamentos'

// A plain file name: no scheme, no folders, no "..", image extension only.
const PHOTO_PATH = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i

export function isValidPhotoPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && PHOTO_PATH.test(path) && !path.includes('..')
}

export function photoPublicUrl(
  path: string | null | undefined,
  baseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL,
): string | null {
  if (!isValidPhotoPath(path) || !baseUrl) return null
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${encodeURIComponent(path)}`
}
