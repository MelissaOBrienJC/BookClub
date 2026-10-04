import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const BACKUP_FORMAT = 'book-club-backup';
const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = 'book-club-last-backup';
export interface BookClubBackup {
  format: string;
  version: number;
  exportedAt: string;
  appVersion?: string;
  data: {
    clubs: any[];
    books: any[];
    meetings: any[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly stores = ['clubs', 'books', 'meetings'] as const;

  constructor(private db: DbService) {}

  /**
   * Collect all application data into one backup object.
   */
  async createBackup(): Promise<BookClubBackup> {
    const clubs = await this.db.getAll('clubs');
    const books = await this.db.getAll('books');
    const meetings = await this.db.getAll('meetings');

    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        clubs,
        books,
        meetings,
      },
    };
  }
 /**
   * Export the backup as a JSON file, compatible with both iOS/Android and web browsers.
   */
  async exportBackup(): Promise<void> {
    const backup = await this.createBackup();
    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `book-club-backup-${date}.json`;

    if (Capacitor.isNativePlatform()) {
      // 1. Write the file to the device's temporary cache directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      // 2. Open the native iOS/Android share/export sheet
      await Share.share({
        title: 'Book Club Backup',
        url: savedFile.uri, // Passes the native file path to the share sheet
        dialogTitle: 'Save or Share Backup',
      });
    } else {
      // Fallback for regular web browsers (PWA / Desktop web)
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Remember when the last backup was created.
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  }


  /**
   * Check whether an object looks like a Book Club backup.
   */
  validateBackup(value: any): value is BookClubBackup {
    if (!value || typeof value !== 'object') {
      return false;
    }

    if (value.format !== BACKUP_FORMAT) {
      return false;
    }

    if (typeof value.version !== 'number') {
      return false;
    }

    if (!value.data || typeof value.data !== 'object') {
      return false;
    }

    if (!Array.isArray(value.data.clubs)) {
      return false;
    }

    if (!Array.isArray(value.data.books)) {
      return false;
    }

    if (!Array.isArray(value.data.meetings)) {
      return false;
    }

    return true;
  }

  /**
   * Read and validate a JSON backup file.
   */
  async readBackupFile(file: File): Promise<BookClubBackup> {
    const text = await file.text();

    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The selected file is not valid JSON.');
    }

    if (!this.validateBackup(parsed)) {
      throw new Error(
        'This file is not a valid Book Club backup.'
      );
    }

    if (parsed.version !== BACKUP_VERSION) {
      throw new Error(
        `This backup uses version ${parsed.version}, but this app supports version ${BACKUP_VERSION}.`
      );
    }

    return parsed;
  }

  /**
   * Replace all current application data with the backup data.
   */
  async restoreBackup(backup: BookClubBackup): Promise<void> {
  if (!this.validateBackup(backup)) {
    throw new Error('Invalid Book Club backup.');
  }

  if (backup.version !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version: ${backup.version}`
    );
  }

  await this.db.replaceAll({
    clubs: backup.data.clubs,
    books: backup.data.books,
    meetings: backup.data.meetings,
  });
}

async deleteAllData(): Promise<void> {
  await this.db.clearAll();
}

  /**
   * Get useful information to display before importing.
   */
  getBackupSummary(backup: BookClubBackup): {
    clubs: number;
    books: number;
    meetings: number;
    exportedAt: string;
  } {
    return {
      clubs: backup.data.clubs.length,
      books: backup.data.books.length,
      meetings: backup.data.meetings.length,
      exportedAt: backup.exportedAt,
    };
  }
getLastBackupDate(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}


}