import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TallerServiciosService, SolicitudServicioList, TecnicoDisponible, VehiculoDisponible, SolicitudServicioDetalle } from '../../../core/services/taller-servicios.service';
import { WebSocketService, WsMessage } from '../../../core/services/websocket.service';
import { Subscription } from 'rxjs';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Modal } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-solicitudes-taller-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinner, Modal],
  templateUrl: './solicitudes-taller-page.html',
  styleUrls: ['./solicitudes-taller-page.scss']
})
export class SolicitudesTallerPage implements OnChanges, OnInit, OnDestroy {
  @Input() tallerId!: number;

  solicitudes: SolicitudServicioList[] = [];
  isLoading = false;

  // Modal State
  showAceptarModal = false;
  showCotizarModal = false;
  selectedSolicitudId: number | null = null;
  isSubmitting = false;

  cotizacionMonto: number | null = null;
  solicitudDetalle: SolicitudServicioDetalle | null = null;
  isLoadingDetalle = false;

  // Data for Selects
  tecnicosDisponibles: TecnicoDisponible[] = [];
  vehiculosDisponibles: VehiculoDisponible[] = [];

  // Selections
  selectedTecnicoId: number | null = null;
  selectedVehiculoId: number | null = null;

  // WebSocket
  private wsSubscription: Subscription | null = null;
  private pingInterval: any = null;
  wsNotificacion: string | null = null;
  private notificacionTimeout: any = null;

