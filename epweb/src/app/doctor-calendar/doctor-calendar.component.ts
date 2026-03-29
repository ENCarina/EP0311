import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';

type CalendarVariant = 'booked' | 'upcoming' | 'past';

interface CalendarBookingItem {
  id: number;
  patientName: string;
  consultationName: string;
  doctorName: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  timeLabel: string;
  variant: CalendarVariant;
  gridRow: string;
}

interface CalendarDay {
  key: string;
  weekdayLabel: string;
  dateLabel: string;
  isToday: boolean;
}

@Component({
  selector: 'app-doctor-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-calendar.component.html',
  styleUrl: './doctor-calendar.component.css'
})
export class DoctorCalendarComponent implements OnInit {
  private readonly bookingApi = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly startHour = 8;
  private readonly endHour = 18;
  private readonly slotMinutes = 30;

  protected readonly timeSlots = this.buildTimeSlots();
  protected readonly gridTemplateRows = `repeat(${this.timeSlots.length}, minmax(54px, 1fr))`;

  protected loading = false;
  protected errorMessage = '';
  protected currentWeekStart = this.getWeekStart(new Date());
  protected visibleDays: CalendarDay[] = [];
  protected selectedBooking: CalendarBookingItem | null = null;
  protected hasAnyBookingThisWeek = false;

  private allBookings: CalendarBookingItem[] = [];
  private bookingsByDay = new Map<string, CalendarBookingItem[]>();

  ngOnInit(): void {
    if (this.authService.getRoleId() !== 1) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.refreshVisibleDays();
    this.loadBookings();
  }

  protected goToPreviousWeek(): void {
    const previousWeek = new Date(this.currentWeekStart);
    previousWeek.setDate(previousWeek.getDate() - 7);
    this.currentWeekStart = previousWeek;
    this.refreshVisibleDays();
    this.rebuildWeekBookings();
  }

  protected goToCurrentWeek(): void {
    this.currentWeekStart = this.getWeekStart(new Date());
    this.refreshVisibleDays();
    this.rebuildWeekBookings();
  }

  protected goToNextWeek(): void {
    const nextWeek = new Date(this.currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.currentWeekStart = nextWeek;
    this.refreshVisibleDays();
    this.rebuildWeekBookings();
  }

  protected getWeekLabel(): string {
    if (!this.visibleDays.length) {
      return '';
    }

    const firstDay = this.visibleDays[0]?.key;
    const lastDay = this.visibleDays[this.visibleDays.length - 1]?.key;
    return `${this.formatShortDate(firstDay)} - ${this.formatShortDate(lastDay)}`;
  }

  protected getBookingsForDay(dayKey: string): CalendarBookingItem[] {
    return this.bookingsByDay.get(dayKey) || [];
  }

  protected openBookingDetails(booking: CalendarBookingItem): void {
    this.selectedBooking = booking;
  }

  protected closeBookingDetails(): void {
    this.selectedBooking = null;
  }

  protected refreshCalendar(): void {
    this.loadBookings();
  }

  private loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bookingApi.getMyBookings().subscribe({
      next: (bookings: any[]) => {
        const bookingList: any[] = Array.isArray(bookings) ? bookings : [];

        this.allBookings = bookingList
          .map((booking: any) => this.mapBookingToCalendarItem(booking))
          .filter((booking: CalendarBookingItem | null): booking is CalendarBookingItem => booking !== null);

        this.rebuildWeekBookings();
        this.loading = false;
      },
      error: (error) => {
        console.error('Az orvosi naptár betöltése sikertelen:', error);
        this.loading = false;
        this.errorMessage = 'A naptár adatai jelenleg nem tölthetők be.';
      }
    });
  }

