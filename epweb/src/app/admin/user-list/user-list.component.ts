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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
   this.adminService.getAllUsers().subscribe({
    next: (res: any) => {
      console.log('Megérkezett adatok:', res);
      const data = Array.isArray(res) ? res : (res.data || []);
       
      this.users = data.map((u: any) => {
        const status = u.staff ? u.staff.isActive : u.isActive;
        return{
          ...u,
          isActive:(status === undefined || status === null) ? true : Boolean(status)
        };
    }),
    console.log('Feldogozott user adatok:', this.users)
  },
    error: (err) => {
      console.error('Hiba a betöltésnél:', err);
      Swal.fire('Hiba', 'Nem sikerült betölteni a listát', 'error');
    }
  });
}
  onToggleActive(user: any) {
    const newStatus = !user.isActive;
    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
    next: () => {
      user.isActive = newStatus; 
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
      Toast.fire({
        icon: 'success',
        title: `Felhasználó ${newStatus ? 'aktiválva' : 'inaktiválva'}`
      });
    },
    error: (err) => Swal.fire('Hiba', 'Státusz módosítása sikertelen', 'error')
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
    text: `Adja meg a munkakört (pl. Asszisztens vagy Orvos) a következőhöz: ${user.name}`,
    input: 'text',
    inputLabel: 'Szakterület (pl. Fogorvos)',
    inputPlaceholder: 'Munkakör megnevezése...',
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
      this.adminService.promoteUser(user.id, { specialty: result.value }).subscribe({
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
