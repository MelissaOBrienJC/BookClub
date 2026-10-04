import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonButton,
  IonIcon,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonInput,
  IonTextarea,
  
} from '@ionic/angular/standalone';

import { MeetingService } from '../../services/meeting.service';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';


@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,

    IonButtons,
    IonBackButton,
    IonInput,
  IonTextarea,

    IonLabel,
    IonItem,
    IonButton,
    IonIcon,

    IonSelect,
    IonSelectOption,

    IonDatetime,
    IonDatetimeButton,
    IonModal,
  ],
  templateUrl: './meeting-form.page.html',
})
export class MeetingFormPage {
  form: FormGroup;
  clubId!: string;
  isEdit = false;
  private editId?: string;

  clubBooks: Book[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private meetingService: MeetingService,
    private bookService: BookService,
    private alertController: AlertController
  ) {
    this.form = this.fb.group({
      date: [this.getDefaultMeetingDate(), Validators.required],
      location: [''],
      bookId: [null],
      notes: [''],
    });
  }

  async ionViewWillEnter() {
    this.clubId = this.route.snapshot.paramMap.get('clubId')!;

    const id = this.route.snapshot.paramMap.get('meetingId');

    if (id) {
      // Editing an existing meeting
      this.isEdit = true;
      this.editId = id;

      const meeting = await this.meetingService.getMeeting(id);

      if (meeting) {
        this.form.patchValue({
          date: meeting.date,
          location: meeting.location,
          bookId: meeting.bookId ?? null,
          notes: meeting.notes,
        });
      }
    } else {
      // Creating a new meeting
      this.isEdit = false;
      this.editId = undefined;

      // Restore the meeting form if we came back from Add Book.
      const savedState = sessionStorage.getItem('meetingFormState');

      if (savedState) {
        try {
          const meetingForm = JSON.parse(savedState);

          this.form.patchValue(meetingForm);

          // We only need this state once.
          sessionStorage.removeItem('meetingFormState');
        } catch (err) {
          console.warn('Could not restore meeting form state:', err);
          sessionStorage.removeItem('meetingFormState');
        }
      }
    }

    // Load books that are still available to discuss.
    await this.loadAvailableBooks();

    // If we just added a book, select it automatically.
    const newBookId = sessionStorage.getItem('meetingBookId');

    if (newBookId) {
      this.form.patchValue({
        bookId: newBookId,
      });

      sessionStorage.removeItem('meetingBookId');
    }
  }


  

  /**
   * Loads books for this club that have not already been discussed
   * in another meeting.
   *
   * When editing a meeting, its existing book remains available.
   */
  private async loadAvailableBooks(): Promise<void> {
    const books = await this.bookService.getBooksForClub(this.clubId);
    const meetings = await this.meetingService.getMeetingsForClub(this.clubId);

    const discussedBookIds = new Set(
      meetings
        .filter((meeting) => meeting.id !== this.editId)
        .map((meeting) => meeting.bookId)
        .filter((bookId): bookId is string => !!bookId)
    );

    this.clubBooks = books.filter(
      (book) => !discussedBookIds.has(book.id)
    );
  }

  /**
   * Open the Add Book form while preserving everything
   * the user has entered into the meeting form.
   */
  addBook() {
    sessionStorage.setItem(
      'meetingFormState',
      JSON.stringify(this.form.getRawValue())
    );

    this.router.navigate(
      ['/club', this.clubId, 'books', 'new'],
      {
        queryParams: {
          returnToMeeting: 'true',
        },
      }
    );
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      // const meeting = await this.meetingService.saveMeeting({
      //   id: this.editId,
      //   clubId: this.clubId,
      //   date: this.form.value.date,
      //   location: this.form.value.location || undefined,
      //   bookId: this.form.value.bookId || undefined,
      //   notes: this.form.value.notes || undefined,
      // });

      console.log('FORM LOCATION:', this.form.value.location);

const meeting = await this.meetingService.saveMeeting({
  id: this.editId,
  clubId: this.clubId,
  date: this.form.value.date,
  location: this.form.value.location || undefined,
  bookId: this.form.value.bookId || undefined,
  notes: this.form.value.notes || undefined,
});

console.log('SAVED MEETING:', meeting);
console.log('MEETING LOCATION:', meeting.location);
      if (!this.isEdit) {
        const addToCalendar = await this.askToAddToCalendar();

        if (addToCalendar) {
          await this.addMeetingToCalendar(meeting);
        }
      }

      this.goBack();
    } catch (err) {
      console.error('Failed to save meeting:', err);
    }
  }

  private async askToAddToCalendar(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Add to Calendar?',
        message: 'Would you like to add this meeting to your phone calendar?',
        buttons: [
          {
            text: 'Not now',
            role: 'cancel',
            handler: () => resolve(false),
          },
          {
            text: 'Add to Calendar',
            handler: () => resolve(true),
          },
        ],
      });

      await alert.present();
    });
  }

  private async offerAddToCalendar(meeting: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Meeting saved',
      message: 'Would you like to add this meeting to your phone calendar?',
      buttons: [
        {
          text: 'Not now',
          role: 'cancel',
        },
        {
          text: 'Add to Calendar',
          handler: () => {
            // Don't await inside the Ionic alert handler.
            this.addMeetingToCalendar(meeting);
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
  }

  async delete() {
    if (!this.editId) return;

    await this.meetingService.deleteMeeting(this.editId);
    this.goBack();
  }

  goBack() {
    this.router.navigate(['/club', this.clubId, 'meetings']);
  }

  private getDefaultMeetingDate(): string {
    const date = new Date();

    // Default to 30 days from today at 7:00 PM local time.
    date.setDate(date.getDate() + 30);
    date.setHours(19, 0, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }
private async addMeetingToCalendar(meeting: any): Promise<void> {
try {
const permissions = await CapacitorCalendar.requestAllPermissions();

console.log('Calendar permissions:', permissions);

const startDate = new Date(meeting.date);

const endDate = new Date(
  startDate.getTime() + 60 * 60 * 1000
);

// Look up the book being discussed
let bookTitle = '';

if (meeting.bookId) {
  const book = await this.bookService.getBook(meeting.bookId);

  if (book) {
    bookTitle = book.title;
  }
}

const title = bookTitle
  ? `Book Club Meeting — ${bookTitle}`
  : 'Book Club Meeting';

// Make sure location is explicitly a string.
const location = meeting.location
  ? String(meeting.location).trim()
  : '';

console.log('CALENDAR EVENT:', {
  title,
  location,
  startDate,
  endDate,
});

const result = await CapacitorCalendar.createEvent({
  title,
  location,
  startDate: startDate.getTime(),
  endDate: endDate.getTime(),
});

console.log('Calendar event created:', result.result);

} catch (err) {
console.error('Failed to add meeting to calendar:', err);
}
}



}