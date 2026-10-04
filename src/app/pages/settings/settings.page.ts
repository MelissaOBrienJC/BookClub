import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon, IonTabButton ,IonTabBar} from '@ionic/angular/standalone';
  import { SeedDataService } from '../../services/seed-data.service';
import { RouterLink } from '@angular/router';
import { BackupService } from '../../services/backup.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonTabButton, IonTabBar,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonTabButton,
    RouterLink
  ],
  templateUrl: './settings.page.html',
})
export class SettingsPage implements OnInit {
   importing = false;
  lastBackupDate: string | null = null;

  constructor(
    private backupService: BackupService,
    private alertController: AlertController,
    private seedDataService: SeedDataService
  ) {}

 ngOnInit(): void {
    this.lastBackupDate = this.backupService.getLastBackupDate();
  }
  async exportData(): Promise<void> {
    try {
      await this.backupService.exportBackup();
       this.lastBackupDate = this.backupService.getLastBackupDate();
      const alert = await this.alertController.create({
        header: 'Backup Created',
        message:
          'Your Book Club data has been exported successfully.',
        buttons: ['OK'],
      });

      await alert.present();
    } catch (err) {
      console.error('Export failed:', err);

      const alert = await this.alertController.create({
        header: 'Export Failed',
        message:
          'There was a problem creating your backup.',
        buttons: ['OK'],
      });

      await alert.present();
    }
  }

  openImportFile(): void {
    if (this.importing) {
      return;
    }

    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      await this.importData(file);
    };

    input.click();
  }

  private async importData(file: File): Promise<void> {
    this.importing = true;

    try {
      const backup = await this.backupService.readBackupFile(file);
      const summary = this.backupService.getBackupSummary(backup);

      const confirm = await this.alertController.create({
        header: 'Import Backup?',
        message:
          `This backup contains ${summary.clubs} clubs, ` +
          `${summary.books} books, and ` +
          `${summary.meetings} meetings.<br><br>` +
          'Importing will replace the data currently on this device.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Import',
            role: 'destructive',
            handler: async () => {
              await this.restoreBackup(backup);
            },
          },
        ],
      });

      await confirm.present();
    } catch (err: any) {
      console.error('Import failed:', err);

      const alert = await this.alertController.create({
        header: 'Import Failed',
        message:
          err?.message ||
          'The selected file could not be imported.',
        buttons: ['OK'],
      });

      await alert.present();
    } finally {
      this.importing = false;
    }
  }

  private async restoreBackup(backup: any): Promise<void> {
    try {
      await this.backupService.restoreBackup(backup);

      const alert = await this.alertController.create({
        header: 'Import Complete',
        message:
          'Your Book Club data has been restored. ' +
          'The app will reload now.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              window.location.reload();
            },
          },
        ],
      });

      await alert.present();
    } catch (err) {
      console.error('Restore failed:', err);

      const alert = await this.alertController.create({
        header: 'Restore Failed',
        message:
          'The backup was valid, but the data could not be restored.',
        buttons: ['OK'],
      });

      await alert.present();
    }
  }

  async confirmDeleteAllData(): Promise<void> {
  const alert = await this.alertController.create({
    header: 'Delete all data?',
    message:
      'This will permanently delete all Book Club data on this device, including clubs, books, meetings, ratings, reviews, notes, and cover images.<br><br>' +
      '<strong>This cannot be undone.</strong>',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'Delete Everything',
        role: 'destructive',
        handler: async () => {
          try {
            await this.backupService.deleteAllData();

            this.seedDataService.markDataDeleted();

            const successAlert = await this.alertController.create({
              header: 'Data Deleted',
              message:
                'All Book Club data has been deleted. The app will reload now.',
              buttons: [
                {
                  text: 'OK',
                  handler: () => {
                    window.location.reload();
                  },
                },
              ],
            });

            await successAlert.present();
          } catch (err) {
            console.error('Delete failed:', err);

            const errorAlert = await this.alertController.create({
              header: 'Delete Failed',
              message:
                'There was a problem deleting the Book Club data.',
              buttons: ['OK'],
            });

            await errorAlert.present();
          }
        },
      },
    ],
  });

  await alert.present();
}
}