  constructor(
    private tallerServiciosService: TallerServiciosService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.tallerId) {
      this.cargarSolicitudes();
      this.conectarWebSocket();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tallerId'] && this.tallerId && !changes['tallerId'].isFirstChange()) {
      this.cargarSolicitudes();
      this.conectarWebSocket();
    }
  }

  ngOnDestroy(): void {
    this.desconectarWebSocket();
  }

  /**
   * Conecta al canal WebSocket del taller para recibir notificaciones en tiempo real.
   */
  private conectarWebSocket(): void {
    this.desconectarWebSocket();
    if (!this.tallerId) return;

    const channel = `taller/${this.tallerId}`;
    const token = localStorage.getItem('access_token') || '';

    this.wsSubscription = this.wsService.connect(channel, token).subscribe((mensaje: WsMessage) => {
      // Ignorar mensajes de conexión y pong
      if (mensaje.tipo === 'conexion_establecida' || mensaje.tipo === 'pong') return;

      console.log('WS Notificación recibida:', mensaje);

      // Mostrar notificación visual
      let textoNotificacion = '';

      switch (mensaje.tipo) {
        case 'nueva_solicitud':
          textoNotificacion = `📩 Nueva solicitud de servicio recibida`;
          break;
        case 'solicitud_cotizada':
          textoNotificacion = `💰 Cotización enviada - Solicitud #${mensaje['solicitud_id']}`;
          break;
        case 'solicitud_rechazada':
          textoNotificacion = `❌ Solicitud #${mensaje['solicitud_id']} rechazada`;
          break;
        case 'cotizacion_respondida':
          const aceptada = mensaje['aceptada'];
          textoNotificacion = aceptada
            ? `✅ Cotización ACEPTADA - Solicitud #${mensaje['solicitud_id']}`
            : `❌ Cotización RECHAZADA - Solicitud #${mensaje['solicitud_id']}`;
          break;
        case 'estado_actualizado':
          textoNotificacion = `🔄 Servicio #${mensaje['servicio_id']} - ${mensaje['estado_descripcion'] || mensaje['estado']}`;
          break;
        default:
          textoNotificacion = `Actualización: ${mensaje.tipo}`;
      }

      this.mostrarNotificacion(textoNotificacion);

      // Recargar la lista de solicitudes automáticamente
      this.cargarSolicitudes();
    });

    // Ping cada 30 segundos
    this.pingInterval = setInterval(() => {
      this.wsService.ping(channel);
    }, 30000);
  }

  private desconectarWebSocket(): void {
    this.wsSubscription?.unsubscribe();
    this.wsSubscription = null;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.tallerId) {
      this.wsService.disconnect(`taller/${this.tallerId}`);
    }
  }

  private mostrarNotificacion(texto: string): void {
    this.wsNotificacion = texto;
    this.cdr.detectChanges();

    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }
    this.notificacionTimeout = setTimeout(() => {
      this.wsNotificacion = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  cargarSolicitudes() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.tallerServiciosService.listarSolicitudesRecientes(this.tallerId).subscribe({
      next: (data: any) => {
        // Ocultar las solicitudes que ya tienen un servicio iniciado
        this.solicitudes = data.filter((s: any) => !s.tiene_servicio);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar solicitudes recientes', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  aceptarSolicitud(solicitudId: number) {
    this.selectedSolicitudId = solicitudId;
    this.selectedTecnicoId = null;
    this.selectedVehiculoId = null;
    
    // Cargar técnicos y vehículos disponibles
    this.tallerServiciosService.listarTecnicosDisponibles(this.tallerId).subscribe({
      next: (tecnicos) => this.tecnicosDisponibles = tecnicos,
      error: (err) => console.error('Error al cargar técnicos', err)
    });

    this.tallerServiciosService.listarVehiculosDisponibles(this.tallerId).subscribe({
      next: (vehiculos) => this.vehiculosDisponibles = vehiculos,
      error: (err) => console.error('Error al cargar vehículos', err)
    });

    this.showAceptarModal = true;
  }

  cerrarModal() {
    this.showAceptarModal = false;
    this.showCotizarModal = false;
    this.selectedSolicitudId = null;
    this.cotizacionMonto = null;
    this.solicitudDetalle = null;
  }

  abrirCotizar(solicitudId: number) {
    this.selectedSolicitudId = solicitudId;
    this.cotizacionMonto = null;
    this.solicitudDetalle = null;
    this.showCotizarModal = true;
    this.isLoadingDetalle = true;
    this.cdr.detectChanges();

    this.tallerServiciosService.obtenerDetalleSolicitud(solicitudId, this.tallerId).subscribe({
      next: (detalle) => {
        this.solicitudDetalle = detalle;
        this.isLoadingDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar detalle', err);
        this.isLoadingDetalle = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmarCotizar() {
    if (!this.selectedSolicitudId || !this.cotizacionMonto || this.cotizacionMonto <= 0) {
      this.mostrarNotificacion('⚠️ Por favor ingresa un monto válido.');
      return;
    }

    this.isSubmitting = true;
    const data = { costo_estimado: this.cotizacionMonto };

    this.tallerServiciosService.cotizarSolicitud(this.selectedSolicitudId, this.tallerId, data).subscribe({
      next: () => {
        this.mostrarNotificacion('✅ Cotización enviada al cliente.');
        this.isSubmitting = false;
        this.cerrarModal();
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        console.error(err);
        this.mostrarNotificacion('❌ Error al enviar la cotización.');
        this.isSubmitting = false;
      }
    });
  }

  confirmarAceptar() {
    if (!this.selectedSolicitudId) return;
    if (!this.selectedTecnicoId) {
      this.mostrarNotificacion('⚠️ Debes seleccionar al menos un técnico.');
      return;
    }

    this.isSubmitting = true;
    
    const tecnicos_ids = [Number(this.selectedTecnicoId)];
    const vehiculos_ids = this.selectedVehiculoId ? [Number(this.selectedVehiculoId)] : [];

    const data = {
      id_solicitud_servicio: this.selectedSolicitudId,
      tecnicos_ids,
      vehiculos_ids
    };

    this.tallerServiciosService.iniciarServicio(this.selectedSolicitudId, this.tallerId, data).subscribe({
      next: () => {
        this.mostrarNotificacion('✅ Solicitud aceptada exitosamente. El servicio está en curso.');
        this.isSubmitting = false;
        this.cerrarModal();
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        console.error(err);
        this.mostrarNotificacion('❌ Error al aceptar la solicitud. Revisa técnicos o vehículos.');
        this.isSubmitting = false;
      }
    });
  }

  rechazarSolicitud(solicitudId: number) {
    if (confirm('¿Estás seguro de rechazar esta solicitud?')) {
      this.tallerServiciosService.rechazarSolicitud(solicitudId, this.tallerId).subscribe({
        next: () => {
          this.mostrarNotificacion('✅ Solicitud rechazada');
          this.cargarSolicitudes(); // Recargar la lista
        },
        error: (err: any) => {
          console.error(err);
          this.mostrarNotificacion('❌ Error al rechazar la solicitud');
        }
      });
    }
  }
}
