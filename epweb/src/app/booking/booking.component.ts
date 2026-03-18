import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../shared/booking.service';
import { StaffService } from '../shared/staff.service';
import { AuthService } from '../shared/auth.service';
import { Slot } from '../shared/interfaces/slot.interface';
import { Consultation } from '../shared/interfaces/consultation.interface';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  private readonly bookingApi = inject(BookingService);
  private readonly staffApi = inject(StaffService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);

  protected staffs: any[] = [];
  protected availableSlots: Slot[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  protected selectedStaffId: number | null = null;
  protected selectedDate: string = new Date().toISOString().split('T')[0];
  protected selectedConsultationId: number = 1; 
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];
  protected readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
  // Query paraméterek figyelése (pl. ha egy konkrét orvos adatlapjáról érkezünk)
  this.route.queryParams.subscribe(params => {
    if (params['staffId']) {
      this.selectedStaffId = Number(params['staffId']);
    }
  });
  this.loadInitialData();
}
/**
 * Kezdeti adatok betöltése: Orvosok és Szolgáltatások egyszerre
 */
loadInitialData(): void {
  this.isLoading = true;
  forkJoin({
    staffs: this.staffApi.getStaff(),
    consultations: this.staffApi.getConsultations()
  }).subscribe({
    next: (res: any) => {
      this.staffs = res.staffs.data || res.staffs;
      this.consultations = res.consultations.data || res.consultations;

      // Ha nincs kijelölt orvos, az elsőt választjuk alapértelmezettnek
      if (!this.selectedStaffId && this.staffs.length > 0) {
        this.selectedStaffId = this.staffs[0].id;
      }
      
      this.updateFilteredConsultations();
      this.isLoading = false;
      this.loadSlots();
    },
    error: (err) => {
      this.isLoading = false;
      this.errorMessage = 'Hiba az adatok betöltésekor.';
      console.error(err);
    }
  });
}

/**
 * Szolgáltatások szűrése a kiválasztott orvos hozzárendelt kezelései (treatments) alapján
 */
protected updateFilteredConsultations(): void {
  const selectedStaff = this.staffs.find(s => Number(s.id) === Number(this.selectedStaffId));
  
  // Ellenőrizzük, hogy az orvoshoz vannak-e rendelve kezelések
  if (selectedStaff && selectedStaff.treatments && selectedStaff.treatments.length > 0) {
    // Mivel a backend objektumokat ad vissza (id, name, price), kinyerjük az ID-kat
    const allowedIds = selectedStaff.treatments.map((t: any) => Number(t.id));
    
    this.filteredConsultations = this.consultations.filter(c => 
      allowedIds.includes(Number(c.id))
    );
  } else {
    // Ha az orvoshoz nincs semmi rendelve, üres listát mutatunk (vagy igény szerint az összeset)
    this.filteredConsultations = [];
  }

  // Megnézzük, hogy az aktuálisan kiválasztott szolgáltatás szerepel-e az új szűrt listában
  const isStillAvailable = this.filteredConsultations.some(
    c => Number(c.id) === Number(this.selectedConsultationId)
  );

  // Ha már nem választható az adott szolgáltatás az új orvosnál, váltunk az első elérhetőre
  if (!isStillAvailable && this.filteredConsultations.length > 0) {
    this.selectedConsultationId = Number(this.filteredConsultations[0].id);
  } else if (this.filteredConsultations.length === 0) {
    this.selectedConsultationId = null as any;
  }
}

protected onStaffChange(): void {
  this.updateFilteredConsultations();
  this.loadSlots();
}

protected onFilterChange(): void {
  if (this.selectedStaffId && this.selectedConsultationId) {
    this.loadSlots();
  }
}
/**
 * Szabad időpontok lekérése a szerverről
 */
loadSlots(): void {
  if (!this.selectedStaffId || !this.selectedConsultationId) {
    this.availableSlots = [];
    return;
  }

  this.isLoading = true;
  this.bookingApi.getAvailableSlots(
    Number(this.selectedStaffId), 
    Number(this.selectedConsultationId), 
    this.selectedDate
  ).subscribe({
    next: (res: any) => {
      const allData = res.data || res;
      // SZŰRÉS: Csak azokat tartsuk meg, amiknek a dátuma egyezik a kiválasztottal
      this.availableSlots = allData.filter((slot: Slot) => {
        // Feltételezve, hogy a slot.date formátuma "YYYY-MM-DD"
        return slot.date === this.selectedDate;
      });
      this.isLoading = false;
      this.errorMessage = '';
    },
    error: (err: any) => {
      this.isLoading = false;
      this.availableSlots = [];
      this.errorMessage = 'Hiba az időpontok lekérésekor.';
    }
  });
}
/**
 * Foglalási folyamat indítása
 */
onReserve(slot: Slot): void {
  Swal.fire({
    title: 'Foglalás megerősítése',
    text: `Időpont: ${slot.date} ${slot.startTime.slice(0, 5)}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#003366',
    confirmButtonText: 'Igen, lefoglalom',
    cancelButtonText: 'Mégse'
  }).then((result) => {
    if (result.isConfirmed) {
      this.executeBooking(slot);
    }
  });
}

private executeBooking(slot: Slot): void {
  const userId = this.auth.getUserId();

  if (!userId) {
    Swal.fire('Hiba', 'A foglaláshoz be kell jelentkezned!', 'warning');
    this.router.navigate(['/login']);
    return;
  }

  const selectedType = this.consultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

  const bookingData = {
    slotId: Number(slot.id),
    patientId: Number(userId),
    staffId: Number(slot.staffId), 
    consultationId: Number(this.selectedConsultationId),
    name: selectedType?.name || 'Konzultáció',
    price: selectedType?.price || 0,
    startTime: slot.startTime, 
    date: slot.date,
    status: 'Confirmed',
    isPublic: false 
  };

  this.bookingApi.createBooking(bookingData as any).subscribe({
    next: () => {
      Swal.fire('Sikeres foglalás!', 'Időpontod rögzítettük.', 'success');
      this.loadSlots(); 
    },
    error: (err) => {
      const msg = err.error?.message || 'A foglalás nem sikerült.';
      Swal.fire('Hiba', msg, 'error');
    }
  });
}
}