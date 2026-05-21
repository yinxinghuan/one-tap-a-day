// Save the revealed totem image to the user's device.
//
// Strategy:
//   1. Fetch the totem image as a Blob.
//   2. If the browser supports the Web Share API with files (most mobile
//      browsers do), open the native share sheet — on iOS that lets the
//      user "Save Image" to Photos; on Android it offers Save / Files /
//      messaging apps.
//   3. Otherwise fall back to a programmatic download via <a download>.
//
// Returns 'shared' | 'downloaded' | 'cancelled' | 'error' so the caller
// can flash a confirmation toast.

export type SaveResult = 'shared' | 'downloaded' | 'cancelled' | 'error';

export async function saveTotem(opts: {
  imageUrl: string;
  date: string;            // YYYY-MM-DD (UTC), used in filename
  caption?: string;        // used as share-sheet title
}): Promise<SaveResult> {
  const { imageUrl, date, caption } = opts;
  const filename = `alteru-totem-${date}.png`;

  let blob: Blob;
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    blob = await res.blob();
  } catch (err) {
    console.warn('[saveTotem] fetch failed, falling back to direct link', err);
    // Last-ditch: open the URL in a new tab so the user can long-press.
    window.open(imageUrl, '_blank');
    return 'error';
  }

  // Convert webp → png mime if we want; for now keep the source mime.
  const mime = blob.type || 'image/png';

  // Try the Web Share API with files first.
  // navigator.canShare with files is required because some browsers
  // implement navigator.share but not file shares.
  type ShareCapable = Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };
  const nav = navigator as ShareCapable;
  if (nav.canShare && nav.share && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: mime });
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: caption || 'AlterU totem',
        });
        return 'shared';
      }
    } catch (err) {
      const e = err as Error & { name?: string };
      if (e.name === 'AbortError') return 'cancelled';
      console.warn('[saveTotem] share failed, falling back to download', err);
      // continue to download fallback
    }
  }

  // Fallback: trigger an <a download>.
  try {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return 'downloaded';
  } catch (err) {
    console.error('[saveTotem] download failed', err);
    return 'error';
  }
}
