import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-staff-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staffCard.component.html',
  styleUrl: './staffCard.component.css',
})
export class StaffCardComponent implements OnInit {
  private staffService = inject(StaffService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private readonly femaleDoctorImage = '/images/female_doctor.webp';
  private readonly maleDoctorImage = '/images/male_doctor.webp';
  private readonly defaultDoctorImage = '/images/default_doctor.png';
  private readonly femaleNameMarkers = new Set([
    'anna',
    'emese',
    'tunde',
    'tünde',
    'eszter',
    'julia',
    'júlia',
    'maria',
    'mária',
    'zsofia',
    'zsófia',
    'dora',
    'dóra',
    'reka',
    'réka',
    'noemi',
    'noémi'
  ]);

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
          .map((s: any) => {
          const fallbackImg = this.getFallbackImage(s);
          const originalImageUrl = this.normalizeImageUrl(s.imageUrl);

            const processedStaff = {
              ...s,
              name: s.user?.name || s.name || 'Névtelen',
              specialty: s.specialty || 'Szakorvos',
              imageUrl: fallbackImg,
              originalImageUrl,
              assignedFallback: fallbackImg,
              fallbackImg: fallbackImg,
              treatments: []
            };
            this.staffService.getTreatmentsForStaff(s.id).subscribe({
            next: (tRes: any) => {
              if (tRes && tRes.data) {
                processedStaff.treatments = tRes.data;
              } else if (Array.isArray(tRes)) {
                processedStaff.treatments = tRes;
              }
            }
          });
          return processedStaff;
        });
    },
      error: (err) => console.error('Hiba:', err)
    });
  }

  private getFallbackImage(staffMember: any): string {
    const fullName = (staffMember?.user?.name || staffMember?.name || '').toString().toLocaleLowerCase('hu-HU');
    const normalizedName = fullName
      .replace(/^dr\.\s*/i, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const nameParts = normalizedName.split(/\s+/).filter(Boolean);
    const isFemale = nameParts.some((part: string) => this.femaleNameMarkers.has(part));

    return isFemale ? this.femaleDoctorImage : this.maleDoctorImage;
  }

  private normalizeImageUrl(imageUrl: string | null | undefined): string | null {
    const dbImage = imageUrl && imageUrl !== 'null' ? imageUrl.trim() : null;

    if (!dbImage || dbImage.length <= 2) {
      return null;
    }

    if (dbImage.startsWith('http')) {
      return dbImage;
    }

    const cleanPath = dbImage.startsWith('/') ? dbImage : '/' + dbImage;
    return cleanPath.includes('/images/') ? cleanPath : `/images${cleanPath}`;
  }

  goToBooking(staffId: number): void {
    this.router.navigate(['/booking'], { 
      queryParams: { staffId: staffId } 
    });
  }
  public handleImageError(staffMember: any): void {
    const absoluteDefault = this.defaultDoctorImage;

    if (staffMember.imageUrl === absoluteDefault) return;

    if (staffMember.imageUrl !== staffMember.fallbackImg) {
      staffMember.imageUrl = staffMember.fallbackImg;
    } else {
      staffMember.imageUrl = absoluteDefault;
    }
  }
  selectStaff(staff: any): void {
    this.selectedStaff = { ...staff , treatments: []};

    this.staffService.getTreatmentsForStaff(staff.id).subscribe({
        next: (res: any) => {
          const incomingData = res?.data || res;
          if (Array.isArray(incomingData)) {

            this.selectedStaff = { 
            ...this.selectedStaff, 
              treatments: incomingData 
            };
            console.log(`Sikeres betöltés (${staff.name}):`, incomingData);
            } else {
            console.warn('A kapott adat nem tömb formátumú:', res);
            }
          },
          error: (err) => {
            console.error('Hiba:', err);
            this.selectedStaff.treatments = [];
          }
        });
        
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList(): void {
    this.selectedStaff = null;
  }
}
