import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IncidenteTipo {
  tipo: string;
  cantidad: number;
}

export interface TallerRanking {
  taller_id: number;
  nombre: string;
  tiempo_promedio_total_minutos: number;
}

export interface ZonaIncidente {
  lat: number;
  lng: number;
  intensidad: number;
}

export interface KpiResponse {
  tiempo_promedio_asignacion_minutos: number;
  tiempo_promedio_llegada_minutos: number;
  incidentes_por_tipo: IncidenteTipo[];
  talleres_mas_eficientes: TallerRanking[];
  zonas_incidentes: ZonaIncidente[];
  casos_cancelados: number;
  nivel_cumplimiento_sla_porcentaje: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnaliticaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getKpisTaller(tallerId: number): Observable<KpiResponse> {
    return this.http.get<KpiResponse>(`${this.apiUrl}/analitica/taller/${tallerId}/kpis`);
  }
}
