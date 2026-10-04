import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonTabButton,IonItem, IonList, IonButton, IonIcon,IonTabBar, IonButtons, IonItemSliding, IonItemOptions, IonItemOption, IonFab } from '@ionic/angular/standalone';

import { ClubService } from '../../services/club.service';
import { Club } from '../../models/club.model';

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [IonFab, IonItemOption, IonItemOptions, IonItemSliding, IonItem,IonTabButton, CommonModule, RouterLink , IonTabBar,IonHeader, IonToolbar, IonTitle, IonContent, IonLabel, IonItem, IonList, IonButton, IonIcon],
  templateUrl: './club-list.page.html',
})
export class ClubListPage {
  clubs: Club[] = [];
 loading = true;
  constructor(private clubService: ClubService, private router: Router) {}

  async ionViewWillEnter() {
  this.loading = true;

  try {
    this.clubs = await this.clubService.getClubs();
  } finally {
    this.loading = false;
  }
}

  openBooks(club: Club) {
    this.router.navigate(['/club', club.id, 'books']);
  }

  openMeetings(club: Club) {
    this.router.navigate(['/club', club.id, 'meetings']);
  }

  editClub(club: Club) {
    this.router.navigate(['/club-form', club.id]);
  }

  async deleteClub(club: Club) {
    await this.clubService.deleteClub(club.id);
    this.clubs = this.clubs.filter((c) => c.id !== club.id);
  }
}