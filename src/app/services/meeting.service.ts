import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { DbService } from './db.service';
import { Meeting } from '../models/meeting.model';

const STORE = 'meetings';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  constructor(private db: DbService) {}

  async getMeetingsForClub(clubId: string): Promise<Meeting[]> {
    const meetings = await this.db.getAll<Meeting>(STORE);
    return meetings.filter((m) => m.clubId === clubId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.db.get<Meeting>(STORE, id);
  }

  async saveMeeting(meeting: Partial<Meeting> & { clubId: string; date: string }): Promise<Meeting> {
    const toSave: Meeting = {
      id: meeting.id ?? uuidv4(),
      clubId: meeting.clubId,
      bookId: meeting.bookId,
      date: meeting.date,
      location: meeting.location,
      notes: meeting.notes,
    };
    await this.db.put(STORE, toSave);
    return toSave;
  }

  async deleteMeeting(id: string): Promise<void> {
    await this.db.delete(STORE, id);
  }
}
