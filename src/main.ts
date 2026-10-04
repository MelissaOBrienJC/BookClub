import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { APP_INITIALIZER } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  add,
  addCircleOutline,
  removeCircleOutline,
  bookOutline,
  calendarOutline,
  bookmarkOutline,
  libraryOutline,
  star,
  starHalf,
  starOutline,
  optionsOutline,
  addOutline,
  arrowBack,
  settingsOutline
  
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { SeedDataService } from './app/services/seed-data.service';

// Every ion-icon `name` used anywhere in the app must be registered here.
// Without this, icons silently fail to render (console shows "[Ionicons
// Warning]: Could not load icon with name ..."): Ionic CLI-generated
// projects get automatic by-name SVG loading for free via their asset
// pipeline, but a hand-built Angular CLI project (like this one) doesn't
// have that set up, so icons must be registered explicitly instead.
addIcons({
  add,
  'add-circle-outline': addCircleOutline,
  'remove-circle-outline': removeCircleOutline,
  'book-outline': bookOutline,
  calendarOutline,
  bookmarkOutline,
  libraryOutline,
  star,
  'star-half': starHalf,
  'star-outline': starOutline,
  optionsOutline,
  addOutline,
  arrowBack,
  settingsOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
    
  ],
}).catch((err) => console.error(err));