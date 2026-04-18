# 🌐 Végpontok (API Endpoints)

## 🔐 Auth & Profil - Hitelesítés és Kezelés
| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/register` | POST | ❌ | Új felhasználó regisztrációja |
| `/login` | POST | ❌ | Bejelentkezés és JWT token generálása |
| `/verify-email/:token`| GET | ❌ | E-mail cím megerősítése token alapján |
| `/forgot-password` | POST | ❌ | Jelszó-visszaállítási kérelem küldése |
| `/reset-password` | POST | ❌ | Új jelszó beállítása token segítségével |
| `/profile/me` | GET | ✅ | Bejelentkezett felhasználó saját adatai |
| `/profile/update` | PUT | ✅ | Saját profiladatok módosítása |

---

## 👨‍⚕️ Staffs - Személyzet és Szakemberek
| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/staff` | GET | ❌ | Összes szakember listázása (Admin nézet) |
| `/staff/public` | GET | ❌ | Nyilvános szakemberi profilok listája |
| `/staff/:id` | GET | ❌ | Egy adott szakember adatlapja |
| `/staff/:id/treatments`| GET | ❌ | Szakemberhez rendelt szolgáltatások listája |
| `/staff` | POST | Admin | Új szakember felvétele |
| `/staff/:id/treatments`| POST | Admin | Szolgáltatások hozzárendelése szakemberhez |
| `/staff/promote` | POST | Admin | Felhasználó előléptetése szakemberré |
| `/staff/:id` | PUT | Admin | Szakember adatainak frissítése |
| `/staff/:id` | DELETE | Admin | Szakember törlése |

---

### Új Személy felvétele 
* `/api/staff` POST

```json
{
    "userId": "102",
    "role": "doctor",
    "specialty": "fogorvos",
    "isAvailable": true,
    "bio": "15 éves nemzetközi tapasztalattal rendelkező...",
    "imageUrl": "[https://example.com/images/dr_toth.jpg](https://example.com/images/dr_toth.jpg)"
}

```
### Személyzet frissítése 
* `/api/staff/:id` PUT

```json
{
    "specialty": "Kardiológus", 
    "bio": "20 év tapasztalat a kardiológiai rehabilitációban.", 
    "role": "doctor"
}
```
### Személy törlése 

* /api/staff/:id DELETE

## 🩺 Consultations - Vizsgálatok és Kezelések
| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/consultations` | GET | ❌ | Összes elérhető vizsgálat/kezelés listája |
| `/consultations/:id` | GET | ❌ | Egy vizsgálat részletes adatai |
| `/consultations` | POST | Admin | Új vizsgálati típus felvétele |
| `/consultations/:id` | PUT | Admin | Vizsgálat módosítása |
| `/consultations/:id` | DELETE | Admin | Vizsgálat törlése |

---

### Vizsgálat lekérdezése 

* /api/consultations GET

### Új Vizsgálat felvétele 

* `/api/consultations` POST

```json
{
    "name": "Kardiológiai szakvizsgálat",
    "description": "Teljes körű szív- és érrendszeri állapotfelmérés",
    "specialty": "Kardiológia",
    "duration": 30 ,
    "price": 25000
}
```

### Vizsgálat frissítése 

* /api/consultations/5 PUT

```json
 {
      "name": "Fogászati kontroll",
      "description": "Általános állapotfelmérés és tanácsadás",
      "specialty": "Fogászat",
      "duration": 20,
      "price": 15000.00
    }
```

### Vizsgálat törlése 

* /api/consultations/7 DELETE

## 📅 Bookings & Slots - Foglalás és Időpontok

| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/slots` | GET | ❌ | Összes időpont lekérése |
| `/slots/generate` | POST | ✅ Admin | Időpontok generálása (bulk) |
| `/bookings` | GET | ✅ Token | Saját foglalások listája |
| `/bookings` | POST | ✅ Token | Időpont lefoglalása |
| `/bookings/:id` | DELETE | ✅ Token | Foglalás lemondása (24h szabály) |

### Új Foglalás felvétele
* `/api/bookings` POST

```json
{
    "slotId": 15,
    "treatmentId": 2,
    "notes": "Fogfájás miatt sürgős.",
    "lang": "hu"
}
```
## 📅 Slots & Bookings - Időpontok és Foglalás
| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/slots` | GET | ❌ | Elérhető szabad időpontok listázása |
| `/slots/:id` | GET | ✅ | Egy konkrét idősáv részletei |
| `/slots` | POST | Staff | Új idősáv manuális felvétele |
| `/slots/generate` | POST | ✅ | Időpontok tömeges generálása (Bulk) |
| `/slots/:id` | PUT | ✅ | Idősáv módosítása |
| `/slots/:id` | DELETE | ✅ | Idősáv törlése |
| `/bookings` | GET | ✅ | Saját foglalások lekérése |
| `/bookings/:id` | GET | ✅ | Egy konkrét foglalás részletei |
| `/bookings` | POST | ✅ | Időpont lefoglalása |
| `/bookings/:id` | PUT | ✅ | Foglalás módosítása |
| `/bookings/:id` | DELETE | ✅ | Foglalás törlése / Lemondása |

---

## 👥 Users - Felhasználók (Adminisztráció)
| Végpont | Metódus | Auth | Leírás |
| :--- | :--- | :--- | :--- |
| `/users` | GET | Admin | Összes felhasználó listázása |
| `/users/:id` | GET | ✅ | Egy felhasználó adatainak megtekintése |
| `/users/:id/status` | POST | Admin | Felhasználó tiltása/aktiválása |
| `/users/:id/password` | POST | Admin | Jelszó kényszerített módosítása |
| `/users/:id` | PUT | Admin | Felhasználói adatok adminisztrátori módosítása |
| `/users/:id` | DELETE | Admin | Felhasználó végleges törlése |

---

### 🛠 Technikai Megjegyzések

**Jogosultsági szintek (Roles):**
* **0 (User):** Páciens. Foglalhat, látja saját adatait.
* **1 (Staff):** Szakember. Időpontokat kezelhet és generálhat.
* **2 (Admin):** Teljes hozzáférés. Kezelheti a dolgozókat, vizsgálatokat és felhasználói státuszokat.
  
**Példa: Időpontok tömeges generálása (POST `/slots/generate`)**
```json
{
    "staffId": 5,
    "startDate": "2026-05-20",
    "endDate": "2026-05-24",
    "startTime": "08:00",
    "endTime": "16:00",
    "slotDuration": 30
}

### Hibakezelés:

Minden végpont egységes JSON választ ad:

Siker: { "success": true, "data": [...] }

Hiba: { "success": false, "message": "ERROR_CODE" } (A hibaüzenet nyelvi kulcs, amit a Frontend fordít le).