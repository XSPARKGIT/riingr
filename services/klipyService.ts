import type { Message } from '../types';

// KLIPY API base configuration (v1 endpoints)
// Uses your app key from Klipy dashboard, exposed as VITE_KLIPY_APP_KEY
const KLIPY_APP_KEY = import.meta.env.VITE_KLIPY_APP_KEY as string | undefined;
const KLIPY_BASE_URL = 'https://api.klipy.com/api/v1';

if (import.meta.env.DEV) {
  console.log(
    '[Klipy Debug] APP KEY present?',
    !!KLIPY_APP_KEY,
    'prefix:',
    KLIPY_APP_KEY?.slice(0, 6) || 'MISSING'
  );
}

export type KlipyMediaType = 'gif' | 'sticker';

export interface KlipyMedia {
  id: string;
  type: KlipyMediaType;
  previewUrl: string;
  fullUrl: string;
  width?: number;
  height?: number;
}

// Raw response types (loosely typed to match whatever Klipy returns)
type KlipyApiItem = any;
type KlipyApiResponse = any;

const ensureAppKey = () => {
  if (!KLIPY_APP_KEY) {
    if (import.meta.env.DEV) {
      console.warn('[Klipy] VITE_KLIPY_APP_KEY is not set');
    }
    throw new Error('Klipy app key is missing');
  }
};

// path example: '/gifs/trending'
const buildUrl = (
  path: string,
  params: Record<string, string | number | undefined>
) => {
  ensureAppKey();
  const url = new URL(`${KLIPY_BASE_URL}/${KLIPY_APP_KEY}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const normalizeItems = (
  items: KlipyApiItem[] | undefined,
  type: KlipyMediaType
): KlipyMedia[] => {
  if (!Array.isArray(items)) return [];

  const collectUrls = (obj: any, depth = 0): string[] => {
    if (!obj || typeof obj !== 'object' || depth > 2) return [];
    return Object.values(obj).flatMap((value) => {
      if (typeof value === 'string') return [value];
      if (typeof value === 'object') return collectUrls(value, depth + 1);
      return [];
    });
  };

  const isUrl = (value: string) => /^https?:\/\//i.test(value);
  const isImageUrl = (value: string) =>
    /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(value);

  return items
    .map<KlipyMedia | null>((item) => {
      // Klipy items have a `file` object with the actual media URL
      const file = item.file || {};
      const fileUrls = collectUrls(file).filter(isUrl);
      const imageUrls = fileUrls.filter(isImageUrl);
      const fileUrl: string | undefined = imageUrls[0] || fileUrls[0];

      // Keep the old image/media-based logic as a fallback
      const images = item.images || {};
      const img =
        images.preview_gif ||
        images.fixed_width_small ||
        images.fixed_width ||
        images.original;

      const media = item.media || {};

      const previewUrl =
        fileUrl ||
        img?.url ||
        media.preview ||
        media.url;

      const fullUrl =
        fileUrl ||
        images.original?.url ||
        media.url ||
        previewUrl;

      if (!previewUrl || !fullUrl) return null;

      const w = img?.width || media.width || file.width;
      const h = img?.height || media.height || file.height;

      return {
        id: String(item.id ?? item.slug ?? fullUrl),
        type,
        previewUrl,
        fullUrl,
        width: w ? Number(w) : undefined,
        height: h ? Number(h) : undefined,
      };
    })
    .filter((m): m is KlipyMedia => m !== null);
};

const fetchKlipy = async (
  path: string,
  params: Record<string, string | number | undefined>,
  type: KlipyMediaType
): Promise<KlipyMedia[]> => {
  try {
    const url = buildUrl(path, params);
    const res = await fetch(url);

    if (!res.ok) {
      if (import.meta.env.DEV) {
        const body = await res.text();
        console.error('[Klipy] API error', res.status, body.slice(0, 200));
      }
      return [];
    }

    const json: KlipyApiResponse = await res.json();

    if (import.meta.env.DEV) {
      console.log('[Klipy raw]', path, json);
    }

    // Klipy wraps content inside data, e.g. { result: true, data: { data: [...] } }
    const data = (json as any).data || {};
    let raw: any =
      data.data || // primary array location from current API response
      data.gifs ||
      data.stickers ||
      data.items ||
      (json as any).gifs ||
      (json as any).items ||
      (json as any).results ||
      (json as any).data;

    const items = Array.isArray(raw) ? (raw as KlipyApiItem[]) : [];

    return normalizeItems(items, type);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Klipy] Request failed', error);
    }
    return [];
  }
};

// GIFs (paths based on docs: api/v1/{app_key}/gifs/...)
export const getTrendingGifs = (perPage = 24, page = 1) =>
  fetchKlipy('/gifs/trending', { per_page: perPage, page }, 'gif');

export const searchGifs = (query: string, perPage = 24, page = 1) =>
  fetchKlipy('/gifs/search', { q: query, per_page: perPage, page }, 'gif');

// Stickers – adjust paths if docs say /stickers/ vs /sticker/
export const getTrendingStickers = (perPage = 24, page = 1) =>
  fetchKlipy('/stickers/trending', { per_page: perPage, page }, 'sticker');

export const searchStickers = (query: string, perPage = 24, page = 1) =>
  fetchKlipy('/stickers/search', { q: query, per_page: perPage, page }, 'sticker');

// Helper to map into a Message payload
export const klipyToMessageImage = (
  media: KlipyMedia
): Pick<Message, 'imageUrl'> => ({
  imageUrl: media.fullUrl,
});

