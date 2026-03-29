import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';
import { StaffService } from '../shared/staff.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  protected loadingDashboard = false;
  protected dashboardError = '';

  protected totalBookings = 0;
  protected upcomingBookingsCount = 0;
  protected latestBookingDateLabel = '';
  protected favoriteServiceName = '';

  protected topServices: Array<{ name: string; count: number }> = [];
  protected upcomingAppointments: Array<{
    id: number;
    appointmentDateTime: Date;
    dateLabel: string;
    timeLabel: string;
    doctorName: string;
    serviceName: string;
  }> = [];
  protected cancellingBookingId: number | null = null;

  protected allConsultations: Array<{
    id: number;
    name: string;
    specialty: string;
    duration: number;
    price: number;
  }> = [];
  protected filteredConsultations: Array<{
    id: number;
    name: string;
    specialty: string;
    duration: number;
    price: number;
  }> = [];
  protected consultationSpecialties: string[] = [];
  protected serviceSearchTerm = '';
  protected selectedSpecialty = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private bookingService: BookingService,
    private staffService: StaffService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  protected onStartBooking(): void {
    this.router.navigate(['/booking']);
  }

  protected openBookingsPage(): void {
    this.router.navigate(['/my-bookings']);
  }

  protected refreshDashboard(): void {
    this.loadDashboardData();
  }

  protected updateConsultationFilter(): void {
    const query = this.serviceSearchTerm.trim().toLowerCase();
    this.filteredConsultations = this.allConsultations.filter((item) => {
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.specialty.toLowerCase().includes(query);
      const matchesSpecialty = !this.selectedSpecialty || item.specialty === this.selectedSpecialty;
      return matchesQuery && matchesSpecialty;
    });
  }

  protected startQuickBooking(consultationId: number): void {
    this.router.navigate(['/booking'], {
      queryParams: { treatmentId: consultationId }
    });
  }

  protected openProfileQuickView(): void {
    const userName = this.authService.getUserName();
    const roleId = this.authService.getRoleId();
    const roleLabel = roleId === 2 ? 'Admin' : roleId === 1 ? 'Orvos' : 'Felhasználó';

    Swal.fire({
      title: 'Profil',
      html: `<div style="text-align:left"><p><strong>Név:</strong> ${userName}</p><p><strong>Szerepkör:</strong> ${roleLabel}</p></div>`,
      icon: 'info',
      confirmButtonText: 'Rendben'
    });
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(value || 0);
  }

  protected canCancelBooking(appointment: { appointmentDateTime: Date }): boolean {
    if (!(appointment.appointmentDateTime instanceof Date) || isNaN(appointment.appointmentDateTime.getTime())) {
      return false;
    }

    const hoursDiff = (appointment.appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  }

  protected getCancellationHint(appointment: { appointmentDateTime: Date }): string {
    return this.canCancelBooking(appointment)
      ? 'Az időpont még online lemondható.'
      : '24 órán belül csak telefonon mondható le.';
  }

  protected cancelUpcomingBooking(appointment: { id: number; appointmentDateTime: Date }): void {
    if (!appointment.id || !this.canCancelBooking(appointment) || this.cancellingBookingId !== null) {
      return;
    }

    Swal.fire({
      title: 'Időpont lemondása',
      text: 'Biztosan lemondja ezt az időpontot?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Igen, lemondom',
      cancelButtonText: 'Mégsem'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.cancellingBookingId = appointment.id;
      this.bookingService.cancelBooking(appointment.id).subscribe({
        next: () => {
          this.cancellingBookingId = null;
          this.loadDashboardData();

          Swal.fire({
            title: 'Sikeres lemondás',
            text: 'Az időpont törölve lett.',
            icon: 'success',
            confirmButtonText: 'Rendben'
          });
        },
        error: (error) => {
          this.cancellingBookingId = null;
          Swal.fire({
            title: 'A lemondás sikertelen',
            text: error?.error?.error || error?.error?.message || 'Hiba történt a lemondás során.',
            icon: 'error',
            confirmButtonText: 'Rendben'
          });
        }
      });
    });
  }

  private loadDashboardData(): void {
    this.loadingDashboard = true;
    this.dashboardError = '';

    forkJoin({
      bookings: this.bookingService.getMyBookings().pipe(
        catchError((error) => {
          console.error('Foglalások betöltése sikertelen:', error);
          this.dashboardError = 'Néhány adat jelenleg nem elérhető, de a vezérlőpult részben betöltött.';
          return of([]);
        })
      ),
      consultations: this.staffService.getConsultations().pipe(
        catchError((error) => {
          console.error('Szolgáltatások betöltése sikertelen:', error);
          this.dashboardError = 'Néhány adat jelenleg nem elérhető, de a vezérlőpult részben betöltött.';
          return of([]);
        })
      )
    }).subscribe({
      next: ({ bookings, consultations }: any) => {
        const bookingsData = Array.isArray(bookings) ? bookings : bookings?.data || [];
        const consultationsData = Array.isArray(consultations) ? consultations : consultations?.data || [];

        this.totalBookings = bookingsData.length;
        this.upcomingAppointments = this.computeUpcomingAppointments(bookingsData);
        this.upcomingBookingsCount = this.upcomingAppointments.length;
        this.latestBookingDateLabel = this.computeLatestBookingDate(bookingsData);
        this.topServices = this.computeTopServices(bookingsData);
        this.favoriteServiceName = this.topServices[0]?.name || '';
        this.buildConsultationCatalog(consultationsData);

        this.loadingDashboard = false;
      },
      error: (error) => {
        console.error(error);
        this.loadingDashboard = false;
        this.dashboardError = 'A vezérlőpult adatainak betöltése sikertelen.';
      }
    });
  }

  private computeTopServices(bookingsData: any[]): Array<{ name: string; count: number }> {
    const serviceMap = new Map<string, number>();

    bookingsData.forEach((booking: any) => {
      const serviceName = booking.treatment?.name || booking.name || 'Ismeretlen szolgáltatás';
      serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
    });

    return [...serviceMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }

  private computeUpcomingAppointments(bookingsData: any[]): Array<{ id: number; appointmentDateTime: Date; dateLabel: string; timeLabel: string; doctorName: string; serviceName: string }> {
    const now = new Date();

    return bookingsData
      .map((booking: any) => {
        const slotData = booking?.timeSlot || booking?.slot || null;
        const date = slotData?.date || booking.date;
        const startTime = slotData?.startTime || booking.startTime;
        const dateTime = this.buildDateTime(date, startTime);

        return {
          id: Number(booking?.id),
          appointmentDateTime: dateTime,
          dateTime,
          dateLabel: this.formatDate(date),
          timeLabel: this.formatTime(startTime),
          doctorName: booking?.doctor?.user?.name || 'Szakember',
          serviceName: booking?.treatment?.name || booking?.name || 'Konzultáció'
        };
      })
      .filter((item) => !!item.id && !isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime())
      .slice(0, 5)
      .map(({ id, appointmentDateTime, dateLabel, timeLabel, doctorName, serviceName }) => ({
        id,
        appointmentDateTime,
        dateLabel,
        timeLabel,
        doctorName,
        serviceName,
      }));
  }

  private computeLatestBookingDate(bookingsData: any[]): string {
    const latest = bookingsData
      .map((booking: any) => {
        const slotData = booking?.timeSlot || booking?.slot || null;
        const date = slotData?.date || booking.date;
        const startTime = slotData?.startTime || booking.startTime;
        const dateTime = this.buildDateTime(date, startTime);
        return isNaN(dateTime.getTime()) ? null : dateTime;
      })
      .filter((item: Date | null): item is Date => !!item)
      .sort((left, right) => right.getTime() - left.getTime())[0];

    if (!latest) {
      return '';
    }

    return latest.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private buildConsultationCatalog(consultationsData: any[]): void {
    this.allConsultations = consultationsData
      .map((item: any) => ({
        id: Number(item.id),
        name: item.name || 'Ismeretlen szolgáltatás',
        specialty: item.specialty || 'Általános',
        duration: Number(item.duration) || 30,
        price: Number(item.price) || 0
      }))
      .filter((item: any) => !!item.id)
      .sort((left, right) => left.name.localeCompare(right.name, 'hu'));

    this.consultationSpecialties = [...new Set(this.allConsultations.map((item) => item.specialty))]
      .sort((left, right) => left.localeCompare(right, 'hu'));

    this.updateConsultationFilter();
  }

  private formatDate(date: string): string {
    if (!date) return '';
    const dateObj = this.buildDateTime(date, '00:00:00');
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private formatTime(time: string): string {
    return String(time || '').slice(0, 5);
  }

  private buildDateTime(dateValue: any, timeValue: any): Date {
    const baseDate = new Date(dateValue);
    if (isNaN(baseDate.getTime())) {
      return new Date('invalid');
    }

    const timeText = String(timeValue || '00:00:00');
    const timeMatch = timeText.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
    const hours = Number(timeMatch?.[1] || 0);
    const minutes = Number(timeMatch?.[2] || 0);
    const seconds = Number(timeMatch?.[3] || 0);

    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, seconds);
  }
}