# 3.2 ElitPort Frontend - Technikai Dokumentáció

## 3.2.1 Mappa Struktúra

Az alkalmazás az Angular keretrendszer modern, moduláris és Standalone komponens-alapú architektúráját követi. A projekt felépítése a könnyű karbantarthatóságot és a logikai elkülönítést (Separation of Concerns) tartja szem előtt.


```text
ElitPort/
├── public/                     # Statikus, publikusan elérhető erőforrások
│   ├── i18n/                   # Nyelvi fájlok a többnyelvűséghez (hu.json, en.json)
│   ├── images/                 # Általános grafikai elemek
│   └── pics/                   # Felhasználói vagy szakember fotók
│
├── src/                        # A forráskód gyökere
│   ├── app/                    # Alkalmazás logika
│   │   ├── components/         # Felhasználói felület (UI) egységei
│   │   │   ├── about/          # Bemutatkozó (Névjegy) oldal
│   │   │   ├── admin/          # Adminisztrációs felület
│   │   │   ├── booking/        # Foglalási folyamat (naptár integráció)
│   │   │   ├── consultation/   # Szolgáltatások kezelése
│   │   │   ├── home/           # Kezdőlap marketing tartalommal
│   │   │   ├── login/          # Bejelentkezési felület
│   │   │   ├── register/       # Regisztrációs folyamat
│   │   │   ├── forgot-password/# Elfelejtett jelszó igénylése
│   │   │   ├── reset-password/ # Jelszó megújítása (token alapú)
│   │   │   ├── verify-email/   # Email cím aktiválása
│   │   │   ├── my-booking/     # Páciens saját foglalásainak listája
│   │   │   ├── staff/          # Szakember naptár és slot kezelés
│   │   │   ├── staffcard/      # Szakemberek publikus listázása és kártyák
│   │   │   ├── nopage/         # 404-es hibaoldal
│   │   │   └── shared/         # Központi infrastruktúra és logikai réteg
│   │   │       ├── interfaces/ # TypeScript adatmodellek
│   │   │       ├── auth.interceptor.ts    # HTTP kérések automatikus fejlécezése
│   │   │       ├── auth.service.ts        # Hitelesítés és állapotkezelés (Signals)
│   │   │       ├── admin.service.ts       # Admin specifikus műveletek
│   │   │       ├── booking.service.ts     # Időpontfoglalási logika
│   │   │       ├── consultation.service.ts# Konzultációk adatkezelése
│   │   │       ├── staff.service.ts       # Szakember management
│   │   │       └── logger.service.ts      # Hibakeresési segédfunkciók
│   │   │
│   │   ├── guards/             # Útvonalvédelem
│   │   │   └── auth-guards.ts  # Bejelentkezés és szerepkör alapú védelem
│   │   │
│   │   ├── app.routes.ts       # Központi útvonalválasztó (Routing)
│   │   └── app.config.ts       # Globális konfiguráció
│   │
│   ├── environments/           # Környezetfüggő beállítások (API URL-ek)
│   ├── main.ts                 # Alkalmazás belépési pontja
│   ├── index.html              # Fő HTML sablon
│   └── styles.css              # Globális stíluslap (Design System)

```

### 3.2.2. Fejlesztéshez használt eszközök és technológiák

Az alkalmazás modern webes technológiákra épül, szem előtt tartva a stabilitást, a reszponzivitást és a professzionális felhasználói élményt.

#### Fejlesztői környezet és keretrendszer:
* **Visual Studio Code:** Az alkalmazás elsődleges integrált fejlesztői környezete (IDE).
* **Angular 20.3.16:** A legújabb generációs frontend keretrendszer, amely Standalone architektúrát, Signal-alapú állapotkezelést és magas szintű típusbiztonságot (TypeScript) biztosít.

#### Megjelenítés és Stílus:
* **CSS3 & SCSS:** Egyedi stílusformázás és design elemek.
* **Bootstrap 5.3.8:** A világ legnépszerűbb CSS keretrendszere, amely a mobil-első (mobile-first) szemléletet és a grid-alapú reszponzív elrendezést garantálja.
* **@ng-bootstrap/ng-bootstrap 17.0.1:** Angular-specifikus Bootstrap komponensek, amelyek natív módon, jQuery nélkül biztosítják az interaktív elemeket (pl. modálok, legördülő menük).

#### Kiegészítő könyvtárak és funkciók:
* **RxJS (~7.8.0):** Reaktív programozási könyvtár az aszinkron adatfolyamok és API hívások hatékony kezeléséhez.
* **SweetAlert2 (11.26.18):** Modern, esztétikus felugró ablakok (popup) a sikeres műveletek és hibaüzenetek vizuális visszacsatolásához.
* **@ngx-translate/core (17.0.0):** Nemzetköziesítési (i18n) motor, amely lehetővé teszi a dinamikus váltást a magyar és angol nyelvek között.
* **jsPDF ( 4.2.1) & jsPDF-AutoTable ( 5.0.7):** PDF generáló motor, amely lehetővé teszi a foglalási adatok vagy listák exportálását közvetlenül a böngészőből, strukturált táblázatos formában.

