
import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SeedDataService } from './services/seed-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>

      @if (loading) {
      <div class="startup-screen">
  Loading...
</div>
      } @else {
        <ion-router-outlet></ion-router-outlet>
      }

    </ion-app>
  `,
  styles: [`
    .startup-screen {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: #faf8f5  ;
      color: #000000;

      display: flex;
      align-items: center;
      justify-content: center;

      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 20px;
    }
  `]
})
export class AppComponent implements OnInit {

  loading = true;

  constructor(
    private seedData: SeedDataService
  ) {}

  async ngOnInit() {
    try {
      await this.seedData.ensureSeeded();
    } catch (error) {
      console.error('Error seeding database:', error);
    } finally {
      this.loading = false;
    }
  }
}

