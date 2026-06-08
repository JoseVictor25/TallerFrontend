import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-procesando-pago',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-layout" style="display: flex; min-height: 100vh; background: #2251D5;">
      <div class="form-container" style="margin: auto; width: 100%; max-width: 480px; padding: 2rem;">
        <div class="card" style="background: white; border-radius: 12px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <h2 style="font-size: 1.5rem; color: #111; margin-bottom: 1rem; margin-top: 0;">Procesando Pago</h2>
          
          <div style="background: #e8f5e9; padding: 1.2rem; border-radius: 8px; border: 1px solid #c8e6c9; margin-bottom: 2rem;">
            <p style="color: #2e7d32; font-weight: 600; margin-top: 0; margin-bottom: 0.5rem;"><i class="fas fa-check"></i> Sesión de pago lista</p>
            <p style="color: #4caf50; font-size: 0.9rem; margin: 0;">Serás redirigido a Stripe en unos momentos para completar tu pago de forma segura.</p>
          </div>

          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 1rem;">
              <span style="color: #666;">Plan:</span>
              <span style="font-weight: 600; color: #111; text-transform: capitalize;">{{ planId }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem;">
              <span style="color: #666;">Pago:</span>
              <span style="font-weight: bold; color: #111;">\${{ getPrice() }}/mes</span>
            </div>
          </div>

          <div style="text-align: center; color: #888; font-size: 0.8rem; margin-top: 3rem;">
            <i class="fas fa-lock"></i> Transacción segura con Stripe
          </div>

          <div *ngIf="error" style="color: #d32f2f; margin-top: 1rem; text-align: center; font-size: 0.9rem;">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProcesandoPagoComponent implements OnInit {
  planId = 'basico';
  error: string | null = null;
  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.planId = params['plan'] || 'basico';
      this.iniciarPago();
    });
  }

  getPrice() {
    if (this.planId === 'basico') return '150';
    if (this.planId === 'pro' || this.planId === 'estandar') return '300';
    if (this.planId === 'premium') return '600';
    return '150';
  }

  iniciarPago() {
    const tallerName = localStorage.getItem('taller_name') || '';
    
    // Obtener la URL actual para que Stripe sepa adónde regresar
    const successUrl = `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/suscripcion?plan=${this.planId}`;

    // Siempre redirigir a Stripe, independientemente de si es local o producción
    this.http.post<{ url: string }>(
      `${this.apiUrl}/tenants/subscribe?plan=${this.planId}&taller_name=${encodeURIComponent(tallerName)}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`, 
      {}
    ).subscribe({
      next: (response) => {
        window.location.href = response.url; // Redirigir al Checkout de Stripe
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          alert("La sesión expiró. Inicia sesión de nuevo.");
          window.location.href = '/login';
        } else {
          this.error = 'Ocurrió un error al intentar generar el link de pago seguro de Stripe.';
          console.error(err);
        }
      }
    });
  }
}