### 3.2.3. Komponensek

Az alkalmazás komponens-alapú felépítése biztosítja a moduláris működést és a funkciók tiszta elkülönítését.

#### App Komponens (`src/app/app.component.*`)

Az alkalmazás gyökérkomponense (Root Component), amely a teljes rendszer "keretéért" és a globális elrendezésért felelős. Feladata a navigációs sáv (`app-navbar`) és a dinamikus tartalommegjelenítő (`router-outlet`) koordinálása.

**Főbb funkciók:**
* **Layout vezérlés:** Dinamikusan szabályozza a navigációs sáv láthatóságát az aktuális útvonal függvényében.
* **Útvonalfigyelés:** A konstruktorban feliratkozik a `Router` eseményeire, és a `NavigationEnd` esemény bekövetkezésekor ellenőrzi a tartózkodási helyet.
* **Kivételkezelés:** Ha a felhasználó a `/login` vagy a `/passwordchange` oldalon tartózkodik, a rendszer elrejti a navigációs menüt, biztosítva a zavartalan autentikációs folyamatot.

**Technikai paraméterek:**
* **Osztályváltozó:** `showNavbar: boolean` – Logikai változó, amely az Angular modern kontroll struktúráján, az **@if** blokkon keresztül szabályozza a navigációs sáv feltételes megjelenítését a fő sablonban. Ez a megoldás hatékonyabb változásdetektálást tesz lehetővé, mint a korábbi direktíva-alapú megközelítések.
  
#### Dashboard Komponens (`src/app/components/dashboard/*`)

A Dashboard az adminisztrációs és szakemberi felület központi "műszerfala". Feladata, hogy gyors, átfogó képet adjon a rendszer aktuális állapotáról, a közelgő eseményekről és a legfontosabb statisztikai mutatókról.

**Főbb funkciók:**
* **Adatvizualizáció:** Összegzi a legfontosabb mutatószámokat (pl. összes foglalás száma, aktív páciensek, napi bevételek vagy elvégzett konzultációk).
* **Interaktív navigáció:** Gyorselérési pontokat (Quick Actions) biztosít a gyakran használt funkciókhoz, mint például az új időpontok generálása vagy a felhasználói lista kezelése.
* **Státuszfigyelés:** Valós idejű visszajelzést ad a rendszer kritikus adatairól, lehetővé téve az adminisztrátorok számára a gyors döntéshozatalt.
* **Szakember-specifikus nézet:** (Szerepkörtől függően) megjeleníti az adott szakember napi beosztását és a rögzített páciens-konzultációk listáját.

**Technikai jellemzők:**
* **Adatlekérés:** A `shared/` mappában található szervizeken keresztül (pl. `AdminService`, `BookingService`) kommunikál a backenddel az adatok aggregálása érdekében.
* **Reszponzív elrendezés:** A Bootstrap grid rendszerét kihasználva a statisztikai kártyák és táblázatok minden eszközméreten optimálisan jelennek meg.
* **Signal-alapú frissítés:** Az `AuthService` Signal-jait felhasználva személyre szabott üdvözléssel és a jogosultságnak megfelelő tartalommal töltődik be.
#### Admin Dashboard Komponens (`src/app/components/dashboard/*`)

Az Admin Dashboard az alkalmazás üzleti intelligencia központja. Feladata a nyers adatok (felhasználók, foglalások, konzultációk) aggregálása és vizuális prezentálása a döntéshozók számára.

**Főbb üzleti funkciók:**
* **KPI (Key Performance Indicators) elemzés:**
    * **Pénzügyi mutatók:** A rendszer automatikusan számítja az összesített árbevételt a lezárt foglalások alapján.
    * **Lemondási arány:** Kimutatja a törölt foglalások százalékos arányát a hatékonyság méréséhez.
* **Szakember Hatékonyság (Staff Efficiency):** Kiszámítja és rangsorolja a szakemberek kihasználtságát a foglalások száma és az elvárt kapacitás alapján.
* **Szolgáltatás népszerűség:** Meghatározza az 5 legkeresettebb konzultációt, megjelenítve az általuk generált bevételt is.
* **Időpont Heatmap:** Egy heti bontású hőtérképet generál, amely vizuálisan szemlélteti a klinika legforgalmasabb idősávjait.
* **Automatizált PDF Riport:** A `jsPDF` és `autoTable` könyvtárak segítségével azonnali, többnyelvű (i18n támogatott) statisztikai jelentést generál nyomtatható formátumban.

