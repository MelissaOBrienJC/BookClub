
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonSpinner,
  IonButtons,
  IonNote,
  IonThumbnail,
  IonContent,
  IonLabel,
  IonItem,
  IonList,
  IonButton,
  IonIcon,
  IonDatetimeButton,
  IonModal,
  IonTabButton,
  IonFooter,
  IonTabBar,
  IonText,
  IonDatetime
} from '@ionic/angular/standalone';
import { BookService } from '../../services/book.service';
import { GoogleBooksService } from '../../services/google-books.service';
import { ClubService } from '../../services/club.service';
import {
  Book,
  BookSearchResult,
  BookStatus,
} from '../../models/book.model';
import { Club } from '../../models/club.model';

type StarIcon = 'star' | 'star-half' | 'star-outline';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    IonText,
    IonTabBar,
    IonFooter,
    IonDatetime,
    IonSegment,
    IonTabButton,
    IonInput,
    IonModal,
    IonDatetimeButton,
    CommonModule,
    FormsModule,
    IonButtons,
    IonTextarea,
    IonSpinner,
    IonNote,
    IonThumbnail,
    IonSegmentButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonList,
    IonButton,
    IonIcon
  ],
  templateUrl: './book-form.page.html',
})
export class BookFormPage {
  // Route context
  clubId: string | null = null;
  bookId: string | null = null;
  isWantToRead = false;
  isEdit = false;
  searchError = '';

  // Page loading
  loading = true;

  // Search
  searchQuery = '';
  searching = false;
  searchResults: BookSearchResult[] = [];
  selectedResult?: BookSearchResult;

  // Existing book being edited
  book?: Book;

  // Editable fields
  status: BookStatus = 'not_started';
  rating?: number;
  review = '';
  notes = '';
  publisher = '';
  pageCount?: number;
  publisherSummary = '';
  dueDate?: string;
  allClubs: Club[] = [];
  selectedClubIds: string[] = [];

  saving = false;

