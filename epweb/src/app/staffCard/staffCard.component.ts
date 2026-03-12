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
      next: (res:any) => {
        const rawData = res.data || res;
        this.staffs = rawData.map((s: any) => {
          const profile = s.staffProfile || s.user;

          let imagePath = '/images/default-doctor.png'; 
          if (s.id === 1) imagePath = '/images/doc1.jpg'; 
          if (s.id === 2) imagePath = '/images/doc2.jpg';
          if (s.id === 3) imagePath = '/images/doc3.jpg';
          return {
            ...s,
            name: s.staffProfile?.name || s.name || 'Névtelen',
            role: s.staffProfile?.roleId?.toString() || s.role || '1',
            imageUrl: imagePath
          };  
        });
      },
      error: (err) => console.error(err) 
    });      
  }
  selectStaff(staff: any): void {
    this.selectedStaff = staff;
    window.scrollTo(0, 0); // Ugrás az oldal tetejére
  }

  backToList(): void {
    this.selectedStaff = null;
  }
}