**Technikai megvalósítás és innovációk:**
* **Párhuzamos adatlekérés:** A `forkJoin` operátor használatával több forrásból (Admin, Staff, Consultation Service) párhuzamosan kéri le az adatokat, minimalizálva a várakozási időt.
* **Reaktív adatfeldolgozás:** A backend válaszokat komplex matematikai algoritmusok (`reduce`, `filter`, `map`) dolgozzák fel kliensoldalon, tehermentesítve a szervert.
* **Dinamikus stíluskezelés:** A hőtérkép celláinak színeit (`getHeatmapColor`) algoritmus határozza meg a foglaltság sűrűsége alapján.
* **Állapotkezelés:** Az `isLoading` változó és a `finalize` operátor biztosítja a professzionális felhasználói visszajelzést (loading spinner) az adatfeldolgozás alatt.

**Adatszerkezetek:**
* `stats`: Összesített globális mutatók.
* `staffEfficiency`: Szakemberenkénti kihasználtsági lista.
* `heatmapData`: Kétdimenziós objektum az idősávok és napok metszeteinek tárolására.
  
---

### I. Osztályszintű struktúra: AdminDashboardComponent

A Dashboard az alkalmazás üzleti intelligencia központja, amely a nyers adatok aggregálásáért és vizuális prezentálásáért felelős.

#### I.1. Osztályváltozók (Properties)
| Változó neve | Típus | Leírás |
| :--- | :--- | :--- |
| `isLoading` | `boolean` | Az adatbetöltés alatti várakozási állapotot jelzi. |
| `stats` | `Object` | KPI mutatók (bevétel, lemondási arány, foglalások száma). |
| `staffEfficiency`| `any[]` | Szakemberek kihasználtsági mutatóit tartalmazó tömb. |
| `topServices` | `any[]` | Az 5 legnépszerűbb szolgáltatás statisztikái. |
| `heatmapData` | `any` | Kétdimenziós mátrix a heti foglaltsági hőtérképhez. |
| `hours` | `string[]` | Fix idősávok listája (08:00 - 19:00). |
| `weekDays` | `string[]` | Munkahét napjainak kulcsai (MONDAY-FRIDAY). |

#### I.2. Konstruktor és Injektált szolgáltatások
A komponens a modern Angular `inject()` függvényét használja a függőségek kezelésére:
* `adminService`: Adminisztratív API műveletek.
* `staffService`: Szakember adatok kezelése.
* `consultationService`: Szolgáltatástípusok elérése.
* `translate`: Többnyelvűség (ngx-translate) támogatása.

#### I.3. Főbb Metódusok
* **`loadDashboardData()`**: `forkJoin` operátorral párhuzamosan indítja el az API lekéréseket, majd elosztja az adatokat a kalkulációs metódusoknak.
* **`calculateFinancials()`**: Kiszűri a törölt foglalásokat és kiszámítja az árbevételt.
* **`calculateStaffEfficiency()`**: Szakemberenkénti leterheltséget számol a foglalások száma alapján.
* **`generateHeatmap()`**: Dátum és idő alapján csoportosítja a foglalásokat a heti forgalmi grafikonhoz.
* **`exportToPDF()`**: `jsPDF` és `autoTable` segítségével exportálja az adatokat nyomtatható formátumban.
* **`getHeatmapColor()`**: A foglalások sűrűsége alapján dinamikus színkódot rendel a cellákhoz.

---

### II. Osztályszintű struktúra: Staff / Slot Management

Ez a modul felelős a szakemberek naptárának adminisztrációjáért és az elérhető idősávok kezeléséért.

#### II.1. Osztályváltozók (Properties)
| Változó neve | Típus | Leírás |
| :--- | :--- | :--- |
| `staffData` | `any` | A bejelentkezett szakember profilinformációi. |
| `slots` | `any[]` | Az aktuális szakemberhez tartozó összes időpont. |
| `consultations` | `any[]` | A szakember által végezhető szolgáltatások listája. |
| `selectedDate` | `string` | A naptárban kiválasztott nap kulcsa. |
| `isGenerating` | `boolean` | Tömeges slot-generálás állapotjelzője. |

#### II.2. Konstruktor és Injektált szolgáltatások
* `staffService`: Naptár- és szakember-specifikus API hívások.
* `consultationService`: Szolgáltatások (kezelések) adatbázisa.
* `authService`: Bejelentkezett felhasználói ID és jogosultság ellenőrzése.
* `swalService`: Felhasználói visszajelzések (SweetAlert2).

#### II.3. Staff és Konzultáció műveletek
* **`loadStaffProfile()`**: Betölti a szakember specializációit és személyes adatait.
* **`loadStaffSlots()`**: Frissíti a naptárnézetet az adatbázisból lekérdezett időpontokkal.
* **`addConsultationToStaff()`**: Új szolgáltatástípust rendel a szakember profiljához.

#### II.4. Slot (Időpont) és Foglaláskezelés
* **`generateDailySlots()`**: Automatikus algoritmus, amely adott időintervallumban és felosztásban hoz létre szabad időpontokat.
* **`toggleSlotStatus()`**: Időpontok manuális zárolása vagy felszabadítása.
* **`deleteEmptySlots()`**: A még nem foglalt időpontok tömeges eltávolítása.
* **`updateBookingStatus()`**: Páciens foglalásának jóváhagyása vagy lezárása.
  
