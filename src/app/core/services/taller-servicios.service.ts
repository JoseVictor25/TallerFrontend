import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================
// INTERFACES PARA SOLICITUDES
// ============================================================

export interface SolicitudServicioList {
  id: number;
  fecha: string;
  estado: string;
  sugerido_por: string;
  distancia_km?: number;
  costo_estimado?: number;
  comentario?: string;
  tiene_servicio: boolean;
}

export interface CotizacionCreate {
  costo_estimado: number;
}

export interface EvidenciaDetalle {
  id: number;
  url: string;
  tipo: string;
  transcripcion?: string;
}

export interface VehiculoCliente {
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  color?: string;
  tipo?: string;
}

export interface DiagnosticoDetalle {
  id: number;
  descripcion?: string;
  nivel_confianza: number;
  fecha: string;
}

export interface SolicitudServicioDetalle {
  id: number;
  ubicacion?: string; // "lat,lon"
  fecha: string;
  comentario?: string;
  estado: string;
  sugerido_por: string;
  distancia_km?: number;
  diagnostico?: DiagnosticoDetalle;
  vehiculo_cliente?: VehiculoCliente;
  evidencias: EvidenciaDetalle[];
  descripcion_conductor?: string;
}

// ============================================================
// INTERFACES PARA RECURSOS
// ============================================================

export interface TecnicoDisponible {
  id: number;
  nombre_completo: string;
  especialidades: string[];
  estado: string;
}

export interface VehiculoDisponible {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  tipo: string;
  estado: string;
}

// ============================================================
// INTERFACES PARA SERVICIOS
// ============================================================

export interface TecnicoAsignado {
  id_empleado: number;
  nombre_completo: string;
}

export interface VehiculoAsignado {
  id_vehiculo_taller: number;
  matricula: string;
  marca: string;
  modelo: string;
}

export interface Servicio {
  id: number;
  numero?: number;
  fecha: string;
  estado: string;
  id_taller: number;
  id_solicitud_servicio?: number;
  tecnicos_asignados: TecnicoAsignado[];
  vehiculos_asignados: VehiculoAsignado[];
}

export interface ServicioCreate {
  id_solicitud_servicio: number;
  tecnicos_ids: number[];
  vehiculos_ids: number[];
}

// ============================================================
// INTERFACES PARA HISTORIAL Y MÉTRICAS
// ============================================================

export interface EstadoHistorial {
  estado: string;
  estado_descripcion: string;
  tiempo: string; // ISO format
}

export interface MetricaServicio {
  tiempo_respuesta?: string;
  tiempo_respuesta_segundos?: number;
  tiempo_llegada?: string;
  tiempo_llegada_segundos?: number;
  tiempo_resolucion?: string;
  tiempo_resolucion_segundos?: number;
  tiempo_total?: string;
  tiempo_total_segundos?: number;
}

// ============================================================
// INTERFACES PARA VALORACIONES
// ============================================================

export interface Valoracion {
  id: number;
  puntos: number;
  comentario?: string;
  id_servicio: number;
}

@Injectable({ providedIn: 'root' })
export class TallerServiciosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============================================================
  // SOLICITUDES
  // ============================================================

  listarSolicitudesRecientes(idTaller: number, minutos: number = 60): Observable<SolicitudServicioList[]> {
    const params = new HttpParams()
      .set('id_taller', idTaller.toString())
      .set('minutos', minutos.toString());
    return this.http.get<SolicitudServicioList[]>(`${this.apiUrl}/taller/solicitudes/recientes`, { params });
  }

  listarSolicitudesHistorico(idTaller: number): Observable<SolicitudServicioList[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<SolicitudServicioList[]>(`${this.apiUrl}/taller/solicitudes/historico`, { params });
  }

  obtenerDetalleSolicitud(solicitudId: number, idTaller: number): Observable<SolicitudServicioDetalle> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<SolicitudServicioDetalle>(
      `${this.apiUrl}/taller/solicitudes/${solicitudId}/detalle`,
      { params }
    );
  }

  // ============================================================
  // RECURSOS
  // ============================================================

  listarTecnicosDisponibles(idTaller: number): Observable<TecnicoDisponible[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<TecnicoDisponible[]>(`${this.apiUrl}/taller/recursos/tecnicos-disponibles`, { params });
  }

  listarVehiculosDisponibles(idTaller: number): Observable<VehiculoDisponible[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<VehiculoDisponible[]>(`${this.apiUrl}/taller/recursos/vehiculos-disponibles`, { params });
  }

  // ============================================================
  // ACCIONES SOBRE SOLICITUDES
  // ============================================================

  cotizarSolicitud(solicitudId: number, idTaller: number, data: CotizacionCreate): Observable<any> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.post(
      `${this.apiUrl}/taller/solicitudes/${solicitudId}/cotizar`,
      data,
      { params }
    );
  }

  iniciarServicio(solicitudId: number, idTaller: number, data: ServicioCreate): Observable<Servicio> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.post<Servicio>(
      `${this.apiUrl}/taller/solicitudes/${solicitudId}/iniciar`,
      data,
      { params }
    );
  }

  rechazarSolicitud(solicitudId: number, idTaller: number): Observable<any> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.post(
      `${this.apiUrl}/taller/solicitudes/${solicitudId}/rechazar`,
      {},
      { params }
    );
  }

  // ============================================================
  // SERVICIOS
  // ============================================================

  listarServiciosEnProceso(idTaller: number): Observable<Servicio[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<Servicio[]>(`${this.apiUrl}/taller/servicios/en-proceso`, { params });
  }

  listarServiciosHistorico(idTaller: number): Observable<Servicio[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<Servicio[]>(`${this.apiUrl}/taller/servicios/historico`, { params });
  }

  completarServicio(servicioId: number, idTaller: number): Observable<Servicio> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.post<Servicio>(
      `${this.apiUrl}/taller/servicios/${servicioId}/completar`,
      {},
      { params }
    );
  }

  obtenerDetalleServicio(servicioId: number, idTaller: number): Observable<Servicio> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<Servicio>(`${this.apiUrl}/taller/servicios/${servicioId}/detalle`, { params });
  }

  // ============================================================
  // HISTORIAL Y MÉTRICAS
  // ============================================================

  obtenerHistorialEstados(servicioId: number, idTaller: number): Observable<EstadoHistorial[]> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<EstadoHistorial[]>(
      `${this.apiUrl}/taller/servicios/${servicioId}/historial`,
      { params }
    );
  }

  obtenerMetricasServicio(servicioId: number, idTaller: number): Observable<MetricaServicio> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<MetricaServicio>(
      `${this.apiUrl}/taller/servicios/${servicioId}/metricas`,
      { params }
    );
  }

  // ============================================================
  // VALORACIONES
  // ============================================================

  obtenerValoracionServicio(servicioId: number, idTaller: number): Observable<Valoracion | null> {
    const params = new HttpParams().set('id_taller', idTaller.toString());
    return this.http.get<Valoracion | null>(
      `${this.apiUrl}/taller/servicios/${servicioId}/valoracion`,
      { params }
    );
  }
}