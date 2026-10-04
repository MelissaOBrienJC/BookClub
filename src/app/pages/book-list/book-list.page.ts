import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonHeader, IonTabBar,IonToolbar, IonTitle, IonFab,IonContent, IonThumbnail, IonLabel,IonBackButton, IonNote,IonButtons,  IonItem, IonList, IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';

import { BookService } from '../../services/book.service';
import { ClubService } from '../../services/club.service';
import { Book } from '../../models/book.model';
import { Club } from '../../models/club.model';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [IonBadge, IonTabBar,CommonModule, RouterLink,  IonHeader,IonToolbar,IonFab,IonTitle, IonBackButton, IonContent, IonButtons, IonLabel,IonThumbnail, IonItem, IonList, IonButton,IonNote, IonIcon],
  templateUrl: './book-list.page.html',
})
export class BookListPage {
  books: Book[] = [];
  club?: Club;
  clubId!: string;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private clubService: ClubService
  ) {}

 async ionViewWillEnter() {
  this.loading = true;

  try {
    this.clubId = this.route.snapshot.paramMap.get('clubId')!;
    this.club = await this.clubService.getClub(this.clubId);
    const books = await this.bookService.getBooksForClub(this.clubId);
    this.books = this.sortByDueDate(books);
  } finally {
    this.loading = false;
  }
}

  /** Due date descending (furthest/most-recent due date first); books with no due date go last. */
  private sortByDueDate(books: Book[]): Book[] {
    return [...books].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return b.dueDate.localeCompare(a.dueDate);
    });
  }

  openBook(book: Book) {
    this.router.navigate(['/club', this.clubId, 'books', book.id]);
  }

  statusLabel(status: Book['status']): string {
    switch (status) {
      case 'started':
        return 'Reading';
      case 'read':
        return 'Read';
      case 'skip':
        return 'Skipped';
      default:
        return 'Not Started';
    }
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
