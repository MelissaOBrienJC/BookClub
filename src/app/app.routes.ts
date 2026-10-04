import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'club-list', pathMatch: 'full' },

  {
    path: 'club-list',
    loadComponent: () => import('./pages/club-list/club-list.page').then((m) => m.ClubListPage),
  },
  {
    path: 'club-form',
    loadComponent: () => import('./pages/club-form/club-form.page').then((m) => m.ClubFormPage),
  },
  {
    path: 'club-form/:id',
    loadComponent: () => import('./pages/club-form/club-form.page').then((m) => m.ClubFormPage),
  },

  {
    path: 'club/:clubId/books',
    loadComponent: () => import('./pages/book-list/book-list.page').then((m) => m.BookListPage),
  },
  {
    path: 'club/:clubId/books/new',
    loadComponent: () => import('./pages/book-form/book-form.page').then((m) => m.BookFormPage),
  },
  {
    path: 'club/:clubId/books/:bookId',
    loadComponent: () => import('./pages/book-form/book-form.page').then((m) => m.BookFormPage),
  },
  {
  path: 'select-club',
  loadComponent: () =>
    import('./pages/select-club/select-club.page')
      .then((m) => m.SelectClubPage),
},
{
  path: 'meetings',
  loadComponent: () =>
    import('./pages/meeting-overview/meeting-overview.page')
      .then((m) => m.MeetingOverviewPage),
},
  {
    path: 'club/:clubId/meetings',
    loadComponent: () =>
      import('./pages/meeting-list/meeting-list.page').then((m) => m.MeetingListPage),
  },
  {
    path: 'club/:clubId/meetings/new',
    loadComponent: () =>
      import('./pages/meeting-form/meeting-form.page').then((m) => m.MeetingFormPage),
  },
  {
    path: 'club/:clubId/meetings/:meetingId',
    loadComponent: () =>
      import('./pages/meeting-form/meeting-form.page').then((m) => m.MeetingFormPage),
  },

  {
    path: 'want-to-read',
    loadComponent: () =>
      import('./pages/want-to-read-list/want-to-read-list.page').then(
        (m) => m.WantToReadListPage
      ),
  },
 {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then(
        (m) => m.SettingsPage
      ),
  },
  {
  path: 'books',
  loadComponent: () =>
    import('./pages/all-books/all-books.page').then(
      (m) => m.AllBooksPage
    ),
},
  {
    path: 'want-to-read/new',
    loadComponent: () => import('./pages/book-form/book-form.page').then((m) => m.BookFormPage),
  },
  {
    path: 'want-to-read/:bookId',
    loadComponent: () => import('./pages/book-form/book-form.page').then((m) => m.BookFormPage),
  },
];
