import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const PROXY_PREFIX = '/book-cover-proxy';

// Target size for stored covers. Since covers are only ever shown as
// thumbnails, we downscale to ~2x the largest thumbnail size we render,
// which keeps things crisp on retina screens without storing full-size art.
const MAX_WIDTH = 400;
const MAX_HEIGHT = 600;
const JPEG_QUALITY = 0.8;

@Injectable({
  providedIn: 'root',
})
export class ImageStorageService {

  async cacheCover(remoteUrl: string): Promise<string | undefined> {
    console.log('COVER: cacheCover called');
    console.log('COVER: remote URL:', remoteUrl);

    let dataUrl: string | undefined;

    // Native iOS / Android:
    // Download the image directly using CapacitorHttp.
    if (Capacitor.isNativePlatform()) {
      try {
        dataUrl = await this.fetchNativeAsDataUrl(remoteUrl);
      } catch (err) {
        console.error('COVER: native download failed:', err);
        return remoteUrl;
      }
    } else {
      // Browser:
      // Try the local proxy first.
      const proxiedUrl = this.toProxiedUrl(remoteUrl);

      if (proxiedUrl) {
        try {
          dataUrl = await this.fetchAsDataUrl(proxiedUrl);
        } catch (err) {
          console.warn('COVER: proxy failed:', err);
        }
      }

      // Browser fallback.
      if (!dataUrl) {
        try {
          dataUrl = await this.fetchAsDataUrl(remoteUrl);
        } catch (err) {
          console.warn(
            'COVER: could not cache cover; using remote URL:',
            err
          );

          return remoteUrl;
        }
      }
    }

    // At this point we have a full-size data URL. Downscale it so we're
    // not storing (and backing up) far more pixels than a thumbnail needs.
    console.log('COVER: got data URL, length:', dataUrl?.length ?? 'undefined');

    try {
      const resized = await this.resizeDataUrl(dataUrl);
      console.log(
        `COVER: resized ${this.dataUrlSizeKb(dataUrl)}KB -> ${this.dataUrlSizeKb(resized)}KB`
      );
      return resized;
    } catch (err) {
      console.warn('COVER: resize failed, storing original:', err);
      return dataUrl;
    }
  }

  async deleteCover(_bookId: string): Promise<void> {
    // Covers are stored directly in the Book record.
  }

  private toProxiedUrl(remoteUrl: string): string | undefined {
    try {
      const parsed = new URL(remoteUrl);

      return `${PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
    } catch {
      return undefined;
    }
  }

  private async fetchNativeAsDataUrl(
    url: string
  ): Promise<string> {

    console.log('COVER: requesting:', url);

    const response = await CapacitorHttp.get({
      url,
      responseType: 'blob',
    });

    console.log('COVER: status:', response.status);
    console.log('COVER: headers:', response.headers);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Image request failed with status ${response.status}`
      );
    }

    if (typeof response.data !== 'string') {
      throw new Error(
        'Image response was not returned as base64 text.'
      );
    }

    const contentType =
      response.headers?.['content-type'] ||
      response.headers?.['Content-Type'] ||
      'image/jpeg';

    console.log('COVER: content type:', contentType);
    console.log('COVER: data length:', response.data.length);

    // Prevent accidentally storing the application's HTML page
    // as a book cover.
    if (contentType.toLowerCase().includes('text/html')) {
      throw new Error(
        'Image request returned HTML instead of an image.'
      );
    }

    return `data:${contentType};base64,${response.data}`;
  }

  private async fetchAsDataUrl(
    url: string
  ): Promise<string> {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Fetch failed with status ${response.status}`
      );
    }

    const contentType =
      response.headers.get('content-type') || '';

    if (contentType.toLowerCase().includes('text/html')) {
      throw new Error(
        'Cover request returned HTML instead of an image.'
      );
    }

    const blob = await response.blob();

    return this.blobToDataUrl(blob);
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };

      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  }

  /**
   * Downscales a data URL to fit within MAX_WIDTH x MAX_HEIGHT and
   * re-encodes it as JPEG. This runs in-memory via <img> + <canvas>,
   * which works in both the browser and the Capacitor native webview.
   *
   * If the source is smaller than the target box already, it's still
   * re-encoded as JPEG (covers are rarely PNG-worthy), but never upscaled.
   */
  private resizeDataUrl(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(
          MAX_WIDTH / img.width,
          MAX_HEIGHT / img.height,
          1 // never upscale
        );

        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for resizing.'));
      };

      img.src = dataUrl;
    });
  }

  /** Rough size in KB of a data URL, based on its base64 payload length. */
  private dataUrlSizeKb(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] ?? '';
    const bytes = base64.length * 0.75; // base64 -> raw byte estimate
    return Math.round(bytes / 1024);
  }
}
