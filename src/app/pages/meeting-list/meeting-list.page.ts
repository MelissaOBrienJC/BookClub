import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonThumbnail, IonTitle,   IonContent, IonLabel, IonFabButton,IonItem, IonList, IonButton, IonIcon, IonButtons, IonBackButton, IonFab, IonTabBar } from '@ionic/angular/standalone';
import { MeetingService } from '../../services/meeting.service';
import { BookService } from '../../services/book.service';
import { ClubService } from '../../services/club.service';
import { Meeting } from '../../models/meeting.model';
import { Club } from '../../models/club.model';

interface MeetingRow extends Meeting {
  bookTitle?: string;
  bookCoverImagePath?: string;
}

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [IonTabBar, IonFab, IonBackButton, CommonModule, RouterLink ,IonButtons,IonFab, IonFabButton, IonHeader, IonToolbar, IonThumbnail, IonTitle, IonContent, IonLabel, IonItem, IonList,IonButtons, IonBackButton ,  IonIcon],
  templateUrl: './meeting-list.page.html',
})
export class MeetingListPage {
  clubId!: string;
  club?: Club;
  meetings: MeetingRow[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meetingService: MeetingService,
    private bookService: BookService,
    private clubService: ClubService
  ) {}

   async ionViewWillEnter() {
    this.loading = true;

    try {
      this.clubId = this.route.snapshot.paramMap.get('clubId')!;
      this.club = await this.clubService.getClub(this.clubId);

      const meetings = await this.meetingService.getMeetingsForClub(this.clubId);

      this.meetings = await Promise.all(
        meetings.map(async (m) => {
          const book = m.bookId
            ? await this.bookService.getBook(m.bookId)
            : undefined;

          return {
            ...m,
            bookTitle: book?.title,
            bookCoverImagePath: book?.coverImagePath
          };
        })
      );
    } finally {
      this.loading = false;
    }
  }

  openMeeting(meeting: Meeting) {
    this.router.navigate(['/club', this.clubId, 'meetings', meeting.id]);
  }
}
