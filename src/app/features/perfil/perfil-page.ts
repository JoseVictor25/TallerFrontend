import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonBack } from '../../shared/components/button-back/button-back';
import { Sidebar, SidebarItem } from '../../shared/components/sidebar/sidebar';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';
import { PersonalInfo } from './components/personal-info/personal-info';
import { ChangePassword } from './components/change-password/change-password';
import { ProfilePictureModal } from './components/profile-picture-modal/profile-picture-modal';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [CommonModule, ButtonBack, Sidebar, LoadingSpinner, PersonalInfo, ChangePassword, ProfilePictureModal],
  templateUrl: './perfil-page.html',
  styleUrls: ['./perfil-page.scss']
})
export class PerfilPage implements OnInit {
  profile: UserProfile | null = null;
  isLoading = false;
  isSavingProfile = false;
  sidebarItems: SidebarItem[] = [
    { id: 'personal', label: 'Datos personales', icon: 'fa-user', visible: true },
    { id: 'password', label: 'Cambiar contraseña', icon: 'fa-key', visible: true }
  ];
  activeSidebarItemId: string = 'personal';
  modalVisible = false;

  constructor(
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.profileService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar el perfil');
      }
    });
  }

  onSidebarItemClick(itemId: string) {
    this.activeSidebarItemId = itemId;
  }

  onSaveProfile(data: Partial<UserProfile>) {
    this.isSavingProfile = true;
    this.profileService.updateProfile(data).subscribe({
      next: (updated) => {
        this.loadProfile();
        this.isSavingProfile = false;
        this.notificationService.showSuccess('Perfil actualizado');
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.notificationService.showError(err.error?.detail || 'Error al actualizar perfil');
      }
    });
  }

  openPhotoModal() {
    this.modalVisible = true;
  }

  closePhotoModal() {
    this.modalVisible = false;
  }

  onUploadPhoto(file: File) {
    this.profileService.uploadProfilePhoto(file).subscribe({
      next: (res) => {
        if (this.profile) this.profile.url_img_perfil = res.photo_url;
        this.notificationService.showSuccess('Foto actualizada');
        this.closePhotoModal();
        this.loadProfile(); // para refrescar header (opcional, se puede emitir evento)
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al subir foto');
      }
    });
  }

  onDeletePhoto() {
    this.profileService.deleteProfilePhoto().subscribe({
      next: () => {
        if (this.profile) this.profile.url_img_perfil = null;
        this.notificationService.showSuccess('Foto eliminada');
        this.closePhotoModal();
        this.loadProfile();
      },
      error: (err) => {
        this.notificationService.showError('Error al eliminar foto');
      }
    });
  }

  onRequestOtp() {
    if (!this.profile?.email) return;
    this.profileService.requestPasswordChange(this.profile.email).subscribe({
      next: () => this.notificationService.showSuccess('Código enviado a tu correo'),
      error: (err) => this.notificationService.showError(err.error?.detail || 'Error al enviar código')
    });
  }

  onChangePassword(data: { code: string; newPassword: string }) {
    if (!this.profile?.email) return;
    this.profileService.changePassword(this.profile.email, data.code, data.newPassword).subscribe({
      next: () => {
        this.notificationService.showSuccess('Contraseña actualizada. Inicia sesión nuevamente.');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => this.notificationService.showError(err.error?.detail || 'Error al cambiar contraseña')
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}