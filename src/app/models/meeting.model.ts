export interface Meeting {
  id: string;
  clubId: string;
  bookId?: string;
  date: string; // ISO datetime
  location?: string;
  notes?: string;
}
