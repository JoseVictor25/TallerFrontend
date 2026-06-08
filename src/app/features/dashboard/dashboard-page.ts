import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';
import { Logo } from '../../shared/components/logo/logo';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';
import { Tabs, TabItem } from '../../shared/components/tabs/tabs';
import { Sidebar, SidebarItem } from '../../shared/components/sidebar/sidebar';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { NormalView } from './views/normal-view';
import { SolicitudesTallerPage } from '../taller/solicitudes/solicitudes-taller-page';
import { SistemaView } from './views/sistema-view';
import { VehiculosPage } from '../vehiculos/vehiculos-page';
import { SolicitudesPage } from '../solicitudes/solicitudes-page';
import { SolicitudesPendientesPage } from '../solicitudes-pendientes-page/solicitudes-pendientes-page';
import { TallerService, Taller } from '../../core/services/taller.service';
import { EmpleadosPage } from '../taller/empleados/empleados-page';
import { TecnicosPage } from '../taller/tecnicos/tecnicos-page';
import { VehiculosTallerPage } from '../taller/vehiculos/vehiculos-page';
import { EspecialidadesPage } from '../sistema/especialidades/especialidades-page';
import { TalleresAdminPage } from '../sistema/talleres/talleres-admin-page';
import { CategoriasIncidentesPage } from '../sistema/incidentes/categorias-incidentes-page';
import { IncidentesPage } from '../sistema/incidentes/incidentes-page';
import { ConfiguracionPage } from '../sistema/configuracion/configuracion-page';
import { PerfilTallerPage } from '../taller/perfil-taller/perfil-taller-page';
import { ServiciosTallerPage } from '../taller/servicios/servicios-page';
import { UsuariosPage } from '../sistema/usuarios/usuarios-page';
import { BitacoraPage } from '../sistema/bitacora/bitacora-page';
import { FormsModule } from '@angular/forms';
import { FinanzasTallerComponent } from '../taller/finanzas/finanzas-taller/finanzas-taller';
import { FinanzasSistemaComponent } from '../sistema/finanzas/finanzas-sistema/finanzas-sistema';
import { AnaliticaTallerPage } from '../taller/analitica/analitica-taller-page';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Logo, UserAvatar, Tabs, Sidebar, LoadingSpinner, NormalView, SolicitudesTallerPage, VehiculosPage, SolicitudesPage, SolicitudesPendientesPage, EmpleadosPage, TecnicosPage, VehiculosTallerPage, EspecialidadesPage, TalleresAdminPage, CategoriasIncidentesPage, IncidentesPage, ConfiguracionPage, PerfilTallerPage, ServiciosTallerPage, UsuariosPage, BitacoraPage, FinanzasTallerComponent, FinanzasSistemaComponent, AnaliticaTallerPage],
  templateUrl: './dashboard-page.html',
  styleUrls: ['./dashboard-page.scss']
})
export class DashboardPage implements OnInit {
  user: UserProfile | null = null;
  roles: string[] = [];
  tabs: TabItem[] = [];
  activeTabId: string = '';
  sidebarItems: SidebarItem[] = [];
  activeSidebarItemId: string = '';
  currentView: string = '';
  isLoading: boolean = false;
  talleres: Taller[] = [];
  selectedTallerId: number | null = null;
  loadingTalleres = false;


