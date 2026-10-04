import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ClubService } from './club.service';
import { BackupService, BookClubBackup } from './backup.service';

// Bundled as a static asset - regenerate by exporting a backup from the app
// and overwriting this file whenever you want to change the seed data.
const SEED_DATA_URL = 'assets/book-club-seed.json';

const DATA_DELETED_KEY = 'book-club-data-deleted';

@Injectable({ providedIn: 'root' })
export class SeedDataService {
  constructor(
    private clubService: ClubService,
    private backupService: BackupService,
    private http: HttpClient
  ) {}

  async ensureSeeded(): Promise<void> {
    const dataWasDeleted = localStorage.getItem(DATA_DELETED_KEY);

    if (dataWasDeleted === 'true') {
      return;
    }

    const existingClubs = await this.clubService.getClubs();

    if (existingClubs.length > 0) {
      return; // real data already present - never overwrite it
    }

    try {
      const backup = await firstValueFrom(
        this.http.get<BookClubBackup>(SEED_DATA_URL)
      );

      if (!this.backupService.validateBackup(backup)) {
        console.warn(
          'Seed data: bundled seed file failed validation - skipping.'
        );
        return;
      }

      await this.backupService.restoreBackup(backup);
    } catch (err) {
      console.warn(
        'Seed data failed to load (app still works fine without it):',
        err
      );
    }
  }

  markDataDeleted(): void {
    localStorage.setItem(DATA_DELETED_KEY, 'true');
  }
}