  // True when this book form was opened from a meeting form.
  private returnToMeeting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private googleBooks: GoogleBooksService,
    private clubService: ClubService
  ) {}

  async ionViewWillEnter() {
   
      this.book = undefined;
  this.loading = true;

    try {
      this.clubId = this.route.snapshot.paramMap.get('clubId');
      this.bookId = this.route.snapshot.paramMap.get('bookId');
      this.isWantToRead = !this.clubId;

      // Determine whether we were opened from the meeting form.
      this.returnToMeeting =
        this.route.snapshot.queryParamMap.get('returnToMeeting') === 'true';

      this.allClubs = await this.clubService.getClubs();

      this.selectedClubIds = this.clubId
        ? [this.clubId]
        : [];

      if (this.bookId) {
        // Editing an existing book.
        this.isEdit = true;

        this.book = await this.bookService.getBook(this.bookId);

        if (this.book) {
          this.status = this.book.status;
          this.rating = this.book.rating;
          this.review = this.book.review ?? '';
          this.notes = this.book.notes ?? '';
          this.publisher = this.book.publisher ?? '';
          this.pageCount = this.book.pageCount;
          this.publisherSummary = this.book.publisherSummary ?? '';
          this.dueDate = this.book.dueDate;
          this.selectedClubIds = this.book.clubIds;
        }
      } else {
        // New book: default due date to today.
        this.dueDate = new Date().toISOString();
      }
    } finally {
      this.loading = false;
    }
  }

  dueDateChanged(event: any) {
    this.dueDate = event.detail.value;

    console.log('DUE DATE CHANGED:', this.dueDate);
  }

  statusChanged(event: any) {
    this.status = event.detail.value as BookStatus;

    console.log('STATUS CHANGED:', event.detail.value);
    console.log('THIS.STATUS:', this.status);
  }

  async search() {
    console.log('SEARCH BUTTON CLICKED');
    console.log('Search query:', this.searchQuery);

    if (!this.searchQuery.trim()) {
      console.log('Search query is empty');
      return;
    }

    this.searching = true;
    this.searchError = '';
    this.searchResults = [];

    try {
      console.log('Calling Google Books service...');

      this.searchResults = await this.googleBooks.search(
        this.searchQuery
      );

      console.log('Search results:', this.searchResults);

    } catch (error) {
      console.error('Google Books search failed:', error);

      this.searchError =
        error instanceof Error
          ? error.message
          : 'Google Books search failed. Please try again.';
    } finally {
      this.searching = false;
    }
  }

  selectResult(result: BookSearchResult) {
    this.selectedResult = result;
    this.searchResults = [];

    // Pre-fill details from Google Books.
    this.publisher = result.publisher ?? '';
    this.pageCount = result.pageCount;
    this.publisherSummary = result.description ?? '';
  }

  toggleClub(clubId: string) {
    this.selectedClubIds = this.selectedClubIds.includes(clubId)
      ? this.selectedClubIds.filter((id) => id !== clubId)
      : [...this.selectedClubIds, clubId];
  }

  get ratingStars(): StarIcon[] {
    const r = this.rating ?? 0;

    return [1, 2, 3, 4, 5].map((i) => {
      if (r >= i) return 'star';
      if (r >= i - 0.5) return 'star-half';
      return 'star-outline';
    });
  }

  incrementRating() {
    this.rating = Math.min(
      5,
      (this.rating ?? 0) + 0.5
    );
  }

  decrementRating() {
    const next = Math.max(
      0,
      (this.rating ?? 0) - 0.5
    );

    this.rating = next === 0
      ? undefined
      : next;
  }

  get canSave(): boolean {
    if (this.isEdit) return true;

    return !!this.selectedResult;
  }

  async save() {
    if (!this.canSave || this.saving) return;

    this.saving = true;

    try {
      let savedBookId: string | undefined;

      if (this.isEdit && this.book) {
        // Update existing book.
        const updated: Book = {
          ...this.book,
          status: this.status,
          rating: this.rating,
          review: this.review || undefined,
          notes: this.notes || undefined,
          publisher: this.publisher || undefined,
          pageCount: this.pageCount,
          publisherSummary:
            this.publisherSummary || undefined,
          dueDate: this.dueDate,
          clubIds: this.isWantToRead
            ? []
            : this.selectedClubIds,
        };

        await this.bookService.saveBook(updated);

        savedBookId = updated.id;
      } else if (this.selectedResult) {
        // Create new book.
        const created =
          await this.bookService.addFromSearchResult(
            this.selectedResult,
            {
              isWantToRead: this.isWantToRead,
              clubIds: this.isWantToRead
                ? []
                : this.selectedClubIds,
            }
          );

        const withDetails: Book = {
          ...created,
          status: this.status,
          rating: this.rating,
          review: this.review || undefined,
          notes: this.notes || undefined,
          publisher: this.publisher || undefined,
          pageCount: this.pageCount,
          publisherSummary:
            this.publisherSummary || undefined,
          dueDate: this.dueDate,
        };

        await this.bookService.saveBook(withDetails);

        savedBookId = withDetails.id;
      }

      // If this book was added from a meeting form,
      // return to the meeting and select this book.
      if (
        this.returnToMeeting &&
        this.clubId &&
        savedBookId
      ) {
        sessionStorage.setItem(
          'meetingBookId',
          savedBookId
        );

        await this.router.navigate([
          '/club',
          this.clubId,
          'meetings',
          'new',
        ]);
      } else {
        this.goBack();
      }
    } catch (err) {
      console.error('Failed to save book:', err);
    } finally {
      this.saving = false;
    }
  }

  async delete() {
    if (!this.bookId) return;

    await this.bookService.deleteBook(this.bookId);

    this.goBack();
  }

  goBack() {
    if (this.returnToMeeting && this.clubId) {
      // No book was added, so make sure there isn't a stale
      // book ID waiting to be selected.
      sessionStorage.removeItem('meetingBookId');

      this.router.navigate([
        '/club',
        this.clubId,
        'meetings',
        'new',
      ]);

      return;
    }

    if (this.isWantToRead) {
      this.router.navigate(['/want-to-read']);
    } else {
      this.router.navigate([
        '/club',
        this.clubId,
        'books',
      ]);
    }
  }
}

