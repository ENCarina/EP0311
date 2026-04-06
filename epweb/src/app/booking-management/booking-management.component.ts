import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';
import { Booking } from '../shared/interfaces/booking.interface';

type StatusFilter = 'all' | Booking['status'];

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './booking-management.component.html',
  styleUrl: './booking-management.component.css'
})
export class BookingManagementComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

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
    return this.translate.instant('BOOKING_MANAGEMENT.TITLE');
  }

  protected get pageSubtitle(): string {
    return this.isAdminView
      ? this.translate.instant('BOOKING_MANAGEMENT.SUBTITLE_ADMIN')
      : this.translate.instant('BOOKING_MANAGEMENT.SUBTITLE_DOCTOR');
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
        this.errorMessage = error?.error?.error || error?.error?.message || this.translate.instant('BOOKING_MANAGEMENT.LOAD_ERROR');
      }
    });
  }

  protected markCancelled(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Cancelled',
      'BOOKING_MANAGEMENT.SWAL.CANCEL_TITLE',
      'BOOKING_MANAGEMENT.SWAL.CANCEL_TEXT'
    );
  }

  protected markCompleted(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Completed',
      'BOOKING_MANAGEMENT.SWAL.COMPLETE_TITLE',
      'BOOKING_MANAGEMENT.SWAL.COMPLETE_TEXT'
    );
  }

  protected markConfirmed(booking: any): void {
    this.confirmAndUpdateStatus(
      booking,
      'Confirmed',
      'BOOKING_MANAGEMENT.SWAL.CONFIRM_TITLE',
      'BOOKING_MANAGEMENT.SWAL.CONFIRM_TEXT'
    );
  }

  protected deleteBooking(booking: any): void {
    const bookingId = Number(booking?.id);
    if (!this.isAdminView || !bookingId || this.actionBookingId !== null) {
      return;
    }

    Swal.fire({
      title: this.translate.instant('BOOKING_MANAGEMENT.SWAL.DELETE_TITLE'),
      text: this.translate.instant('BOOKING_MANAGEMENT.SWAL.DELETE_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('BOOKING_MANAGEMENT.SWAL.DELETE_CONFIRM'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.actionBookingId = bookingId;
      this.bookingService.deleteBooking(bookingId).subscribe({
        next: () => {
          this.actionBookingId = null;
          this.bookings = this.bookings.filter((item) => Number(item?.id) !== bookingId);
          Swal.fire(
            this.translate.instant('BOOKING_MANAGEMENT.SWAL.DELETE_SUCCESS_TITLE'),
            this.translate.instant('BOOKING_MANAGEMENT.SWAL.DELETE_SUCCESS_TEXT'),
            'success'
          );
        },
        error: (error) => {
          this.actionBookingId = null;
          Swal.fire(
            this.translate.instant('COMMON.ERROR'),
            error?.error?.error || error?.error?.message || this.translate.instant('BOOKING_MANAGEMENT.DELETE_ERROR'),
            'error'
          );
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
        return this.translate.instant('BOOKING_MANAGEMENT.STATUS_CONFIRMED');
      case 'Cancelled':
        return this.translate.instant('BOOKING_MANAGEMENT.STATUS_CANCELLED');
      case 'Completed':
        return this.translate.instant('BOOKING_MANAGEMENT.STATUS_COMPLETED');
      default:
        return status || this.translate.instant('BOOKING_MANAGEMENT.STATUS_UNKNOWN');
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
    return booking?.patient?.name || booking?.patient?.email || this.translate.instant('BOOKING_MANAGEMENT.PATIENT_FALLBACK');
  }

  protected getDoctorName(booking: any): string {
    return booking?.doctor?.user?.name || booking?.doctor?.name || this.translate.instant('BOOKING_MANAGEMENT.STAFF_FALLBACK');
  }

  protected getServiceName(booking: any): string {
    const serviceName = booking?.treatment?.name || booking?.name;
    if (!serviceName) {
      return this.translate.instant('BOOKING_MANAGEMENT.SERVICE_FALLBACK');
    }

    const key = this.toTranslationKey(serviceName);
    const translated = this.translate.instant(`SERVICE_NAMES.${key}`);
    return translated !== `SERVICE_NAMES.${key}` ? translated : serviceName;
  }

  protected formatDate(dateValue?: string): string {
    if (!dateValue) {
      return this.translate.instant('BOOKING_MANAGEMENT.NO_DATE');
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(this.getCurrentLocale(), {
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
    titleKey: string,
    textKey: string
  ): void {
    const bookingId = Number(booking?.id);
    if (!bookingId || this.actionBookingId !== null) {
      return;
    }

    Swal.fire({
      title: this.translate.instant(titleKey),
      text: this.translate.instant(textKey),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('BOOKING_MANAGEMENT.SWAL.CONFIRM_BUTTON'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.actionBookingId = bookingId;
      this.bookingService.updateBookingStatus(bookingId, status).subscribe({
        next: (updatedBooking) => {
          this.actionBookingId = null;
          this.bookings = this.bookings.map((item) => Number(item?.id) === bookingId ? { ...item, ...updatedBooking } : item);
          Swal.fire(
            this.translate.instant('BOOKING_MANAGEMENT.SWAL.UPDATE_SUCCESS_TITLE'),
            this.translate.instant('BOOKING_MANAGEMENT.SWAL.UPDATE_SUCCESS_TEXT'),
            'success'
          );
        },
        error: (error) => {
          this.actionBookingId = null;
          Swal.fire(
            this.translate.instant('COMMON.ERROR'),
            error?.error?.error || error?.error?.message || this.translate.instant('BOOKING_MANAGEMENT.UPDATE_ERROR'),
            'error'
          );
        }
      });
    });
  }

  private getCurrentLocale(): string {
    return this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
  }

  private toTranslationKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
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