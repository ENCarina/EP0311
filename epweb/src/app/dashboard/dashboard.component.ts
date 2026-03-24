import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';
import { StaffService } from '../shared/staff.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    dateLabel: string;
    timeLabel: string;
    doctorName: string;
    serviceName: string;
  }> = [];

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
    private staffService: StaffService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  protected onStartBooking(): void {
    this.router.navigate(['/booking']);
  }

  protected refreshDashboard(): void {
    this.loadDashboardData();
  }

  protected updateConsultationFilter(): void {
    const query = this.serviceSearchTerm.trim().toLowerCase();
    this.filteredConsultations = this.allConsultations.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.specialty.toLowerCase().includes(query);
      const matchesSpecialty = !this.selectedSpecialty || item.specialty === this.selectedSpecialty;
      return matchesQuery && matchesSpecialty;
    });
  }

  protected startQuickBooking(consultationId: number): void {
    this.router.navigate(['/booking'], {
      queryParams: { consultationId }
    });
  }

  protected scrollToUpcoming(): void {
    const target = document.getElementById('upcomingAppointmentsBlock');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  private loadDashboardData(): void {
    this.loadingDashboard = true;
    this.dashboardError = '';

    forkJoin({
      bookings: this.bookingService.getMyBookings().pipe(
        catchError((error) => {
          console.error('Foglalások betöltése sikertelen:', error);
          this.dashboardError = 'Néhány adat nem elérhető jelenleg, de a vezérlőpult részben betöltött.';
          return of([]);
        })
      ),
      consultations: this.staffService.getConsultations().pipe(
        catchError((error) => {
          console.error('Szolgáltatások betöltése sikertelen:', error);
          this.dashboardError = 'Néhány adat nem elérhető jelenleg, de a vezérlőpult részben betöltött.';
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
    const map = new Map<string, number>();

    bookingsData.forEach((booking: any) => {
      const serviceName = booking.treatment?.name || booking.type?.name || booking.name || 'Ismeretlen szolgáltatás';
      map.set(serviceName, (map.get(serviceName) || 0) + 1);
    });

    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private computeUpcomingAppointments(bookingsData: any[]): Array<{
    dateLabel: string;
    timeLabel: string;
    doctorName: string;
    serviceName: string;
  }> {
    const now = new Date();

    return bookingsData
      .map((booking: any) => {
        const slotData = this.getBookingSlot(booking);
        const date = slotData?.date || booking.date;
        const startTime = slotData?.startTime || booking.startTime;
        const dateTime = this.buildDateTime(date, startTime);

        return {
          dateTime,
          dateLabel: this.formatDate(date),
          timeLabel: this.formatTime(startTime),
          doctorName: this.getDoctorName(booking),
          serviceName: booking.treatment?.name || booking.type?.name || booking.name || 'Konzultáció'
        };
      })
      .filter((item) => !isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 5)
      .map(({ dateLabel, timeLabel, doctorName, serviceName }) => ({
        dateLabel,
        timeLabel,
        doctorName,
        serviceName
      }));
  }

  private computeLatestBookingDate(bookingsData: any[]): string {
    const latest = bookingsData
      .map((booking: any) => {
        const slotData = this.getBookingSlot(booking);
        const date = slotData?.date || booking.date;
        const startTime = slotData?.startTime || booking.startTime;
        const dateTime = this.buildDateTime(date, startTime);
        return isNaN(dateTime.getTime()) ? null : dateTime;
      })
      .filter((item: Date | null): item is Date => !!item)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!latest) {
      return '';
    }

    return latest.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
      .sort((a, b) => a.name.localeCompare(b.name, 'hu'));

    this.consultationSpecialties = [...new Set(this.allConsultations.map((item) => item.specialty))]
      .sort((a, b) => a.localeCompare(b, 'hu'));

    this.updateConsultationFilter();
  }

  private formatDate(date: string): string {
    if (!date) return '';
    const dateObj = this.buildDateTime(date, '00:00:00');
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private formatTime(time: string): string {
    if (!time) return '';
    const timeObj = new Date(time);
    if (!isNaN(timeObj.getTime())) {
      return timeObj.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  }

  private getBookingSlot(booking: any): any {
    return booking?.slot || booking?.timeSlot || booking?.Slot || null;
  }

  private getDoctorName(booking: any): string {
    return booking?.doctor?.user?.name
      || booking?.doctor?.staffProfile?.name
      || booking?.staff?.name
      || 'Szakember';
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

    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      seconds
    );
  }
}