---

### III. Osztályszintű struktúra: BookingComponent

Ez a modul felelős a páciens oldali időpontfoglalási felületért. Lehetővé teszi a szakemberek és szolgáltatások közötti böngészést, a szabad időpontok (slotok) vizuális megjelenítését naptárnézetben, valamint a foglalási folyamat végrehajtását.

#### III.1. Osztályváltozók (Properties)

| Változó neve | Típus | Leírás |
| :--- | :--- | :--- |
| **staffs** / **filteredStaffs** | `any[]` | Az összes elérhető szakember és a választott szakterület alapján szűrt listájuk. |
| **availableSlots** | `Slot[]` | A szerverről lekérdezett, foglalható szabad időpontok listája. |
| **consultations** | `Consultation[]` | A rendszerben elérhető összes szolgáltatástípus. |
| **selectedSpecialty** | `string` | A felhasználó által választott szakterület (pl. Fogászat, Kardiológia). |
| **selectedStaffId** | `number \| null` | A kiválasztott szakember egyedi azonosítója. |
| **selectedConsultationId** | `number \| null` | A kiválasztott kezelés/konzultáció azonosítója. |
| **weekDays** | `Date[]` | Az aktuálisan megjelenített munkahét napjait (H-P) tartalmazó tömb. |
| **isLoading** | `boolean` | API hívások alatt megjelenő várakozási állapot jelzője. |

#### III.2. Konstruktor és Injektált szolgáltatások

A komponens a modern Angular `inject()` függvényét használja a függőségek kezelésére:
* **bookingApi**: Időpontok lekérése és foglalások létrehozása.
* **staffApi**: Szakember és kezelés adatok elérése.
* **route / router**: URL paraméterek figyelése és navigáció kezelése.
* **auth**: Felhasználói azonosító (ID) és bejelentkezési állapot ellenőrzése.
* **translate**: Dinamikus többnyelvűség kezelése (HU/EN).
* **destroyRef**: Feliratkozások automatikus lezárása (memóriaszivárgás ellen).

#### III.3. Főbb Metódusok

**Naptár és Időkezelés:**
* **generateWeek(refDate)**: Kiszámítja az aktuális vagy választott hét napjait, hétfőtől kezdődően.
* **changeWeek(days)**: Lehetővé teszi a naptárban való lapozást (előző/következő hét).
* **getSlotsForHour(day, hour)**: Segédfüggvény a naptárnézet rendereléséhez: az adott nap és óra metszetébe tartozó szabad slotokat adja vissza.

**Adatlekérés és Szűrés:**
* **loadInitialData()**: Az oldal betöltésekor párhuzamosan (`forkJoin`) kéri le a szakembereket és szolgáltatásokat.
* **syncSelectionFromParams()**: URL paraméterek alapján (pl. orvosi profilról érkezve) automatikusan beállítja a szűrőket.
* **updateFilteredConsultations()**: Dinamikusan lekéri az adott szakember által nyújtott specifikus kezeléseket.
* **loadSlots()**: Lekéri a szabad időpontokat, kiszűrve a múltbeli vagy már nem foglalható sávokat.

**Foglalási folyamat:**
* **onReserve(slot)**: Elindítja a foglalást egy megerősítő kérdéssel (SweetAlert2), megjelenítve a pontos időpontot a felhasználó nyelvén.
* **executeBooking(slot)**: A foglalás tényleges végrehajtása. Ellenőrzi a bejelentkezést, összeállítja a foglalási objektumot (ár, időtartam, státusz), és sikeres válasz után frissíti a felületet.

---

### IV. Osztályszintű struktúra: LoginComponent

Ez a komponens felelős a felhasználók hitelesítéséért, a munkamenet (session) inicializálásáért és a jogosultság-alapú átirányításért.

#### IV.1. Osztályváltozók (Properties)

| Változó neve | Típus | Leírás |
| :--- | :--- | :--- |
| **loginForm** | `FormGroup` | Erősen típusos (`nonNullable`) reaktív űrlap. Tartalmazza az email (required, email) és a jelszó (required, minLength: 6) mezőket. |
| **isLoading** | `boolean` | Logikai változó, amely a folyamatban lévő HTTP kérést jelzi (spinner és gomb-tiltás vezérlése). |
| **errorMessage** | `string` | A hitelesítés során fellépő hibák (validációs vagy szerveroldali) szöveges tárolója. |
| **f** | `Getter` | Rövidített hozzáférés az űrlap kontrolljaihoz a HTML sablonban történő hibaellenőrzéshez. |

#### IV.2. Konstruktor és Injektált szolgáltatások

A komponens modern `inject()` alapú függőségkezelést alkalmaz:
* **fb (FormBuilder)**: A reaktív űrlapstruktúra deklaratív felépítéséhez.
* **auth (AuthService)**: A bejelentkezési API hívás végrehajtásához és a tokenkezeléshez.
* **router / route**: A navigációhoz és az URL paraméterek (pl. `returnUrl`, `staffId`) kinyeréséhez.
* **translate**: A többnyelvű tartalom és a fordítókulcsok kezeléséhez.

