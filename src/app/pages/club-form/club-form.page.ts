
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonItem,
  IonButton,
  IonButtons,
  IonNote,
  IonTextarea
} from '@ionic/angular/standalone';
import { ClubService } from '../../services/club.service';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonInput,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonButton,
    IonButtons,
    IonNote,
    IonTextarea
  ],
  templateUrl: './club-form.page.html',
})
export class ClubFormPage {
  form: FormGroup;
  isEdit = false;
  private editId?: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clubService: ClubService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  async ionViewWillEnter() {
    // Always reset these first.
    this.isEdit = false;
    this.editId = undefined;

    // Get the ID from the current route.
    const id = this.route.snapshot.paramMap.get('id');

    console.log('Club form route:', this.router.url);
    console.log('Club form id:', id);

    if (!id) {
      // This is the New Club screen.
      this.form.reset({
        name: '',
        description: '',
      });
      return;
    }

    // This is the Edit Club screen.
    this.isEdit = true;
    this.editId = id;

    const club = await this.clubService.getClub(id);

    if (club) {
      this.form.patchValue({
        name: club.name,
        description: club.description ?? '',
      });
    } else {
      console.error('Club not found for id:', id);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      const saved = await this.clubService.saveClub({
        id: this.editId,
        name: this.form.value.name,
        description: this.form.value.description,
      });

      if (!this.isEdit) {
        await this.clubService.setCurrentClub(saved.id);
      }

      await this.router.navigate(['/club-list']);
    } catch (err) {
      console.error('Failed to save club:', err);
    }
  }

  cancel() {
    this.router.navigate(['/club-list']);
  }
}

