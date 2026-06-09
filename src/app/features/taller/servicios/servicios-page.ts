import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TallerServiciosService,
  SolicitudServicioList,
  SolicitudServicioDetalle,
  TecnicoDisponible,
  VehiculoDisponible,
  Servicio,
  EstadoHistorial,
  MetricaServicio,
  Valoracion
} from '../../../core/services/taller-servicios.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Button } from '../../../shared/components/button/button';
import { Modal } from '../../../shared/components/modal/modal';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Map } from '../../../shared/components/map/map';

@Component({
  selector: 'app-servicios-taller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Modal, LoadingSpinner, Map],
  templateUrl: './servicios-page.html',
  styleUrls: ['./servicios-page.scss']
})
export class ServiciosTallerPage implements OnInit {
  @Input() tallerId: number = 0;

  isLoading = false;
  activeTab: 'recientes' | 'historico' | 'en-proceso' | 'historico-servicios' = 'recientes';

  // Solicitudes
  solicitudesRecientes: SolicitudServicioList[] = [];
  solicitudesHistorico: SolicitudServicioList[] = [];

  // Servicios
  serviciosEnProceso: Servicio[] = [];
  serviciosHistorico: Servicio[] = [];

  // Modal detalle solicitud
  showDetalleModal = false;
  solicitudDetalle: SolicitudServicioDetalle | null = null;

  // Modal cotización
  showCotizarModal = false;
  solicitudIdCotizar: number | null = null;
  costoEstimado: number | null = null;

  // Modal asignación
  showAsignacionModal = false;
  solicitudIdAsignar: number | null = null;
  tecnicosDisponibles: TecnicoDisponible[] = [];
  vehiculosDisponibles: VehiculoDisponible[] = [];
  tecnicosSeleccionados: number[] = [];
  vehiculosSeleccionados: number[] = [];

  // Modal mapa
  showMapaModal = false;
  ubicacionMapa: { lat: number; lon: number } | null = null;

  // Modal confirmar rechazo
  showRechazarModal = false;
  solicitudIdRechazar: number | null = null;

  // Modal completar servicio
  showCompletarModal = false;
  servicioIdCompletar: number | null = null;

  // Modal seguimiento (historial de estados)
  showSeguimientoModal = false;
  servicioIdSeguimiento: number | null = null;
  historialEstados: EstadoHistorial[] = [];
  loadingHistorial = false;

  // Modal métricas
  showMetricasModal = false;
  servicioIdMetricas: number | null = null;
  metricasServicio: MetricaServicio | null = null;
  loadingMetricas = false;

  // Valoraciones por servicio (cache)
  valoracionesCache: { [key: number]: Valoracion | null | undefined } = {};