#### IV.3. Főbb Metódusok

* **login()**: 
    - Ellenőrzi az űrlap érvényességét; hiba esetén a `markAllAsTouched()` hívással aktiválja a vizuális hibaüzeneteket és figyelmeztetést dob.
    - Összeállítja a `loginPayload`-ot, kiegészítve az aktuálisan használt nyelv kódjával.
    - **Sikeres belépés**: A válaszban kapott JWT tokent és a felhasználói objektumot a `localStorage`-ba menti.
    - **Dinamikus átirányítás**: Vizsgálja a felhasználói szerepkört (`roleId`). Az adminok (1) és szakemberek (2) az adminisztrációs felületre, a páciensek a `returnUrl`-ben tárolt oldalra vagy az alapértelmezett foglalási felületre kerülnek.
* **Hibakezelés**: A szerveroldali hibaüzeneteket (pl. hibás jelszó) a `translate` szerviz segítségével fordítja le. Ha nincs specifikus fordítókulcs, általános hibaüzenetet jelenít meg a **SweetAlert2** felületén.
* **cleanupModal()**: Segédfüggvény, amely manuálisan takarítja ki a Bootstrap modális ablakok maradványait (backdrop, body-padding) a DOM-ból, megelőzve a felület lefagyását sikeres navigáció után.

#### IV.4. HTML Felépítés és Logika

* **Bootstrap 5 Design**: A felület egy középre igazított, árnyékolt kártyában (`card shadow-lg`) jelenik meg.
* **Reaktív Validáció**: Az input mezők az Angular `@if` struktúráját használják a hibaüzenetek feltételes megjelenítésére (pl. ha a mező üres vagy nem email formátumú).
* **Felhasználói Élmény (UX)**: 
    - Az űrlap beküldése alatt a gomb inaktívvá válik, és egy spinner jelzi a háttérfolyamatot.
    - Tartalmaz egy "Elfelejtett jelszó" hivatkozást és egy regisztrációra buzdító szekciót.
    - A beviteli mező

---

## 3.2.4. Szervizek (Services)

Az alkalmazás szerviz rétege egységes elvek alapján kommunikál a backenddel, biztosítva a biztonságot és a könnyű konfigurálhatóságot.

#### Biztonság és Hitelesítés (getAuthHeaders)
Minden olyan kérés, amely védett adatokhoz fér hozzá (pl. foglalás, profil módosítás, admin funkciók), tartalmazza az autentikációs fejlécet. 
* A hitelesítési fejlécet az **AuthService `getAuthHeaders()`** metódusa generálja. 
* Ez a metódus kiolvassa a `localStorage`-ból a bejelentkezéskor kapott JWT tokent, és beállítja a `Authorization: Bearer <token>` HTTP fejlécet. 
* Ezt a logikát minden szerviz (Staff, Booking, stb.) meghívja a saját HTTP kérései előtt, így garantálva, hogy a szerver azonosítani tudja a kérést indító felhasználót.

#### Környezeti függőség (apiUrl)
Az alkalmazás nem tartalmaz égetett (hardcoded) URL címeket. 
* Minden API hívás az **`environment.ts`** fájlban tárolt `apiUrl` változóra hivatkozik. 
* Ez lehetővé teszi, hogy a fejlesztői környezet (localhost) és az éles szerver címe között a kód módosítása nélkül, csupán konfigurációváltással lehessen váltani.

---

#### 1. AuthService (`src/app/services/auth`)
* **Cél:** A felhasználók hitelesítése, jogosultságkezelés és a biztonsági token (JWT) menedzselése.
* **Végpontok:** `/auth/login`, `/auth/register`.
* **Típus:** `Observable<AuthResponse>`.

**Főbb funkciók:**
* `getAuthHeaders()`: Kiolvassa a tokent a `localStorage`-ból és összeállítja a Bearer típusú Authorization fejlécet.
* `login(credentials)`: Hitelesíti a felhasználót és elmenti a kapott tokent.
* `logout()`: Törli a munkamenet adatait és a tárolt tokent.
* `isAdmin()`: A token vagy a felhasználói objektum alapján logikai értékkel jelzi az adminisztrátori jogosultságot.
* `isAuthenticated()`: Ellenőrzi a bejelentkezési állapotot.

---

#### 2. StaffService (`src/app/services/staff`)
* **Cél:** A szakemberek adatbázisának kezelése, a profilok karbantartása és a hozzájuk rendelhető szolgáltatások (kezelések) menedzselése.
* **Végpontok:** `/staff`, `/consultations`, `/staff/treatments/:id`.
* **Típus:** `Observable<Staff[]>`, `Observable<Consultation[]>`.

