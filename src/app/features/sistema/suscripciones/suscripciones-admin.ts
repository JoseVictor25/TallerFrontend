import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuscripcionService, SuscripcionActiva } from '../../../../core/services/suscripcion.service';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-suscripciones-admin',
  standalone: true,
  imports: [CommonModule, LoadingSpinner],
  templateUrl: './suscripciones-admin.html',
  styleUrls: ['./suscripciones-admin.scss']
})
export class SuscripcionesAdmin implements OnInit {
  suscripciones: SuscripcionActiva[] = [];
  isLoading = true;
  error = '';

  constructor(private suscripcionService: SuscripcionService) {}

  ngOnInit() {
    this.loadSuscripciones();
  }

  loadSuscripciones() {
    this.isLoading = true;
    this.suscripcionService.getSuscripcionesActivas().subscribe({
      next: (data) => {
        this.suscripciones = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las suscripciones';
        this.isLoading = false;
      }
    });
  }

  getPlanClass(plan: string): string {
    if (plan.includes('Básico')) return 'plan-basico';
    if (plan.includes('Pro')) return 'plan-pro';
    if (plan.includes('Premium')) return 'plan-premium';
    return 'plan-default';
  }

  getStatusClass(status: string): string {
    if (status === 'active') return 'status-active';
    if (status === 'canceled') return 'status-canceled';
    if (status === 'past_due') return 'status-past-due';
    return 'status-error';
  }
  
  formatStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Activa',
      'canceled': 'Cancelada',
      'past_due': 'Pago atrasado',
      'unpaid': 'No pagada'
    };
    return statusMap[status] || status;
  }
}
