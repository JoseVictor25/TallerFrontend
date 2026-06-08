import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f8f9fa;">
      <div style="background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
        
        <!-- Estado de carga -->
        <div *ngIf="isVerifying">
          <i class="fas fa-spinner fa-spin" style="font-size: 4rem; color: #932D30; margin-bottom: 1.5rem;"></i>
          <h2 style="color: #333;">Verificando tu pago...</h2>
          <p style="color: #666;">Por favor espera un momento mientras configuramos tu taller.</p>
        </div>

        <!-- Estado de éxito -->
        <div *ngIf="!isVerifying && isSuccess">
          <i class="fas fa-check-circle" style="font-size: 5rem; color: #28a745; margin-bottom: 1.5rem; animation: popIn 0.5s ease-out;"></i>
          <h2 style="color: #333; margin-bottom: 1rem;">¡Pago Exitoso!</h2>
          <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem;">
            Tu suscripción ha sido procesada correctamente. Hemos creado tu espacio de taller y ahora tienes el rol de <b>Administrador del Taller</b>.
          </p>
          <button 
            (click)="irAlDashboard()"
            style="background-color: #932D30; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1.1rem; cursor: pointer; font-weight: bold; width: 100%;">
            Ir a mi Panel de Taller
          </button>
        </div>

        <!-- Estado de error -->
        <div *ngIf="!isVerifying && !isSuccess">
          <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 1.5rem;"></i>
          <h2 style="color: #333;">Hubo un problema</h2>
          <p style="color: #666;">No pudimos verificar el pago de tu suscripción. Es posible que el pago no se haya completado o haya ocurrido un error.</p>
          <button 
            (click)="irAlDashboard()"
            style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 1rem;">
            Volver al inicio
          </button>
        </div>

      </div>
    </div>
    <style>
      @keyframes popIn {
        0% { transform: scale(0.5); opacity: 0; }
        70% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `
})
export class PaymentSuccessComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  apiUrl = environment.apiUrl;
  
  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      if (sessionId) {
        this.verificarSesion(sessionId);
      } else {
        // Si no hay session_id pero estamos en local, asumimos exito para pruebas
        if (!environment.production) {
          this.isVerifying = false;
          this.isSuccess = true;
          this.recargarPerfil();
        } else {
          this.isVerifying = false;
          this.isSuccess = false;
        }
        this.cdr.detectChanges();
      }
    });
  }

  verificarSesion(sessionId: string) {
    this.http.post<any>(`${this.apiUrl}/tenants/verify-session?session_id=${sessionId}`, {}).subscribe({
      next: (res) => {
        if (res.status === 'success' || res.status === 'already_processed') {
          this.isSuccess = true;
          this.recargarPerfil();
        } else {
          this.isSuccess = false;
        }
        this.isVerifying = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al verificar sesión:', err);
        this.isSuccess = false;
        this.isVerifying = false;
        this.cdr.detectChanges();
      }
    });
  }

  recargarPerfil() {
    this.http.get<any>(`${this.apiUrl}/perfil/me`).subscribe();
  }

  irAlDashboard(): void {
    window.location.href = '/dashboard';
  }
}