  // Mapeo de vistas según (tab, opción)
  viewMap: { [key: string]: string } = {
    'normal_inicio': 'normal',
    'taller_gestion': 'taller',
    'sistema_usuarios': 'sistema'
  };

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private tallerService: TallerService
  ) {}

  get displayRole(): string {
    if (!this.roles || this.roles.length === 0) return '';
    
    // Mostrar siempre el rol de mayor jerarquía que posea el usuario
    if (this.roles.includes('Administrador del Sistema')) return 'Administrador del Sistema';
    if (this.roles.includes('Administrador del Taller')) return 'Administrador de Taller';
    if (this.roles.includes('Mecanico')) return 'Mecánico';
    if (this.roles.includes('cliente')) return 'Cliente';
    if (this.roles.includes('conductor')) return 'Conductor';
    
    return this.roles[0];
  }

  async ngOnInit() {
    await this.loadUserProfile();
    this.setupTabs();
    this.setupSidebarForTab(this.activeTabId);
    this.selectFirstSidebarItem();
  }

  loadUserProfile() {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        // Usar roles directamente del perfil (el backend los incluye en PerfilResponse)
        this.roles = profile.roles || [];
        // Fallback: si el backend no devuelve roles, intentar desde el token JWT
        if (this.roles.length === 0) {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              this.roles = payload.roles || [];
            } catch(e) {}
          }
        }
        this.setupTabs();
        // Si el usuario tiene rol de admin_taller o mecanico, cargar talleres
        if (this.roles.includes('Administrador del Taller') || this.roles.includes('Mecanico')) {
          this.cargarTalleres();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  cargarTalleres() {
    this.loadingTalleres = true;
    this.tallerService.listMisTalleres().subscribe({
      next: (res) => {
        this.talleres = res.items;
        if (this.talleres.length > 0) {
          this.selectedTallerId = this.talleres[0].id;
          localStorage.setItem('selectedTallerId', String(this.selectedTallerId));
        }
        this.loadingTalleres = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingTalleres = false;
      }
    });
  }

  onTallerChange() {
    if (this.selectedTallerId) {
      localStorage.setItem('selectedTallerId', String(this.selectedTallerId));
      // Aquí puedes refrescar las vistas que dependen del taller (solicitudes, técnicos, etc.)
      // Por ahora, solo lo almacenamos.
    }
  }

  setupTabs() {
    this.tabs = [
      { id: 'normal', label: 'Mi Cuenta', icon: 'fa-user', visible: this.roles.includes('cliente') || this.roles.includes('conductor') },
      { id: 'taller', label: 'Gestión de Taller', icon: 'fa-wrench', visible: this.roles.includes('Administrador del Taller') || this.roles.includes('Mecanico') },
      { id: 'sistema', label: 'Administración', icon: 'fa-cogs', visible: this.roles.includes('Administrador del Sistema') }
    ];
    // Asegurar que haya un tab activo válido
    if (!this.tabs.find(t => t.id === this.activeTabId && t.visible)) {
      const firstVisible = this.tabs.find(t => t.visible);
      this.activeTabId = firstVisible ? firstVisible.id : 'normal';
    }
  }

  onTabChange(tabId: string) {
    this.activeTabId = tabId;
    this.setupSidebarForTab(tabId);
    this.selectFirstSidebarItem();
    this.cdr.detectChanges();
  }

  setupSidebarForTab(tabId: string) {
    if (tabId === 'normal') {
      this.sidebarItems = [
        { id: 'inicio', label: 'Inicio', icon: 'fa-home', visible: true },
        { id: 'vehiculos', label: 'Mis Vehículos', icon: 'fa-car', visible: true },
        { id: 'solicitudes', label: 'Solicitar Afiliación', icon: 'fa-file-signature', visible: true }
      ];
    } else if (tabId === 'taller') {
      const isMecanico = this.roles.includes('Mecanico') && !this.roles.includes('Administrador del Taller');
      this.sidebarItems = [
        { id: 'perfil', label: 'Perfil del Taller', icon: 'fa-building', visible: true },
        { id: 'analitica', label: 'Analítica y KPIs', icon: 'fa-chart-pie', visible: !isMecanico },
        { id: 'solicitudes', label: 'Solicitudes', icon: 'fa-clipboard-list', visible: true },
        { id: 'servicios', label: 'Gestión de Servicios', icon: 'fa-tools', visible: true },
        { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car', visible: !isMecanico },
        { id: 'tecnicos', label: 'Técnicos', icon: 'fa-users', visible: !isMecanico },
        { id: 'empleados', label: 'Empleados', icon: 'fa-users', visible: !isMecanico },
        { id: 'finanzas', label: 'Finanzas y Pagos', icon: 'fa-wallet', visible: !isMecanico }
      ];
    } else if (tabId === 'sistema') {
      this.sidebarItems = [
        { id: 'usuarios', label: 'Usuarios', icon: 'fa-user-cog', visible: true },
        { id: 'bitacora', label: 'Bitácora', icon: 'fa-history', visible: true },
        { id: 'especialidades', label: 'Especialidades', icon: 'fa-star', visible: true },
        { id: 'categorias-incidentes', label: 'Categorías (Incidentes)', icon: 'fa-list', visible: true },
        { id: 'incidentes', label: 'Tipos de Incidentes', icon: 'fa-triangle-exclamation', visible: true },
        { id: 'solicitudes-pendientes', label: 'Solicitudes de afiliación', icon: 'fa-clipboard-list', visible: true },
        { id: 'talleres', label: 'Talleres', icon: 'fa-building', visible: true },
        { id: 'configuracion', label: 'Configurar Criterios', icon: 'fa-cog', visible: true },
        { id: 'finanzas-globales', label: 'Finanzas Globales', icon: 'fa-chart-line', visible: true }
      ];
    }
  }

  selectFirstSidebarItem() {
    const first = this.sidebarItems.find(i => i.visible);
    if (first) {
      this.activeSidebarItemId = first.id;
      this.onSidebarItemClick(first.id);
    }
  }

  onSidebarItemClick(itemId: string) {
    this.currentView = `${this.activeTabId}_${itemId}`;
    this.cdr.detectChanges();
  }

  goToProfile() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('token');
        this.notificationService.showSuccess('Sesión cerrada correctamente');
        this.router.navigate(['/']);
      },
      error: () => {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
      }
    });
  }
}