**CRUD és Adminisztratív műveletek:**
* **Create (`createStaff`)**: Új szakember profil létrehozása a rendszerben (Adminisztrátori jogosultsággal).
* **Read (`getStaff`, `getStaffById`)**: Szakemberek publikus adatainak (név, specializáció, kép) listázása vagy egy konkrét adatlap lekérése.
* **Update (`updateStaffProfile`)**: A szakember saját adatainak, önéletrajzának vagy szakterületének módosítása.
* **Archive (`archiveStaff`)**: Szakember státuszának inaktívra állítása (logikai törlés), amely megőrzi a korábbi foglalási adatokat a statisztikákhoz.

**Szolgáltatáskezelés és Szűrés (Filter/Toggle):**
* **Konzultációk listázása (`getConsultations`)**: Az elérhető kezeléstípusok, árak és időtartamok lekérése.
* **Szakember-specifikus kezelések (`getTreatmentsForStaff`)**: Lekéri azokat a szolgáltatásokat, amelyeket az adott szakember elvégezhet.
* **Service Toggle (`assignConsultationToStaff`)**: Dinamikusan ki- és bekapcsolhatóvá teszi, hogy egy szakember mely vizsgálatokat végezheti.
* **Dinamikus szűrés**: Lehetővé teszi a szakemberek listázását szakterület (pl. fogászat) vagy státusz (csak aktív orvosok) alapján.

---

#### 3. AdminService (`src/app/services/admin`)
* **Cél:** Magas szintű rendszeradminisztrációs műveletek elvégzése (felhasználókezelés, globális statisztikák).
* **Végpontok:** `/users`, `/admin/stats`, `/bookings/all`.
* **Típus:** `Observable<any>`, `Observable<User[]>`.

**Főbb funkciók:**
* `getDashboardStats()`: Aggregált adatokat kér le a Dashboard grafikonjaihoz (bevétel, kihasználtság).
* `getAllUsers()`: Listázza a rendszer összes felhasználóját adminisztratív módosítás céljából.
* `updateUserStatus(id, status)`: Felhasználók aktiválása vagy felfüggesztése.
* `promoteUser(userId, data)`: Felhasználó előléptetése szakemberré.

---

#### 4. BookingService (`src/app/services/booking`)
* **Cél:** Az időpontfoglalási folyamat koordinálása és a szabad idősávok kezelése.
* **Végpontok:** `/bookings`, `/slots/available`.
* **Típus:** `Observable<Booking>`, `Observable<Slot[]>`.

**Főbb funkciók:**
* `getAvailableSlots(staffId, start, end)`: Lekéri a megadott időszakra vonatkozó szabad időpontokat egy adott szakemberhez.
* `createBooking(bookingData)`: Új foglalást hoz létre a rendszerben.
* `getUserBookings(userId)`: Listázza a bejelentkezett páciens saját korábbi és jövőbeli foglalásait.

---

#### 5. ConsultationService (`src/app/services/consultation`)
* **Cél:** A szolgáltatási katalógus (kezelések, vizsgálatok) központi kezelése és a szolgáltatások paramétereinek karbantartása.
* **Végpontok:** `/consultations`, `/consultations/:id`.
* **Típus:** `Observable<Consultation[]>`.

**CRUD műveletek:**
* **Create (`addConsultation`)**: Új szolgáltatástípus rögzítése a rendszerben (megadva a nevet, az alapértelmezett árat és az időtartamot).
* **Read (`getAllConsultations`, `getConsultationById`)**: A teljes szolgáltatási paletta listázása vagy egy specifikus kezelés részletes adatainak lekérése.
* **Update (`updateConsultation`)**: Meglévő szolgáltatás adatainak (pl. árazás módosítása, leírás frissítése) karbantartása.
* **Archive (`archiveConsultation`)**: Egy szolgáltatás kivezetése a kínálatból; a kezelés megmarad az adatbázisban a statisztikák miatt, de a jövőben már nem foglalható.

**Szűrési és Foglalási logika:**
* **Dinamikus szakember-szűrés**: Biztosítja, hogy a páciens oldali foglalásnál csak azok a konzultációk jelenjenek meg, amelyeket a kiválasztott szakember ténylegesen elvállalt.
* **Időtartam szerinti szűrés**: Lehetővé teszi a kezelések csoportosítását hosszuk (pl. 30, 60 perc) alapján, ami kritikus fontosságú a naptár-generáló algoritmus (Slot generation) pontos működéséhez és az üres idősávok optimális kitöltéséhez.

### 3.2.5. Útvonalfigyelők (Guards)

Az Angular útvonalfigyelők (Guards) feladata a navigáció ellenőrzése és a védett tartalomhoz való hozzáférés korlátozása. Az alkalmazás két fő típusú figyelőt használ a biztonság fenntartása érdekében.

---

#### 1. AdminGuard (`src/app/guards/admin.guard.ts`)
**Cél:** Az adminisztrátori jogosultságot igénylő útvonalak (pl. `/admin/**`, `/users`) védelme.

