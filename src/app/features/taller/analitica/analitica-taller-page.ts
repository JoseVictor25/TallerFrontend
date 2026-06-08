import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnaliticaService, KpiResponse } from '../../../core/services/analitica.service';
import { Chart, registerables } from 'chart.js';
import * as L from 'leaflet';

Chart.register(...registerables);

// Fix Leaflet icons
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-analitica-taller-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analitica-taller-page.html',
  styleUrls: ['./analitica-taller-page.scss']
})
export class AnaliticaTallerPage implements OnInit, OnChanges, AfterViewInit {
  @Input() tallerId!: number;
  kpis: KpiResponse | null = null;
  loading = false;
  
  @ViewChild('incidentesChart') incidentesChartRef!: ElementRef;
  chartInstance: Chart | null = null;
  
  map: L.Map | null = null;
  
  constructor(private analiticaService: AnaliticaService) {}
  
  ngOnInit() {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['tallerId'] && this.tallerId) {
      this.loadKpis();
    }
  }
  
  ngAfterViewInit() {
    this.initMap();
  }
  
  loadKpis() {
    this.loading = true;
    this.analiticaService.getKpisTaller(this.tallerId).subscribe({
      next: (res) => {
        this.kpis = res;
        this.loading = false;
        setTimeout(() => {
          this.renderChart();
          this.updateMap();
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando KPIs:', err);
        this.loading = false;
      }
    });
  }
  
  renderChart() {
    if (!this.kpis || !this.incidentesChartRef) return;
    
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    const ctx = this.incidentesChartRef.nativeElement.getContext('2d');
    const labels = this.kpis.incidentes_por_tipo.map(i => i.tipo);
    const data = this.kpis.incidentes_por_tipo.map(i => i.cantidad);
    
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  initMap() {
    const mapElement = document.getElementById('incidents-map');
    if (mapElement && !this.map) {
      this.map = L.map(mapElement).setView([-17.78, -63.18], 12); // Santa Cruz default
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    }
  }
  
  updateMap() {
    if (!this.kpis) return;

    if (!this.map) {
      // Intentar inicializar mapa si se renderizó tarde
      const mapElement = document.getElementById('incidents-map');
      if (mapElement) {
        this.initMap();
      }
    }

    if (!this.map) return;

    // Clear previous markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map?.removeLayer(layer);
      }
    });
    
    // Add new markers
    const bounds = L.latLngBounds([]);
    let hasMarkers = false;
    this.kpis.zonas_incidentes.forEach(z => {
      if(z.lat && z.lng) {
        const latlng = L.latLng(z.lat, z.lng);
        L.marker(latlng).addTo(this.map as L.Map);
        bounds.extend(latlng);
        hasMarkers = true;
      }
    });
    
    if (hasMarkers) {
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }
}
