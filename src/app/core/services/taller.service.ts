import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Taller {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  ubicacion?: string;
  estado: string;
  creador_nombre?: string;
  creador_email?: string;
}

export interface TallerDetail {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  ubicacion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  url_web?: string;
  puntos: number;
  estado: string;
}

export interface TallerUpdate {
  nombre?: string;
  telefono?: string;
  email?: string;
  ubicacion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  url_web?: string;
}

export interface TalleresResponse {
  items: Taller[];
  total: number;
  skip: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class TallerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listMisTalleres(skip: number = 0, limit: number = 100): Observable<TalleresResponse> {
    return this.http.get<TalleresResponse>(`${this.apiUrl}/talleres/mis-talleres`, {
      params: { skip, limit }
    });
  }

  getDetail(tallerId: number): Observable<TallerDetail> {
    return this.http.get<TallerDetail>(`${this.apiUrl}/talleres/${tallerId}`);
  }

  update(tallerId: number, data: TallerUpdate): Observable<TallerDetail> {
    return this.http.put<TallerDetail>(`${this.apiUrl}/talleres/${tallerId}`, data);
  }

  // Admin: listar todos los talleres con filtro por estado
  listAll(skip: number = 0, limit: number = 10, estado?: string) {
    const params: any = { skip, limit };
    if (estado) params.estado = estado;
    return this.http.get<TalleresResponse>(`${this.apiUrl}/talleres`, { params });
  }

  suspender(tallerId: number) {
    return this.http.put<Taller>(`${this.apiUrl}/talleres/${tallerId}/suspender`, {});
  }

  activar(tallerId: number) {
    return this.http.put<Taller>(`${this.apiUrl}/talleres/${tallerId}/activar`, {});
  }
}