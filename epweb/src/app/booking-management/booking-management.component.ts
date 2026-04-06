import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';
import { Booking } from '../shared/interfaces/booking.interface';

type StatusFilter = 'all' | Booking['status'];

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-management.component.html',
  styleUrl: './booking-management.component.css'
})
export class BookingManagementComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected loading = false;
  protected errorMessage = '';
  protected bookings: any[] = [];
  protected searchTerm = '';
  protected statusFilter: StatusFilter = 'all';
  protected actionBookingId: number | null = null;

  ngOnInit(): void {
    if (this.authService.getRoleId() < 1) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadBookings();
  }

  protected get isAdminView(): boolean {
    return this.authService.getRoleId() === 2;
  }

  protected get pageTitle(): string {
    return 'Időpontkezelő';
  }

  protected get pageSubtitle(): string {
    return this.isAdminView
      ? 'Foglalások áttekintése, telefonos lemondások rögzítése és végleges törlése admin jogosultsággal.'
      : 'Páciensek időpontjainak kezelése, telefonos lemondások rögzítése és státuszváltás a saját rendelésedhez.';
  }

  protected get filteredBookings(): any[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.bookings.filter((booking) => {
      const slot = this.getSlot(booking);
      const statusMatches = this.statusFilter === 'all' || booking?.status === this.statusFilter;
      const haystack = [
        this.getPatientName(booking),
        this.getDoctorName(booking),
        this.getServiceName(booking),
        slot?.date || '',
        slot?.startTime || ''
      ].join(' ').toLowerCase();

      const queryMatches = !query || haystack.includes(query);
      return statusMatches && queryMatches;
    });
  }

  protected get totalBookings(): number {
    return this.bookings.length;
  }

  protected get cancelledBookings(): number {
    return this.bookings.filter((booking) => booking?.status === 'Cancelled').length;
  }

  protected get upcomingBookings(): number {
    return this.bookings.filter((booking) => this.isUpcomingBooking(booking)).length;
  }

  protected loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bookingService.getUserBookings().subscribe({
      next: (bookings) => {
        this.bookings = Array.isArray(bookings)
          ? [...bookings].sort((left, right) => this.getBookingDateValue(left) - this.getBookingDateValue(right))
          : [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error || error?.error?.message || 'A foglalások nem tölthetők be.';
      }
    });
  }

  protected markCancelled(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Cancelled',
      'Telefonos lemondás rögzítése',
      'A foglalás lemondott státuszt kap, és az időpont újra foglalható lesz.'
    );
  }

  protected markCompleted(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Completed',
      'Foglalás lezárása',
      'A foglalás teljesített státuszt kap.'
    );
  }

  protected markConfirmed(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Confirmed',
      'Foglalás megerősítése',
      'A foglalás újra aktív megerősített státuszt kap.'
    );
  }

  protected deleteBooking(booking: any): void {
    const bookingId = Number(booking?.id);
    if (!this.isAdminView || !bookingId || this.actionBookingId !== null) {
      return;
    }

    Swal.fire({
      title: 'Foglalás végleges törlése',
      text: 'Ez a művelet véglegesen eltávolítja a foglalást a rendszerből. Folytatod?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Igen, törlöm',
      cancelButtonText: 'Mégsem'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.actionBookingId = bookingId;
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.actionBookingId = null;
          this.bookings = this.bookings.filter((item) => Number(item?.id) !== bookingId);
          Swal.fire('Törölve', 'A foglalás véglegesen törölve lett.', 'success');
        },
        error: (error) => {
          this.actionBookingId = null;
          Swal.fire('Hiba', error?.error?.error || error?.error?.message || 'A törlés nem sikerült.', 'error');
        }
      });
    });
  }

  protected canDelete(booking: any): boolean {
    return this.isAdminView && Number(booking?.id) > 0;
  }

  protected canMarkCancelled(booking: any): boolean {
    return booking?.status !== 'Cancelled';
  }

  protected canMarkCompleted(booking: any): boolean {
    return booking?.status !== 'Completed' && booking?.status !== 'Cancelled';
  }

  protected canMarkConfirmed(booking: any): boolean {
    return booking?.status === 'Cancelled';
  }

  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'Megerősített';
      case 'Cancelled':
        return 'Lemondott';
      case 'Completed':
        return 'Teljesített';
      default:
        return status || 'Ismeretlen';
    }
  }

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed':
        return 'status-pill status-confirmed';
      case 'Cancelled':
        return 'status-pill status-cancelled';
      case 'Completed':
        return 'status-pill status-completed';
      default:
        return 'status-pill status-confirmed';
    }
  }

  protected getSlot(booking: any): any {
    return booking?.timeSlot || booking?.slot || booking?.Slot || null;
  }

  protected getPatientName(booking: any): string {
    return booking?.patient?.name || booking?.patient?.email || 'Páciens';
  }

  protected getDoctorName(booking: any): string {
    return booking?.doctor?.user?.name || booking?.doctor?.name || 'Szakember';
  }

  protected getServiceName(booking: any): string {
    return booking?.treatment?.name || booking?.name || 'Konzultáció';
  }

  protected formatDate(dateValue?: string): string {
    if (!dateValue) {
      return 'Nincs dátum';
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  protected formatTime(timeValue?: string): string {
    if (!timeValue) {
      return '--:--';
    }

    return String(timeValue).slice(0, 5);
  }

  private confirmAndUpdateStatus(
    booking: any,
    status: Booking['status'],
    title: string,
    text: string
  ): void {
    const bookingId = Number(booking?.id);
    if (!bookingId || this.actionBookingId !== null) {
      return;
    }

    Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Igen',
      cancelButtonText: 'Mégsem'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.actionBookingId = bookingId;
      this.bookingService.updateBookingStatus(bookingId, status).subscribe({
        next: (updatedBooking) => {
          this.actionBookingId = null;
          this.bookings = this.bookings.map((item) => Number(item?.id) === bookingId ? { ...item, ...updatedBooking } : item);
          Swal.fire('Sikeres mentés', 'A foglalás állapota frissítve lett.', 'success');
        },
        error: (error) => {
          this.actionBookingId = null;
          Swal.fire('Hiba', error?.error?.error || error?.error?.message || 'A foglalás állapota nem módosítható.', 'error');
        }
      });
    });
  }

  private getBookingDateValue(booking: any): number {
    const slot = this.getSlot(booking);
    const date = slot?.date || booking?.date;
    const time = slot?.startTime || booking?.startTime || '00:00:00';
    const dateTime = new Date(`${date} ${time}`);
    return isNaN(dateTime.getTime()) ? Number.MAX_SAFE_INTEGER : dateTime.getTime();
  }

  private isUpcomingBooking(booking: any): boolean {
    return this.getBookingDateValue(booking) >= Date.now() && booking?.status !== 'Cancelled' && booking?.status !== 'Completed';
  }
}