  private rebuildWeekBookings(): void {
    const dayKeys = new Set(this.visibleDays.map((day) => day.key));
    const filteredBookings = this.allBookings.filter((booking) => dayKeys.has(booking.date));

    this.bookingsByDay = new Map<string, CalendarBookingItem[]>();

    for (const booking of filteredBookings) {
      const existing = this.bookingsByDay.get(booking.date) || [];
      existing.push(booking);
      existing.sort((left, right) => left.startDate.getTime() - right.startDate.getTime());
      this.bookingsByDay.set(booking.date, existing);
    }

    this.hasAnyBookingThisWeek = filteredBookings.length > 0;
  }

  private refreshVisibleDays(): void {
    this.visibleDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + index);
      const dateKey = this.toDateKey(date);

      return {
        key: dateKey,
        weekdayLabel: date.toLocaleDateString('hu-HU', { weekday: 'long' }),
        dateLabel: date.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' }),
        isToday: dateKey === this.toDateKey(new Date())
      };
    });
  }

  private mapBookingToCalendarItem(booking: any): CalendarBookingItem | null {
    const slotData = booking?.timeSlot || booking?.slot || booking?.Slot || null;
    const date = slotData?.date || booking?.date;
    const startTime = slotData?.startTime || booking?.startTime;
    const rawEndTime = slotData?.endTime || booking?.endTime;

    if (!date || !startTime) {
      return null;
    }

    const startDate = this.combineDateTime(date, startTime);
    if (isNaN(startDate.getTime())) {
      return null;
    }

    const duration = Number(booking?.treatment?.duration || booking?.duration || 30);
    const endDate = rawEndTime
      ? this.combineDateTime(date, rawEndTime)
      : new Date(startDate.getTime() + duration * 60 * 1000);

    const startMinutes = this.getMinutesFromTime(startTime);
    const startBoundary = this.startHour * 60;
    const endBoundary = this.endHour * 60;

    if (startMinutes < startBoundary || startMinutes >= endBoundary) {
      return null;
    }

    const rowStart = Math.floor((startMinutes - startBoundary) / this.slotMinutes) + 1;
    const rowSpan = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (this.slotMinutes * 60 * 1000)));

    return {
      id: Number(booking?.id || 0),
      patientName: booking?.patient?.name || booking?.patient?.email || 'Páciens',
      consultationName: booking?.treatment?.name || booking?.type?.name || booking?.name || 'Konzultáció',
      doctorName: booking?.doctor?.user?.name || booking?.doctor?.name || booking?.staff?.name || this.authService.getUserName(),
      status: booking?.status || 'Confirmed',
      date,
      startTime,
      endTime: this.toTimeString(endDate),
      startDate,
      endDate,
      timeLabel: `${this.formatTime(startTime)} - ${this.formatTime(this.toTimeString(endDate))}`,
      variant: this.getBookingVariant(startDate, endDate),
      gridRow: `${rowStart} / span ${rowSpan}`
    };
  }

  private getBookingVariant(startDate: Date, endDate: Date): CalendarVariant {
    const now = new Date();
    if (endDate.getTime() < now.getTime()) {
      return 'past';
    }

    if (startDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      return 'upcoming';
    }

    return 'booked';
  }

  private buildTimeSlots(): string[] {
    const slots: string[] = [];
    for (let minutes = this.startHour * 60; minutes < this.endHour * 60; minutes += this.slotMinutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
    return slots;
  }

  private getWeekStart(dateValue: Date): Date {
    const date = new Date(dateValue);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private combineDateTime(date: string, time: string): Date {
    const normalizedTime = String(time).length >= 5 ? String(time).slice(0, 5) : String(time);
    return new Date(`${date}T${normalizedTime}`);
  }

  private getMinutesFromTime(time: string): number {
    const [hour, minute] = String(time).split(':').map((value) => Number(value));
    return hour * 60 + minute;
  }

  private toTimeString(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatTime(time: string): string {
    return String(time).slice(0, 5);
  }

  private formatShortDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('hu-HU', {
      month: '2-digit',
      day: '2-digit'
    });
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}