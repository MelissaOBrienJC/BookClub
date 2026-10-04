import { Component,ViewChild  } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonFab,
 
IonFabButton,
  IonTabButton } from '@ionic/angular/standalone';

import { MeetingService } from '../../services/meeting.service';
import { BookService } from '../../services/book.service';
import { ClubService } from '../../services/club.service';

import { Meeting } from '../../models/meeting.model';


interface MeetingRow extends Meeting {
  clubName?: string;
  bookTitle?: string;
  bookCoverImagePath?: string;
}

@Component({
  selector: 'app-meeting-overview',
  standalone: true,
  imports: [ IonFab,  IonFabButton,
    CommonModule,
    RouterLink,
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
  ],
  templateUrl: './meeting-overview.page.html',
})
export class MeetingOverviewPage {
  meetings: MeetingRow[] = [];
  



  constructor(
    private router: Router,
    private meetingService: MeetingService,
    private bookService: BookService,
    private clubService: ClubService
  ) {}

  async ionViewWillEnter() {
    await this.loadMeetings();
  }

  async loadMeetings() {
    this.meetings = [];

    const clubs = await this.clubService.getClubs();

    const rows: MeetingRow[] = [];

    for (const club of clubs) {
      const meetings = await this.meetingService.getMeetingsForClub(club.id);

      const clubMeetings = await Promise.all(
        meetings.map(async (meeting) => {
          const book = meeting.bookId
            ? await this.bookService.getBook(meeting.bookId)
            : undefined;

          return {
            ...meeting,
            clubName: club.name,
            bookTitle: book?.title,
            bookCoverImagePath: book?.coverImagePath,
          };
        })
      );

      rows.push(...clubMeetings);
    }

    rows.sort((a, b) => {
      return b.date.localeCompare(a.date);
    });

    this.meetings = rows;
  }

  openMeeting(meeting: MeetingRow) {
    this.router.navigate([
      '/club',
      meeting.clubId,
      'meetings',
      meeting.id,
    ]);
  }

addMeeting() {
  this.router.navigate(['/select-club']);
}

}