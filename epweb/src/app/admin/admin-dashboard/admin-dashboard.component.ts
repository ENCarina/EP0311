import { Component, OnInit, inject } from '@angular/core';
import { AdminService } from '../../shared/admin.service';
import { StaffService } from '../../shared/staff.service';
import { ConsultationService } from '../../shared/consultation.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { forkJoin, finalize } from 'rxjs';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TranslateModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private staffService = inject(StaffService);
  private consultationService = inject(ConsultationService);
  public translate = inject(TranslateService);

  public isLoading = false;
  public stats = {
    totalRevenue: 0,
    cancellationRate: 0,
    totalBookings: 0,
    activeStaffCount: 0
  };

  // KPI Adatszerkezetek
  public staffEfficiency: any[] = [];
  public topServices: any[] = [];
  public heatmapData: any = {}; 
  
  protected readonly hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  protected readonly weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  keepOrder = (a: any, b: any) => 0;
  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    forkJoin({
      users: this.adminService.getAllUsers(),
      bookings: this.adminService.getAllBookings(),
      consultations: this.consultationService.getConsultations(),
      staffs: this.staffService.getStaff()
    }).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (res: any) => {
        //let bookings = Array.isArray(res.bookings) ? res.bookings : (res.bookings.data || []);
        const bookings = Array.isArray(res.bookings) ? res.bookings : (res.bookings.data || []);
        const staffs = Array.isArray(res.staffs) ? res.staffs : (res.staffs.data || []);
        const consultations = Array.isArray(res.consultations) ? res.consultations : (res.consultations.data || []);

        if (bookings.length === 0 && staffs.length > 0) {
          //console.warn('No real bookings found, generating demo data for presentation...');
          //bookings = this.generateDemoBookings(staffs, consultations);
        }
        this.stats.activeStaffCount = staffs.length;
        this.calculateFinancials(bookings);
        this.calculateStaffEfficiency(staffs, bookings);
        this.calculateTopServices(bookings, consultations);
        this.generateHeatmap(bookings);
      },
      error: (err) => {
        console.error(this.translate.instant('COMMON.ERROR.TITLE'), err);
        Swal.fire({
          title: this.translate.instant('COMMON.ERROR.TITLE'),
          text: this.translate.instant('COMMON.LOADING_ERROR'),
          icon: 'error'
         });
      } 
    });
  }
  // private generateDemoBookings(staffs: any[], consultations: any[]): any[] {
  //   const demoBookings: any[] = [];
  //   const statuses = ['confirmed', 'confirmed', 'confirmed', 'cancelled']; // 25% lemondási arány szimulálása
    
  //   // Generálunk ~40 foglalást az elmúlt és a következő napokra
  //   for (let i = 0; i < 40; i++) {
  //     const randomStaff = staffs[Math.floor(Math.random() * staffs.length)];
  //     const randomConsult = consultations[Math.floor(Math.random() * consultations.length)];
  //     const randomDay = this.weekDays[Math.floor(Math.random() * this.weekDays.length)];
  //     const randomHour = this.hours[Math.floor(Math.random() * this.hours.length)];
      
  //     // Dátum: a mai héthez igazítva
  //     const d = new Date();
  //     d.setDate(d.getDate() + (Math.floor(Math.random() * 10) - 5)); 

  //     demoBookings.push({
  //       id: i,
  //       status: statuses[Math.floor(Math.random() * statuses.length)],
  //       staffId: randomStaff.id,
  //       consultationId: randomConsult.id,
  //       treatment: { price: randomConsult.price || 15000 },
  //       timeSlot: {
  //         date: d.toISOString().split('T')[0],
  //         startTime: randomHour
  //       }
  //     });
  //   }
  //   return demoBookings;
  // }

  // 1. Bevétel és Lemondási arány
  private calculateFinancials(bookings: any[]): void {
    this.stats.totalBookings = bookings.length;
    const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'archived').length;
    
    this.stats.cancellationRate = bookings.length > 0 ? (cancelled / bookings.length) * 100 : 0;
    
    // Csak a nem lemondott foglalások árát adjuk össze
    this.stats.totalRevenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.treatment?.price || 0), 0);
  }

  // 2. Staff Hatékonyság (Táblához)
  private calculateStaffEfficiency(staffs: any[], bookings: any[]): void {
    this.staffEfficiency = staffs.map(s => {
      const staffBookings = bookings.filter(b => b.staffId === s.id);
      // van adatunk az összes slotról, ha nincs, a foglalások számát vetítjük egy elvárt heti 40-es számra
      const capacity = 40; 
      const utilization = (staffBookings.length / capacity) * 100;
      
      return {
        name: s.user?.name || s.name,
        specialty: s.specialty,
        bookingCount: staffBookings.length,
        utilization: utilization > 100 ? 100 : utilization
      };
    }).sort((a, b) => b.utilization - a.utilization);
  }

  // 3. Legnépszerűbb szolgáltatások
  private calculateTopServices(bookings: any[], consultations: any[]): void {
    const counts = bookings.reduce((acc: any, b: any) => {
      acc[b.consultationId] = (acc[b.consultationId] || 0) + 1;
      return acc;
    }, {});

    this.topServices = consultations.map(c => ({
      name: c.name,
      count: counts[c.id] || 0,
      revenue: (counts[c.id] || 0) * c.price
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  // 4. Heti Heatmap adatok előkészítése
  private generateHeatmap(bookings: any[]): void {
    this.heatmapData = {};
    this.weekDays.forEach(day => {
      this.heatmapData[day] = {};
      this.hours.forEach(hour => this.heatmapData[day][hour] = 0);
    });

    // Feltöltés
    bookings.forEach(b => {
      if (b.timeSlot?.date && b.timeSlot?.startTime) {
        const dateObj = new Date(b.timeSlot?.date);
        const dayKey = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const hourKey = b.timeSlot?.startTime.substring(0, 5);

        if (this.heatmapData[dayKey] && this.heatmapData[dayKey][hourKey] !== undefined) {
          this.heatmapData[dayKey][hourKey]++;
        }
      }
    });
  }

  //PDF Riport generálás 
  exportToPDF() {
    
    console.log('Adatok:', this.heatmapData);
  
    const doc = new jsPDF();
    const locale = this.translate.currentLang === 'hu' ? 'hu-HU' : 'en-GB';
    const timestamp = new Date().toLocaleString(locale);
    
    const title = this.translate.instant('DASHBOARD.PDF_TITLE');
    const generatedText = this.translate.instant('DASHBOARD.PDF_GENERATED');
    const fileName = this.translate.instant('DASHBOARD.PDF_FILENAME');

    // 1. Cím és fejléc
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${generatedText}: ${timestamp}`, 14, 28);

    // 2. Táblázat fejlécek fordítása
    const headers = [
      this.translate.instant('BOOKINGS.TABLE.TIME'),
      this.translate.instant('DAYS.MONDAY'),
      this.translate.instant('DAYS.TUESDAY'),
      this.translate.instant('DAYS.WEDNESDAY'),
      this.translate.instant('DAYS.THURSDAY'),
      this.translate.instant('DAYS.FRIDAY')
    ];
    // 3. Adatok előkészítés (csak az első 5 nap a PDF-be a helyhiány miatt)
    const times = ['08:00', '10:00', '12:00', '14:00', '16:00'];

    const body = this.hours.map(time => {
    return [
      time,
      this.heatmapData['MONDAY']?.[time] ?? 0,
      this.heatmapData['TUESDAY']?.[time] ?? 0,
      this.heatmapData['WEDNESDAY']?.[time] ?? 0,
      this.heatmapData['THURSDAY']?.[time] ?? 0,
      this.heatmapData['FRIDAY']?.[time] ?? 0
    ];
  });
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] }, 
      styles: { fontSize: 9 }
    });

    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
  }

  getHeatmapColor(count: number): string {
    if (count === 0) return '#f8f9fa';
    if (count < 3) return '#d1e3ff';
    if (count < 6) return '#70a5ff';
    return '#001f3f'; 
  }
}