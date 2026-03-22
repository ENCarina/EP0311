import { Routes } from '@angular/router';
import { BookingComponent } from './booking/booking.component';
import { StaffComponent } from './staff/staff.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { ConsultationComponent } from './consultation/consultation.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { StaffCardComponent } from './staffCard/staffCard.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { authGuard } from './auth-guard';
import { UserListComponent } from './admin/user-list/user-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';


export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component:HomeComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'verify-email/:token', component: VerifyEmailComponent},
    { path: 'about', component:AboutComponent},
    //publikus kártya
    { path: 'staffCard', component: StaffCardComponent }, 
    //{ path: 'staff/:id', component: StaffDetailComponent }, 
   
    { path: 'booking/:id', component: BookingComponent, canActivate: [authGuard] },
    { path: 'booking', component:BookingComponent, canActivate: [authGuard]},
    
    //admin
    { path: 'admin/users', component: UserListComponent, canActivate: [authGuard] }, 
    { path: 'admin/staff', component: StaffComponent, canActivate: [authGuard]},
    { path: 'admin/consultation', component:ConsultationComponent, canActivate: [authGuard]},
    
    { path: '**', redirectTo: 'home' },

];
