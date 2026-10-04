import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BookSearchResult } from '../models/book.model';
import { environment } from '../../environments/environment';

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';


const API_KEY = environment.googleBooksApiKey;


// A bare string of digits/dashes of length 10 or 13 is almost certainly an ISBN
// rather than a title someone typed in.
const ISBN_PATTERN = /^[0-9-]{10,17}$/;

// Retry settings.
const MAX_ATTEMPTS = 10;
const MAX_RETRY_TIME_MS = 15_000;
const INITIAL_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 2_000;

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {
  constructor(private http: HttpClient) {}

  /** Search by title, author, or ISBN - whichever the user typed in. */
  async search(query: string): Promise<BookSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const isIsbn = ISBN_PATTERN.test(trimmed.replace(/\s/g, ''));
    const q = isIsbn
      ? `isbn:${trimmed.replace(/-/g, '')}`
      : `intitle:${trimmed}`;

    let url = `${API_BASE}?q=${encodeURIComponent(q)}&maxResults=20`;

    if (API_KEY) {
      url += `&key=${API_KEY}`;
    }
    
    const response = await this.getWithRetry(url);

    const items: any[] = response?.items ?? [];

    return items
      .map((item) => this.toSearchResult(item))
      .filter(
        (r): r is BookSearchResult => !!r
      );
  }

  /**
   * Makes an HTTP GET request and retries up to 10 total attempts
   * when Google returns HTTP 503.
   *
   * The retry delays are limited to a total of 15 seconds.
   */
  private async getWithRetry(url: string): Promise<any> {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;

      try {
        return await firstValueFrom(this.http.get<any>(url));
      } catch (error) {
        const is503 =
          error instanceof HttpErrorResponse && error.status === 503;

        // Do not retry errors other than 503.
        if (!is503 || attempt >= MAX_ATTEMPTS) {
          console.error(
            `Google Books request failed after ${attempt} attempt(s).`,
            error
          );

          if (is503) {
            throw new Error(
              'Google Books is temporarily busy. Please try again in a moment.'
            );
          }

          throw error;
        }

        const elapsed = Date.now() - startTime;
        const remainingMs = MAX_RETRY_TIME_MS - elapsed;

        if (remainingMs <= 0) {
          throw new Error(
            'Google Books is temporarily busy. Please try again in a moment.'
          );
        }

        // Exponential backoff, capped at 2 seconds.
        const delayMs = Math.min(
          INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1),
          MAX_RETRY_DELAY_MS,
          remainingMs
        );

        console.warn(
          `Google Books returned 503. ` +
          `Retrying in ${delayMs}ms ` +
          `(attempt ${attempt + 1} of ${MAX_ATTEMPTS})...`
        );

        await this.delay(delayMs);
      }
    }

    throw new Error(
      'Google Books is temporarily busy. Please try again in a moment.'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toSearchResult(item: any): BookSearchResult | null {
    const info = item?.volumeInfo;
    if (!info?.title) return null;

    const isbnEntry = (info.industryIdentifiers ?? []).find(
      (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    );

    // Google serves these over http; upgrade to https to avoid mixed-content blocks.
    const thumbnail =
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;

    return {
      googleBooksId: item.id,
      title: info.title,
      author: (info.authors ?? []).join(', ') || undefined,
      publisher: info.publisher || undefined,
      pageCount:
        typeof info.pageCount === 'number' && info.pageCount > 0
          ? info.pageCount
          : undefined,
      description: info.description || undefined,
      isbn: isbnEntry?.identifier,
      thumbnailUrl: thumbnail
        ? thumbnail.replace(/^http:/, 'https:')
        : undefined,
    };
  }
}