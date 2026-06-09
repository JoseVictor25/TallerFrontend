import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture.html',
  styleUrls: ['./profile-picture.scss']
})
export class ProfilePicture {
  @Input() photoUrl: string | null = null;
  @Input() username: string = '';
  @Output() click = new EventEmitter<void>();

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }
}