  constructor(
    private serviciosService: TallerServiciosService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.tallerId) {
      this.cargarSolicitudesRecientes();
    }
  }

  ngOnChanges(): void {
    if (this.tallerId) {
      this.cargarDatosSegunTab();
    }
  }

  // ============================================================
  // TABS
  // ============================================================

  changeTab(tab: 'recientes' | 'historico' | 'en-proceso' | 'historico-servicios') {
    this.activeTab = tab;
    this.cargarDatosSegunTab();
  }

  cargarDatosSegunTab() {
    switch (this.activeTab) {
      case 'recientes':
        this.cargarSolicitudesRecientes();
        break;
      case 'historico':
        this.cargarSolicitudesHistorico();
        break;
      case 'en-proceso':
        this.cargarServiciosEnProceso();
        break;
      case 'historico-servicios':
        this.cargarServiciosHistorico();
        break;
    }
  }

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  cargarSolicitudesRecientes() {
    this.isLoading = true;
    this.serviciosService.listarSolicitudesRecientes(this.tallerId, 60).subscribe({
      next: (data) => {
        this.solicitudesRecientes = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar solicitudes recientes');
        this.cdr.detectChanges();
      }
    });
  }

  cargarSolicitudesHistorico() {
    this.isLoading = true;
    this.serviciosService.listarSolicitudesHistorico(this.tallerId).subscribe({
      next: (data) => {
        this.solicitudesHistorico = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar historial de solicitudes');
        this.cdr.detectChanges();
      }
    });
  }

  cargarServiciosEnProceso() {
    this.isLoading = true;
    this.serviciosService.listarServiciosEnProceso(this.tallerId).subscribe({
      next: (data) => {
        this.serviciosEnProceso = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar servicios en proceso');
        this.cdr.detectChanges();
      }
    });
  }

  cargarServiciosHistorico() {
    this.isLoading = true;
    this.serviciosService.listarServiciosHistorico(this.tallerId).subscribe({
      next: (data) => {
        this.serviciosHistorico = data;
        this.isLoading = false;
        // Cargar valoraciones para servicios finalizados
        this.cargarValoracionesHistorico();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notificationService.showError('Error al cargar historial de servicios');
        this.cdr.detectChanges();
      }
    });
  }

  cargarValoracionesHistorico() {
    // Cargar valoraciones solo para servicios finalizados
    const serviciosFinalizados = this.serviciosHistorico.filter(
      s => s.estado === 'finalizado' || s.estado === 'completado'
    );
    
    serviciosFinalizados.forEach(servicio => {
      this.serviciosService.obtenerValoracionServicio(servicio.id, this.tallerId).subscribe({
        next: (valoracion) => {
          this.valoracionesCache[servicio.id] = valoracion;
          this.cdr.detectChanges();
        },
        error: () => {
          this.valoracionesCache[servicio.id] = null;
        }
      });
    });
  }

  getValoracion(servicioId: number): Valoracion | null | undefined {
    return this.valoracionesCache[servicioId];
  }

  generarEstrellas(puntos: number): string[] {
    return Array(5).fill('').map((_, i) => i < puntos ? '★' : '☆');
  }

  // ============================================================
  // MODAL DETALLE SOLICITUD
  // ============================================================

  verDetalleSolicitud(solicitudId: number) {
    this.serviciosService.obtenerDetalleSolicitud(solicitudId, this.tallerId).subscribe({
      next: (data) => {
        this.solicitudDetalle = data;
        console.log('Solicitud detalle:', data);
        console.log('Evidencias:', data.evidencias);
        console.log('Fotos:', data.evidencias.filter(e => e.tipo === 'imagen'));
        console.log('Audio:', data.evidencias.filter(e => e.tipo === 'audio'));
        this.showDetalleModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.showError('Error al cargar detalle de solicitud');
      }
    });
  }

  closeDetalleModal() {
    this.showDetalleModal = false;
    this.solicitudDetalle = null;
    this.cdr.detectChanges();
  }

  // ============================================================
  // ACCIONES SOBRE SOLICITUDES
  // ============================================================

  abrirModalCotizar(solicitudId: number) {
    this.solicitudIdCotizar = solicitudId;
    this.costoEstimado = null;
    this.showCotizarModal = true;
    this.closeDetalleModal();
    this.cdr.detectChanges();
  }

  closeCotizarModal() {
    this.showCotizarModal = false;
    this.solicitudIdCotizar = null;
    this.costoEstimado = null;
    this.cdr.detectChanges();
  }

  confirmarCotizar() {
    if (!this.solicitudIdCotizar || this.costoEstimado === null || this.costoEstimado <= 0) {
      this.notificationService.showError('Ingrese un costo estimado válido');
      return;
    }

    const data = {
      costo_estimado: this.costoEstimado
    };

    this.serviciosService.cotizarSolicitud(this.solicitudIdCotizar, this.tallerId, data).subscribe({
      next: () => {
        this.closeCotizarModal();
        setTimeout(() => {
          this.notificationService.showSuccess('Solicitud cotizada exitosamente. Esperando respuesta del cliente.');
          this.cargarDatosSegunTab();
        }, 0);
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al cotizar solicitud');
      }
    });
  }

  abrirModalAsignacion(solicitudId: number) {
    this.solicitudIdAsignar = solicitudId;
    this.tecnicosSeleccionados = [];
    this.vehiculosSeleccionados = [];
    
    // Cargar recursos disponibles
    this.serviciosService.listarTecnicosDisponibles(this.tallerId).subscribe({
      next: (tecnicos) => {
        this.tecnicosDisponibles = tecnicos;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.showError('Error al cargar técnicos disponibles');
      }
    });

    this.serviciosService.listarVehiculosDisponibles(this.tallerId).subscribe({
      next: (vehiculos) => {
        this.vehiculosDisponibles = vehiculos;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.showError('Error al cargar vehículos disponibles');
      }
    });

    this.showAsignacionModal = true;
    this.closeDetalleModal();
    this.cdr.detectChanges();
  }

  closeAsignacionModal() {
    this.showAsignacionModal = false;
    this.solicitudIdAsignar = null;
    this.tecnicosSeleccionados = [];
    this.vehiculosSeleccionados = [];
    this.cdr.detectChanges();
  }

  toggleTecnico(tecnicoId: number) {
    const index = this.tecnicosSeleccionados.indexOf(tecnicoId);
    if (index > -1) {
      this.tecnicosSeleccionados.splice(index, 1);
    } else {
      this.tecnicosSeleccionados.push(tecnicoId);
    }
  }

  toggleVehiculo(vehiculoId: number) {
    const index = this.vehiculosSeleccionados.indexOf(vehiculoId);
    if (index > -1) {
      this.vehiculosSeleccionados.splice(index, 1);
    } else {
      this.vehiculosSeleccionados.push(vehiculoId);
    }
  }

  confirmarAceptar() {
    if (!this.solicitudIdAsignar) return;

    if (this.tecnicosSeleccionados.length === 0) {
      this.notificationService.showError('Debe seleccionar al menos un técnico');
      return;
    }

    if (this.vehiculosSeleccionados.length === 0) {
      this.notificationService.showError('Debe seleccionar al menos un vehículo');
      return;
    }

    const data = {
      id_solicitud_servicio: this.solicitudIdAsignar,
      tecnicos_ids: this.tecnicosSeleccionados,
      vehiculos_ids: this.vehiculosSeleccionados
    };

    this.serviciosService.iniciarServicio(this.solicitudIdAsignar, this.tallerId, data).subscribe({
      next: () => {
        this.closeAsignacionModal();
        setTimeout(() => {
          this.notificationService.showSuccess('Servicio iniciado y recursos asignados');
          this.cargarDatosSegunTab();
        }, 0);
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al iniciar servicio');
      }
    });
  }

  abrirModalRechazar(solicitudId: number) {
    this.solicitudIdRechazar = solicitudId;
    this.showRechazarModal = true;
    this.closeDetalleModal();
    this.cdr.detectChanges();
  }

  closeRechazarModal() {
    this.showRechazarModal = false;
    this.solicitudIdRechazar = null;
    this.cdr.detectChanges();
  }

  confirmarRechazar() {
    if (!this.solicitudIdRechazar) return;

    this.serviciosService.rechazarSolicitud(this.solicitudIdRechazar, this.tallerId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Solicitud rechazada');
        this.closeRechazarModal();
        this.cargarDatosSegunTab();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al rechazar solicitud');
        this.closeRechazarModal();
      }
    });
  }

  // ============================================================
  // ACCIONES SOBRE SERVICIOS
  // ============================================================

  abrirModalCompletar(servicioId: number) {
    this.servicioIdCompletar = servicioId;
    this.showCompletarModal = true;
    this.cdr.detectChanges();
  }

  closeCompletarModal() {
    this.showCompletarModal = false;
    this.servicioIdCompletar = null;
    this.cdr.detectChanges();
  }

  confirmarCompletar() {
    if (!this.servicioIdCompletar) return;

    this.serviciosService.completarServicio(this.servicioIdCompletar, this.tallerId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Servicio completado exitosamente');
        this.closeCompletarModal();
        this.cargarDatosSegunTab();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.detail || 'Error al completar servicio');
        this.closeCompletarModal();
      }
    });
  }

  // ============================================================
  // MAPA
  // ============================================================

  verEnMapa(ubicacion: string) {
    const [lat, lon] = ubicacion.split(',').map(Number);
    this.ubicacionMapa = { lat, lon };
    this.showMapaModal = true;
    this.cdr.detectChanges();
  }

  closeMapaModal() {
    this.showMapaModal = false;
    this.ubicacionMapa = null;
    this.cdr.detectChanges();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  formatFecha(fecha: string): string {
    if (!fecha) return '-';
    // Si la fecha no tiene indicador de zona horaria (Z o +hh:mm), asumimos que es UTC
    let fechaUtc = fecha;
    if (fecha.indexOf('T') !== -1 && !fecha.endsWith('Z') && !fecha.match(/[+-]\d{2}:\d{2}$/)) {
      fechaUtc += 'Z';
    }
    return new Date(fechaUtc).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  onImageError(event: any, evidencia: any): void {
    console.error('Error loading image:', evidencia);
    console.error('Image URL:', evidencia.url);
    console.error('Image type:', evidencia.tipo);
  }

  getEstadoClass(estado: string): string {
    const map: any = {
      // Estados de solicitud
      'pendiente': 'estado-pendiente',
      'cotizada': 'estado-cotizada',
      'aceptada': 'estado-aceptada',
      'rechazada': 'estado-rechazada',
      'cancelada': 'estado-cancelada',
      // Estados de servicio (nuevos)
      'creado': 'estado-creado',
      'tecnico_asignado': 'estado-tecnico-asignado',
      'en_camino': 'estado-en-camino',
      'en_lugar': 'estado-en-lugar',
      'en_atencion': 'estado-en-atencion',
      'finalizado': 'estado-finalizado',
      // Estados antiguos (por compatibilidad temporal)
      'en_proceso': 'estado-en-proceso',
      'completado': 'estado-completado',
      'cancelado': 'estado-cancelada'
    };
    return map[estado] || '';
  }

  getEstadoTexto(estado: string): string {
    const map: any = {
      // Estados de solicitud
      'pendiente': 'Pendiente',
      'cotizada': 'Cotizada (Esperando cliente)',
      'aceptada': 'Aceptada (Lista para iniciar)',
      'rechazada': 'Rechazada',
      'cancelada': 'Cancelada',
      // Estados de servicio (nuevos)
      'creado': 'Creado',
      'tecnico_asignado': 'Técnico Asignado',
      'en_camino': 'En Camino',
      'en_lugar': 'En el Lugar',
      'en_atencion': 'En Atención',
      'finalizado': 'Finalizado',
      // Estados antiguos (por compatibilidad temporal)
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado por Cliente'
    };
    return map[estado] || estado;
  }

  getSugeridoPorText(sugerido: string): string {
    return sugerido === 'ia' ? 'IA' : 'Conductor';
  }

  // ============================================================
  // SEGUIMIENTO (HISTORIAL DE ESTADOS)
  // ============================================================

  abrirModalSeguimiento(servicioId: number) {
    this.servicioIdSeguimiento = servicioId;
    this.historialEstados = [];
    this.loadingHistorial = true;
    this.showSeguimientoModal = true;
    this.cdr.detectChanges();

    this.serviciosService.obtenerHistorialEstados(servicioId, this.tallerId).subscribe({
      next: (data) => {
        this.historialEstados = data;
        this.loadingHistorial = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingHistorial = false;
        this.notificationService.showError('Error al cargar historial de estados');
        this.cdr.detectChanges();
      }
    });
  }

  closeSeguimientoModal() {
    this.showSeguimientoModal = false;
    this.servicioIdSeguimiento = null;
    this.historialEstados = [];
    this.cdr.detectChanges();
  }

  // ============================================================
  // MÉTRICAS
  // ============================================================

  abrirModalMetricas(servicioId: number) {
    this.servicioIdMetricas = servicioId;
    this.metricasServicio = null;
    this.loadingMetricas = true;
    this.showMetricasModal = true;
    this.cdr.detectChanges();

    this.serviciosService.obtenerMetricasServicio(servicioId, this.tallerId).subscribe({
      next: (data) => {
        this.metricasServicio = data;
        this.loadingMetricas = false;
        this.cdr.detectChanges();
        
        // Generar gráfica después de que se carguen los datos
        setTimeout(() => this.generarGraficaMetricas(), 100);
      },
      error: (err) => {
        this.loadingMetricas = false;
        this.notificationService.showError(
          err.error?.detail || 'Error al cargar métricas del servicio'
        );
        this.cdr.detectChanges();
      }
    });
  }

  closeMetricasModal() {
    this.showMetricasModal = false;
    this.servicioIdMetricas = null;
    this.metricasServicio = null;
    this.cdr.detectChanges();
  }

  generarGraficaMetricas() {
    if (!this.metricasServicio) return;

    const canvas = document.getElementById('metricasChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Datos para la gráfica
    const datos = [
      {
        label: 'Tiempo de Respuesta',
        valor: this.metricasServicio.tiempo_respuesta_segundos || 0,
        color: '#3498db'
      },
      {
        label: 'Tiempo de Llegada',
        valor: this.metricasServicio.tiempo_llegada_segundos || 0,
        color: '#f39c12'
      },
      {
        label: 'Tiempo de Resolución',
        valor: this.metricasServicio.tiempo_resolucion_segundos || 0,
        color: '#27ae60'
      }
    ];

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configuración
    const padding = 40;
    const barWidth = 60;
    const maxValue = Math.max(...datos.map(d => d.valor));
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;

    // Dibujar ejes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();
    
    // Eje X
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Dibujar barras
    const barSpacing = chartWidth / datos.length;
    
    datos.forEach((dato, index) => {
      const barHeight = maxValue > 0 ? (dato.valor / maxValue) * chartHeight : 0;
      const x = padding + (index * barSpacing) + (barSpacing - barWidth) / 2;
      const y = canvas.height - padding - barHeight;

      // Barra
      ctx.fillStyle = dato.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Valor encima de la barra
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      const tiempoTexto = this.formatearSegundos(dato.valor);
      ctx.fillText(tiempoTexto, x + barWidth / 2, y - 5);

      // Label debajo
      ctx.fillText(dato.label, x + barWidth / 2, canvas.height - padding + 20);
    });
  }

  formatearSegundos(segundos: number): string {
    if (segundos < 60) {
      return `${segundos}s`;
    } else if (segundos < 3600) {
      const minutos = Math.floor(segundos / 60);
      const segs = segundos % 60;
      return segs > 0 ? `${minutos}m ${segs}s` : `${minutos}m`;
    } else {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      return minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`;
    }
  }

  formatearTiempo(tiempo: string | undefined): string {
    return tiempo || 'N/A';
  }
}
