export type BookStatus = 'not_started' | 'started' | 'read' | 'skip';

export interface Book {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  pageCount?: number;
  /** The publisher's own description/summary, pulled from Google Books - distinct from the personal review below. */
  publisherSummary?: string;
  isbn?: string;
  googleBooksId?: string;
  /** Local device URI to the cached cover image (not a remote URL). */
  coverImagePath?: string;
  /** 0-5 in half-point steps (0.5, 1, 1.5, ... 5). Undefined means unrated. */
  rating?: number;
  review?: string;
  notes?: string; // book-club discussion notes, distinct from the personal review
  status: BookStatus;
  /** Target date to finish this book by (ISO date). Defaults to today when the book is added. */
  dueDate?: string;
  dateAdded: string;
  /** True if this lives on the personal "Want to Read" list rather than a club's list. */
  isWantToRead: boolean;
  /** Clubs this book is associated with. Empty for want-to-read books. */
  clubIds: string[];
}

/** Shape returned from a Google Books search, before the book is saved locally. */
export interface BookSearchResult {
  googleBooksId: string;
  title: string;
  author?: string;
  publisher?: string;
  pageCount?: number;
  description?: string;
  isbn?: string;
  thumbnailUrl?: string;
}
