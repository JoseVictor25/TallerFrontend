import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SuscripcionActiva {
  taller: string;
  administrador: string;
  email: string;
  plan: string;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSuscripcionesActivas(): Observable<SuscripcionActiva[]> {
    return this.http.get<SuscripcionActiva[]>(`${this.apiUrl}/tenants/suscripciones/activas`);
  }
}