**Működési mechanizmus:**
* **Token ellenőrzés:** Lekéri a `localStorage`-ból az `authToken` értékét.
* **Jogosultság vizsgálat:** Ellenőrzi a token tartalmát és a felhasználói objektum `isAdmin` mezőjét (vagy `roleId`-ját).
* **Érvényesség:** Vizsgálja a token lejáratát is.
* **Navigáció:** * Amennyiben a felhasználó admin, a belépést engedélyezi.
    * Hiányzó, hibás formátumú vagy nem admin jogosultságú token esetén a rendszer automatikusan átirányít a `/login` oldalra.

---

#### 2. AuthGuard (`src/app/guards/auth.guard.ts`)
**Cél:** Az általános hitelesítéshez kötött útvonalak védelme (pl. `/passwordchange`, `/booking`, `/dashboard`).

**Működési mechanizmus:**
* **Belépési szűrő:** Megakadályozza az illetéktelen hozzáférést a belső funkciókhoz olyan felhasználók számára, akik nincsenek bejelentkezve.
* **Státusz ellenőrzés:** A hitelességen felül ellenőrzi, hogy a felhasználó fiókja nincs-e letiltott állapotban.
* **Token validáció:** Ellenőrzi az `authToken` meglétét, formátumát és érvényességi idejét.
* **Navigáció:** Amennyiben a hitelesítés sikertelen, vagy a munkamenet lejárt, a felhasználót a `/login` oldalra kényszeríti.

---

#### Összegzés a működésről
Az útvonalfigyelők az Angular `CanActivate` interfészét valósítják meg. Fontos megjegyezni, hogy bár a Guards réteg megállítja az illetéktelen navigációt a frontenden, a valódi biztonságot a backend szerver biztosítja, amely minden egyes API hívásnál (az AuthService által küldött fejléc alapján) újra ellenőrzi a jogosultságokat.

### 3.2.6. Továbbfejlesztési lehetőségek

Az alkalmazás jelenlegi verziója stabil alapot nyújt a szakemberek és páciensek közötti foglalások kezeléséhez, azonban a hosszú távú skálázhatóság és a felhasználói élmény fokozása érdekében az alábbi fejlesztési irányok jelölik a továbblépést:

#### 1. Dashboard és Adatvizualizáció
* **Prediktív analitika:** A múltbeli foglalási adatok alapján előrejelezhetővé válna a várható forgalom, segítve a szakemberek beosztásának optimalizálását.
* **Valós idejű frissítés (WebSockets):** A foglalások és státuszmódosítások azonnali, oldalfrissítés nélküli megjelenítése az adminisztrációs felületen a hatékonyabb munkaszervezés érdekében.
* **Bővített exportálási opciók:** A statisztikák PDF formátum melletti Excel (.xlsx) vagy CSV exportálása a mélyebb üzleti elemzések támogatásához.

#### 2. Foglalási rendszer és Naptárkezelés
* **Várólista funkció:** Automatizált értesítési rendszer bevezetése, amely lemondás esetén azonnal tájékoztatja a várólistán szereplő pácienseket a felszabadult időpontról.
* **Külső naptár szinkronizáció:** Google Calendar és Microsoft Outlook integráció, hogy a szakemberek saját privát naptárukban is követhessék munkahelyi beosztásukat.
* **Ismétlődő foglalások kezelése:** Olyan kezelési sorozatok támogatása, amelyek több alkalomból állnak (pl. terápia vagy kontrollvizsgálatok), egyetlen foglalási folyamaton belül.

#### 3. Automatizált Értesítések
* **Push-értesítések:** Web-push technológia alkalmazása a böngészőn keresztüli emlékeztetők küldéséhez a foglalás előtt 24 órával.
* **SMS-integráció:** Kritikus emlékeztetők küldése SMS-ben, amely bizonyítottan csökkenti a meg nem jelenések (no-show) arányát.

#### 4. Integrált Fizetési Megoldások
* **Online bankkártyás fizetés:** Stripe vagy PayPal integráció, amely lehetővé tenné a konzultációs díj előre történő kifizetését vagy foglalási díj zárolását, növelve a páciensek elköteleződését és biztosítva a szolgáltató bevételét.

### 3.2.7. Fejlesztői dokumentáció és architektúra-irányelvek

A szoftver hosszú távú karbantarthatósága és a fejlesztési folyamat átláthatósága érdekében a projekt forráskódjának gyökérkönyvtárában elhelyezésre került egy dedikált technikai dokumentáció: **`frontend_dev.md`**.

Ez a dokumentum szolgál alapul a rendszer továbbfejlesztéséhez, és az alábbi kritikus információkat tartalmazza a fejlesztők számára:

* **Részletes Tech Stack:** Az alkalmazott Angular 18+ technológiák, Signal-alapú állapotkezelés és külső könyvtárak (SweetAlert2, jsPDF, ngx-translate) listája.
* **Környezeti konfigurációk:** Az `environment.ts` fájlok felépítése és a központosított API végpont-kezelés szabályai.
* **Szerepkör-alapú hozzáférés (RBAC):** A numerikus Role ID-k (0: User, 1: Staff, 2: Admin) és a hozzájuk tartozó jogosultságok részletezése.
* **HTTP Interceptor logika:** A Bearer tokenek automatikus injektálása, a nyelvi szinkronizáció és a globális 401-es hiba kezelésének technikai leírása.
* **Kódolási szabványok:** Előírások az angol nyelvű üzleti logikára, a privát változók elnevezésére és a RxJS operátorok használatára vonatkozóan.
* **Projektstruktúra:** A könyvtárszerkezet (`/services`, `/components`, `/environments`) pontos térképe.

