import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-staff-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './staffCard.component.html',
  styleUrl: './staffCard.component.css',
})
export class StaffCardComponent implements OnInit {
  private api = inject(StaffService);
  public auth = inject (AuthService);

  staffs: any[] = [];
  selectedStaff: any = null;

  ngOnInit(): void {
    this.loadStaffData();
  }
  
  private loadStaffData(): void {
    this.api.getStaff().subscribe({
      next: (res: any) => {
        const rawData = res.data || res;
        const activeStaff = rawData.filter((s: any) => s.isActive === true || s.isActive === 1);

        this.staffs = activeStaff.map((s: any, i: number) => {
        
          const defaultImgNumber = (i % 3) + 1;
          const defaultPath = `/images/doc${defaultImgNumber}.jpg`;

          const hasValidImage = s.imageUrl && 
                        s.imageUrl !== 'null' && 
                        s.imageUrl.trim() !== '' &&
                        s.imageUrl.length > 5;

          return {
            ...s,
            name: s.user?.name || s.name || 'Névtelen',
            specialty: s.specialty || 'Szakorvos',
            imageUrl: hasValidImage ? s.imageUrl : defaultPath
          };  
        });
        console.log('Feldolgozott staffs:', this.staffs);
      },
      error: (err) => console.error('Hiba:', err)
    });      
  }

  selectStaff(staff: any): void {
    this.selectedStaff = staff;
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  backToList(): void {
    this.selectedStaff = null;
  }
}
