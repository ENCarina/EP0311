import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../shared/admin.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  private readonly navyColor = '#001f3f';
  private readonly specialtyOptions: Record<string, string> = {
    Kardiológus: 'Kardiológus',
    Fogorvos: 'Fogorvos',
    Pszichiáter: 'Pszichiáter',
    Szemész: 'Szemész',
    Nőgyógyász: 'Nőgyógyász',
    Bőrgyógyász: 'Bőrgyógyász',
    Neurológus: 'Neurológus',
    Ortopéd: 'Ortopéd',
    Urológus: 'Urológus',
    Endokrinológus: 'Endokrinológus',
    Pulmonológus: 'Pulmonológus',
    'Fül-orr-gégész': 'Fül-orr-gégész',
    Gasztroenterológus: 'Gasztroenterológus',
    Reumatológus: 'Reumatológus',
    Diabetológus: 'Diabetológus',
    Asszisztens: 'Asszisztens'
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
   this.adminService.getAllUsers().subscribe({
    next: (res: any) => {
     
      const data = Array.isArray(res) ? res : (res.data || []);
       
      this.users = data.map((u: any) => {
        const hasStaffProfile = !!u.staffProfile;
        let activeStatus: boolean;
        if (hasStaffProfile) {
          activeStatus = u.staffProfile.isActive === true || u.staffProfile.isActive === 1;
        } else {
          // Sima felhasználóknál (vagy Adminnál staff profil nélkül)
          activeStatus = u.isActive !== undefined ? Boolean(u.isActive) : true;
        }
        return{
          ...u,
          isActive: activeStatus
        };
    }),
    console.log('Sikeresen feldolgozott felhasználók:', this.users)
  },
    error: (err) => {
      console.error('Hiba a betöltésnél:', err);
      Swal.fire('Hiba', 'Nem sikerült betölteni a listát', 'error');
    }
  });
}
onToggleActive(user: any) {
  // 1. Meghatározzuk az új státuszt 
  const newStatus = !user.isActive;
  const userId = user.id;

  this.adminService.updateUserStatus(userId, newStatus).subscribe({
    next: () => {
      user.isActive = newStatus;
      
      if (user.staffProfile) {
        user.staffProfile.isActive = newStatus;
      }
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: 'success',
        title: `Felhasználó ${newStatus ? 'aktiválva' : 'archiválva'}`
      });
    },
    error: (err) => {
      console.error('Státuszmódosítási hiba:', err);
      if (err.status === 404) {
        Swal.fire({
          title: 'Hiba',
          text: 'A rendszer nem találta a felhasználóhoz tartozó szakmai profilt.',
          icon: 'error'
        });
      } else {
        Swal.fire({
          title: 'Hiba',
          text: 'A státusz módosítása sikertelen volt a szerver oldalon.',
          icon: 'error',
          confirmButtonColor: '#001f3f'
        });
      }
    }
  });
}

onResetPassword(user: any) {
  Swal.fire({
    title: `Jelszó visszaállítása: ${user.name}`,
    input: 'password',
    inputLabel: 'Új jelszó megadása',
    inputPlaceholder: 'Legalább 6 karakter...',
    showCancelButton: true,
    confirmButtonText: 'Módosítás',
    cancelButtonText: 'Mégse',
    inputValidator: (value) => {
      if (!value || value.length < 6) return 'Legalább 6 karakter kell!';
        return null;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const payload = { password: result.value, confirmPassword: result.value };
      
      this.adminService.resetPassword(user.id, payload).subscribe({
        next: (res) => {
          Swal.fire('Siker!', 'A jelszó sikeresen módosítva.', 'success');
        },
        error: (err) => {
          Swal.fire('Hiba', err.error.message || 'Nem sikerült a módosítás', 'error');
        }
      });
    }
  });
}
onPromoteToStaff(user: any) {
  Swal.fire({
    title: 'Szakember kinevezése',
    text: `Válasszon szakterületet a következőhöz: ${user.name}`,
    input: 'select',
    inputOptions: this.specialtyOptions,
    inputLabel: 'Szakterület',
    inputPlaceholder: 'Válasszon szakterületet',
    showCancelButton: true,
    confirmButtonText: 'Kinevezés',
    cancelButtonText: 'Mégse',
    confirmButtonColor: this.navyColor,
    inputValidator: (value) => {
      if (!value) return 'A munkakör megadása kötelező!';
      return null;
      }
  }).then((result) => {
    if (result.isConfirmed) {
      this.adminService.promoteUser(user.id, { specialty: String(result.value).trim() }).subscribe({
        next: () => {
          Swal.fire('Siker!', 'A státusz módosítva.', 'success');
          this.loadUsers(); // Lista frissítése
        },
        error: (err:any) => Swal.fire('Hiba', err.error.message || 'Sikertelen művelet', 'error')
      });
    }
  });
}

onEditUser(user: any) {
    Swal.fire({
      title: `${user.name} adatainak szerkesztése`,
      html: `
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">Név</label>
          <input type="text" id="edit-name" class="swal2-input m-0 w-100" value="${user.name}">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">Email</label>
          <input type="email" id="edit-email" class="swal2-input m-0 w-100" value="${user.email}">
        </div>
      `,
      confirmButtonText: 'Mentés',
      confirmButtonColor: this.navyColor,
      showCancelButton: true,
      preConfirm: () => {
        const name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('edit-email') as HTMLInputElement).value;
        if (!name || !email) Swal.showValidationMessage('Minden mezőt töltsön ki!');
        return { name, email };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Itt hívjuk meg a backendet
      this.adminService.updateUser(user.id, result.value).subscribe({
        next: () => {
          Swal.fire('Siker!', 'Az adatok frissültek.', 'success');
          this.loadUsers(); // Frissítjük a listát, hogy lássuk a változást
        },
        error: (err:any) => Swal.fire('Hiba', 'Nem sikerült a mentés', 'error')
      });
    }
  });
}
  onArchive(id: number) {
    Swal.fire({
      title: 'Biztosan archiválod?',
      text: "A felhasználó nem tud majd belépni!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Igen, archiváld!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.archiveUser(id).subscribe({
          next: () => {
            Swal.fire('Sikeres!', 'Felhasználó archiválva.', 'success');
            this.loadUsers(); 
          },
          error: (err) => {
          Swal.fire('Hiba', err.error?.message || 'Sikertelen művelet', 'error');
        }
        });
      }
    });
  }
}
