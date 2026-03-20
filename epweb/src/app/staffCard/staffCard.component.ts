import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
          const idForRotation = s.id || Math.floor(Math.random() * 100);
          const rotationNumber = (i % 5) + 1;
          const fallbackImg = `/images/doctor${rotationNumber}.png`;

          const dbImage = s.imageUrl && s.imageUrl !== 'null' ? s.imageUrl.trim() : null;

          let finalUrl: string;
          
          if (dbImage && dbImage.length > 2) {

            if (dbImage.startsWith('http')) {

              finalUrl=dbImage;
            } else {
              const cleanPath = dbImage.startsWith('/') ? dbImage : '/' + dbImage;
              finalUrl = cleanPath.includes('/images/') ? cleanPath : `/images${cleanPath}`;
            }
            } else {
              finalUrl = fallbackImg;
            }

            return {
              ...s,
              name: s.user?.name || s.name || 'Névtelen',
              specialty: s.specialty || 'Szakorvos',
              imageUrl: finalUrl,
              fallbackImg: fallbackImg
            };
          });
      },
      error: (err) => console.error('Hiba:', err)
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
    this.selectedStaff = staff;

    this.staffService.getTreatmentsForStaff(staff.id).subscribe({
        next: (res: any) => {

            if (res && res.success && res.data) {
              this.selectedStaff = { 
              ...this.selectedStaff, 
              treatments: res.data 
            };
            
                console.log('Sikeres mentés! Tartalom:', this.selectedStaff.treatments);
            }
          },
          error: (err) => console.error('Hiba:', err)
        });
        
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList(): void {
    this.selectedStaff = null;
  }
}
