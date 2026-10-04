import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  Router,RouterLink } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel
  
} from '@ionic/angular/standalone';

import { ClubService } from '../../services/club.service';
import { Club } from '../../models/club.model';

@Component({
  selector: 'app-select-club',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  templateUrl: './select-club.page.html',
})
export class SelectClubPage {
  clubs: Club[] = [];

  constructor(
   private router: Router,
    private clubService: ClubService
  ) {}

  async ionViewWillEnter() {
    this.clubs = await this.clubService.getClubs();
  }
selectClub(club: Club) {
  console.log('SELECT CLUB:', club.id, club.name);

  this.router.navigate([
    '/club',
    club.id,
    'meetings',
    'new',
  ]);
}
  
}

