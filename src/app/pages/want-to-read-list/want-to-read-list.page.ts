import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent,IonTabButton, IonLabel,IonFab,IonTabBar, IonButtons, IonItem,IonBackButton, IonList,IonThumbnail,  IonIcon } from '@ionic/angular/standalone';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-want-to-read-list',
  standalone: true,
  imports: [CommonModule, RouterLink , IonHeader, IonTabButton,IonTabBar,IonFab, IonTabBar, IonToolbar, IonTitle,IonButtons,  IonBackButton, IonContent, IonLabel, IonItem, IonList,  IonThumbnail, IonIcon],
  templateUrl: './want-to-read-list.page.html',
})
export class WantToReadListPage {

  books: Book[] = [];
  loading = true;

  constructor(private bookService: BookService, private router: Router) {}

  async ionViewWillEnter() {
    this.loading = true;

    try {
      this.books = await this.bookService.getWantToReadBooks();
    } finally {
      this.loading = false;
    }
  }

  openBook(book: Book) {
    this.router.navigate(['/want-to-read', book.id]);
  }
}