A dokumentáció hivatkozott fájlja közvetlenül elérhető a projekt GitHub repozitóriumában vagy a mellékelt forráskód-könyvtár gyökerében.


Továbbfejlesztési lehetőségek hosszútávra (Frontend tervek)

Az alkalmazás jelenlegi architektúrája stabil alapot biztosít a jövőbeli bővítésekhez. A rendszer továbbfejlesztése során a felhasználói élmény (UX) fokozása és az adatbiztonság további növelése élvez prioritást, szoros összhangban a szerveroldali fejlesztésekkel.

#### 1. Integrált fizetési folyamat (Checkout Experience)
A backend oldali fizetési gateway (Stripe/Barion) integrációjával párhuzamosan a frontend egy dedikált **fizetési munkafolyamattal** bővülne.
* **Kliensoldali logika:** Egy többlépcsős foglalási folyamat implementálása, ahol a páciens az időpont kiválasztása után azonnali, biztonságos fizetési felületre navigálna.
* **UX cél:** A sikeres tranzakció utáni automatikus visszaigazoló nézetek és digitális számlaletöltési funkciók biztosítása.

#### 2. Valós idejű értesítési központ (WebSocket Integration)
A WebSocket technológia kliensoldali implementálásával az alkalmazás képes lenne **aszinkron események** azonnali kezelésére.
* **UI megoldás:** Egy értesítési panel (Notification Bell) és "Toast" üzenetek bevezetése, amelyek azonnal tájékoztatják a felhasználót (pl. adminisztrátort az új foglalásról, orvost a lemondásról) az oldal frissítése nélkül.
* **Reactive State:** Az RxJS folyamatok kiterjesztése a Socket stream-ek fogadására, biztosítva a naptárnézet valós idejű frissülését.

#### 3. Granuláris jogosultságkezelés és Dinamikus menürendszer (RBAC)
A finomhangolt jogosultságkezelés (RBAC) a frontenden a **szerkezet dinamikus alkalmazkodását** jelenti.
* **Dinamikus nézetek:** A navigációs menü és az egyes akciógombok (módosítás, törlés) láthatósága a Guard-okon keresztül, a felhasználó specifikus jogosultsági szintjéhez igazodna (pl. a recepciós csak olvasási, az admin teljes körű jogot kapna).
* **Biztonság:** Egyedi Angular direktívák alkalmazása az elemek DOM-szintű elrejtéséhez a jogosultságok alapján.

#### 4. Interaktív Adatvizualizáció és Üzleti Intelligencia
A Dashboard jelenlegi statisztikai modulját komplexebb **adatvizualizációs könyvtárakkal (pl. Chart.js vagy D3.js)** tervelem bővíteni.
* **Analitikai funkciók:** Szűrhető, idővonalas grafikonok a klinika forgalmáról, interaktív hőtérképek a szakemberek leterheltségéről és exportálható CSV/Excel riportok generálása.
* **Vezetői nézet:** Kifejezetten a pénzügyi döntéshozók számára optimalizált, egyszerűsített "Executive Dashboard" nézet kialakítása.

#### 5. Megemelt szintű biztonsági réteg (MFA/2FA UI)
Az egészségügyi adatok védelme érdekében a bejelentkezési folyamat kiegészülne egy **kétfaktoros hitelesítési felülettel**.
* **Frontend folyamat:** Egy biztonsági kód bekérő nézet és QR-kód alapú authentikátor regisztrációs felület fejlesztése.
* **Munkamenet biztonság:** Rövidebb lejáratú JWT tokenek és automatikus "Inactivity Timeout" (időtúllépés miatti kijelentkeztetés) kezelése a felhasználó adatainak védelmében.

#### 6. Mobil-orientált Páciens Alkalmazás (PWA)
Hosszú távú cél az alkalmazás **Progressive Web App (PWA)** technológiával való felruházása.
* **Előnyök:** Ez lehetővé tenné az offline működést (bizonyos korlátok között), a natív alkalmazásokhoz hasonló sebességet, valamint a páciensek telefonjára küldött natív Push értesítéseket, tovább növelve az elköteleződést és a szolgáltatás színvonalát.
### 3.2.6. Továbbfejlesztési lehetőségek (Frontend tervek)

Az alkalmazás jelenlegi architektúrája stabil alapot biztosít a jövőbeli bővítésekhez. A rendszer továbbfejlesztése során a felhasználói élmény (UX) fokozása, a valós idejű adatszinkronizáció és az adatbiztonság növelése élvez prioritást.
