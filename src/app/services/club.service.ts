import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Preferences } from '@capacitor/preferences';
import { DbService } from './db.service';
import { Club } from '../models/club.model';

const STORE = 'clubs';
const CURRENT_CLUB_KEY = 'currentClubId';

@Injectable({ providedIn: 'root' })
export class ClubService {
  constructor(private db: DbService) {}

  async getClubs(): Promise<Club[]> {
    const clubs = await this.db.getAll<Club>(STORE);
    return clubs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  async getClub(id: string): Promise<Club | undefined> {
    return this.db.get<Club>(STORE, id);
  }

  async saveClub(club: Partial<Club> & { name: string }): Promise<Club> {
    const toSave: Club = {
      id: club.id ?? uuidv4(),
      name: club.name,
      description: club.description,
      dateCreated: club.dateCreated ?? new Date().toISOString(),
    };
    await this.db.put(STORE, toSave);
    return toSave;
  }

  async deleteClub(id: string): Promise<void> {
    await this.db.delete(STORE, id);
  }

  async setCurrentClub(clubId: string): Promise<void> {
    await Preferences.set({ key: CURRENT_CLUB_KEY, value: clubId });
  }

  async getCurrentClubId(): Promise<string | null> {
    const { value } = await Preferences.get({ key: CURRENT_CLUB_KEY });
    return value;
  }
}
