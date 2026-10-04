import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { DbService } from './db.service';
import { ImageStorageService } from './image-storage.service';
import { Book, BookSearchResult, BookStatus } from '../models/book.model';

const STORE = 'books';

@Injectable({ providedIn: 'root' })
export class BookService {
  constructor(private db: DbService, private images: ImageStorageService) {}

  async getBooksForClub(clubId: string): Promise<Book[]> {
    const books = await this.db.getAll<Book>(STORE);
    return books
      .filter((b) => !b.isWantToRead && b.clubIds.includes(clubId))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }

 async getAllBooks(): Promise<Book[]> {
  const books = await this.db.getAll<Book>(STORE);

  return books.sort((a, b) => {
    // Books with no due date go last
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    // Due date descending
    return new Date(b.dueDate).getTime() -
           new Date(a.dueDate).getTime();
  });
}
  async getWantToReadBooks(): Promise<Book[]> {
    const books = await this.db.getAll<Book>(STORE);
    return books.filter((b) => b.isWantToRead).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }

  async getBook(id: string): Promise<Book | undefined> {
    return this.db.get<Book>(STORE, id);
  }

  /**
   * Creates a new book from a Google Books search result: caches the cover
   * locally and associates it with the given clubs (empty for want-to-read).
   */
  async addFromSearchResult(
    result: BookSearchResult,
    opts: { isWantToRead: boolean; clubIds: string[] }
  ): Promise<Book> {
    const id = uuidv4();
    const coverImagePath = result.thumbnailUrl
      ? await this.images.cacheCover(result.thumbnailUrl)
      : undefined;

    const book: Book = {
      id,
      title: result.title,
      author: result.author,
      publisher: result.publisher,
      pageCount: result.pageCount,
      publisherSummary: result.description,
      isbn: result.isbn,
      googleBooksId: result.googleBooksId,
      coverImagePath,
      status: 'not_started',
      dateAdded: new Date().toISOString(),
      isWantToRead: opts.isWantToRead,
      clubIds: opts.isWantToRead ? [] : opts.clubIds,
    };

    await this.db.put(STORE, book);
    return book;
  }

  /** Updates an existing book's editable fields (rating, review, notes, status, club list). */
  async saveBook(book: Book): Promise<Book> {
    await this.db.put(STORE, book);
    return book;
  }

  async deleteBook(id: string): Promise<void> {
    await this.db.delete(STORE, id);
    await this.images.deleteCover(id);
  }

  async setStatus(id: string, status: BookStatus): Promise<void> {
    const book = await this.getBook(id);
    if (!book) return;
    book.status = status;
    await this.db.put(STORE, book);
  }
}
