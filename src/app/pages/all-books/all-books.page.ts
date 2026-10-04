import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonItem,
  IonList,
  IonIcon,
  IonThumbnail,
  IonTabBar,
  IonTabButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonModal,
  IonFooter,
} from '@ionic/angular/standalone';

import { BookService } from '../../services/book.service';
import { ClubService } from '../../services/club.service';

import { Book, BookStatus } from '../../models/book.model';
import { Club } from '../../models/club.model';

@Component({
  selector: 'app-all-books',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonModal,
    IonFooter,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonList,
    IonIcon,
    IonThumbnail,

    IonTabBar,
    IonTabButton,

    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons
  ],
  templateUrl: './all-books.page.html',
})
export class AllBooksPage {
  allBooks: Book[] = [];
  books: Book[] = [];

  clubs: Club[] = [];
  loading = true

  searchText = '';
  selectedClubId = '';
  selectedStatus: BookStatus | '' = '';
  minimumRating = '';
  filterModalOpen = false;


   selectedWantToRead: string = 'all';
  constructor(
    private bookService: BookService,
    private clubService: ClubService,
    private router: Router
  ) {}

  async ionViewWillEnter() {
  this.loading = true;

  try {
    this.allBooks = await this.bookService.getAllBooks();
    this.clubs = await this.clubService.getClubs();

    this.applyFilters();
  } finally {
    this.loading = false;
  }
}

  applyFilters() {
  const search = this.searchText.trim().toLowerCase();

  this.books = this.allBooks
    .filter((book) => {

      // Search title or author
      if (search) {
        const title = book.title?.toLowerCase() ?? '';
        const author = book.author?.toLowerCase() ?? '';

        if (!title.includes(search) && !author.includes(search)) {
          return false;
        }
      }

      // Club
      if (
        this.selectedClubId &&
        !book.clubIds.includes(this.selectedClubId)
      ) {
        return false;
      }

      // Status
      if (
        this.selectedStatus &&
        book.status !== this.selectedStatus
      ) {
        return false;
      }

       // Want to Read
      if (this.selectedWantToRead === 'yes' && !book.isWantToRead) {
        return false;
      }

      if (this.selectedWantToRead === 'no' && book.isWantToRead) {
        return false;
      }
      // Rating
      if (this.minimumRating) {
        const minimum = Number(this.minimumRating);

        if ((book.rating ?? 0) < minimum) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // No due date goes to the bottom
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      // Due date DESC — latest/furthest date first
      return new Date(b.dueDate).getTime() -
             new Date(a.dueDate).getTime();
    });
}

  clearFilters() {
    this.searchText = '';
    this.selectedClubId = '';
    this.selectedStatus = '';
    this.minimumRating = '';
     this.selectedWantToRead = 'all';

    this.applyFilters();
  }

hasFilters(): boolean {
  return !!(
    this.searchText ||
    this.selectedClubId ||
    this.selectedStatus ||
    this.minimumRating ||
    this.selectedWantToRead !== 'yes'
  );
}

  openBook(book: Book) {
    const clubId = book.clubIds?.[0];

    if (clubId) {
      this.router.navigate([
        '/club',
        clubId,
        'books',
        book.id,
      ]);
    }
  }

  openFilters() {
  this.filterModalOpen = true;
}

closeFilters() {
  this.filterModalOpen = false;
}

applyAndCloseFilters() {
  this.applyFilters();
  this.filterModalOpen = false;
}

starArray(rating?: number): ('star' | 'star-half' | 'star-outline')[] {
    const r = rating ?? 0;
    return [1, 2, 3, 4, 5].map((i) => {
      if (r >= i) return 'star';
      if (r >= i - 0.5) return 'star-half';
      return 'star-outline';
    });
  }
}