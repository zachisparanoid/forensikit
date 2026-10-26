import exifr from 'exifr';
import type { ExifResult } from '../types';

/**
 * Thin wrapper over exifr. We request the common forensic-relevant blocks
 * (TIFF/EXIF/GPS/IPTC/XMP) and normalise the handful of fields the UI surfaces,
 * while keeping the full parsed object in `raw` for power users.
 */
export async function parseExif(
  input: File | ArrayBuffer | Uint8Array,
): Promise<ExifResult | null> {
  let raw: Record<string, unknown> | undefined;
  try {
    raw = (await exifr.parse(input as ArrayBuffer, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: true,
      interop: true,
      mergeOutput: true,
      reviveValues: true,
      translateKeys: true,
      translateValues: true,
    })) as Record<string, unknown> | undefined;
  } catch {
    return null;
  }
  if (!raw || Object.keys(raw).length === 0) return null;

  const lat = raw.latitude as number | undefined;
  const lng = raw.longitude as number | undefined;
  const date =
    (raw.DateTimeOriginal as Date | string | undefined) ??
    (raw.CreateDate as Date | string | undefined);

  return {
    make: asStr(raw.Make),
    model: asStr(raw.Model),
    lensModel: asStr(raw.LensModel),
    software: asStr(raw.Software),
    orientation: (raw.Orientation as number | string | undefined) ?? undefined,
    dateTimeOriginal: date ? new Date(date).toString() : undefined,
    gps:
      typeof lat === 'number' && typeof lng === 'number'
        ? { lat, lng }
        : undefined,
    raw,
  };
}

function asStr(v: unknown): string | undefined {
  if (v == null) return undefined;
  return typeof v === 'string' ? v : String(v);
}

export function osmLink(lat: number, lng: number): string {
  // OpenStreetMap deep link — no third-party tracker embedded by default.
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

export function formatGps(lat: number, lng: number): string {
  const fmt = (v: number, pos: string, neg: string) =>
    `${Math.abs(v).toFixed(6)}° ${v >= 0 ? pos : neg}`;
  return `${fmt(lat, 'N', 'S')}, ${fmt(lng, 'E', 'W')}`;
}
