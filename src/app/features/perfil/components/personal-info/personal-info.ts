import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputField } from '../../../../shared/components/input-field/input-field';
import { ProfilePicture } from '../../../../shared/components/profile-picture/profile-picture';
import { UserProfile } from '../../../../core/services/profile.service';
import { Button } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule, InputField, ProfilePicture, Button],
  templateUrl: './personal-info.html',
  styleUrls: ['./personal-info.scss']
})
export class PersonalInfo implements OnChanges {
  @Input() profile: UserProfile | null = null;
  @Input() isLoading: boolean = false;
  @Output() saveProfile = new EventEmitter<Partial<UserProfile>>();
  @Output() photoClick = new EventEmitter<void>();

  editData: Partial<UserProfile> = {};

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profile'] && this.profile) {
      this.editData = { ...this.profile };
    }
  }

  onSave() {
    this.saveProfile.emit(this.editData);
  }
}