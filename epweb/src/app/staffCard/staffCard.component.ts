import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-staff-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './staffCard.component.html',
  styleUrl: './staffCard.component.css',
})
export class StaffCardComponent implements OnInit {
  private staffService = inject(StaffService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private readonly translate = inject(TranslateService);

  staffs: any[] = [];
  selectedStaff: any = null;

  ngOnInit(): void {
    this.loadStaffData();
  }

  private loadStaffData(): void {
    this.staffService.getStaff().subscribe({
      next: (res: any) => {
        const rawData = res.data || res;
        if (!Array.isArray(rawData)) return;

        this.staffs = rawData
          .filter((s: any) => s.isActive === true || s.isActive === 1)
          .map((s: any, i: number) => {
            const name = s.user?.name || s.name || '';
            const femaleNames = ['Tünde', 'Beatrix', 'Julianna', 'Anna', 'Eszter', 'Lilla', 'Andrea', 'Kata'];
            const isFemale = femaleNames.some(fn => name.includes(fn));

            let fallback: string;
            if (isFemale) {
              fallback = (i % 4 < 2) ? '/images/doctor2.png' : '/images/doctor4.png';
            } else {
              fallback = (i % 4 < 2) ? '/images/doctor1.png' : '/images/doctor3.png';
            }

            const dbImage = s.imageUrl && s.imageUrl !== 'null' ? s.imageUrl.trim() : null;
            let finalUrl: string;

            if (dbImage && dbImage.length > 2) {
              if (dbImage.startsWith('http')) {
                finalUrl = dbImage;
              } else {
                const cleanPath = dbImage.startsWith('/') ? dbImage : '/' + dbImage;
                finalUrl = cleanPath.includes('/images/') ? cleanPath : `/images${cleanPath}`;
              }
            } else {
              finalUrl = fallback;
            }

            const processedStaff = {
              ...s,
              name: s.user?.name || s.name || 'COMMON.UNKNOWN_NAME',
              specialty: s.specialty || 'GENERAL', 
              imageUrl: finalUrl,
              assignedFallback: fallback,
              treatments: []
            };

            this.staffService.getTreatmentsForStaff(s.id).subscribe({
              next: (tRes: any) => {
                const tData = tRes?.data || tRes;
                if (Array.isArray(tData)) {
                  processedStaff.treatments = tData;
                }
              }
            });
            return processedStaff;
          });
      },
      error: (err) => {
        console.error('Staff data loading error:', err);
      }
    });
  }

  goToBooking(staffId: number): void {
    this.router.navigate(['/booking'], {
      queryParams: { staffId: staffId }
    });
  }

  public handleImageError(staffMember: any): void {
    const absoluteDefault = '/images/default_doctor.png';
    if (staffMember.imageUrl === absoluteDefault) return;

    if (staffMember.imageUrl !== staffMember.assignedFallback) {
      staffMember.imageUrl = staffMember.assignedFallback;
    } else {
      staffMember.imageUrl = absoluteDefault;
    }
  }

  selectStaff(staff: any): void {
    this.selectedStaff = { ...staff, treatments: [] };

    this.staffService.getTreatmentsForStaff(staff.id).subscribe({
      next: (res: any) => {
        const incomingData = res?.data || res;
        if (Array.isArray(incomingData)) {
          this.selectedStaff.treatments = incomingData;
        } else {
          this.selectedStaff.treatments = [];
        }
      },
      error: (err) => {
        console.error('Treatments loading error:', err);
        this.selectedStaff.treatments = [];
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList(): void {
    this.selectedStaff = null;
  }
}