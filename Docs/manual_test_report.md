# Manuális Tesztelési Jegyzőkönyv - ElitPort Rendszer

## 1. Teszt Információk
| Megnevezés | Érték / Leírás |
| :--- | :--- |
| **Teszt ID:** | P_01 - P_16 |
| **Készítő:** | Nagy Etelka |
| **Típus:** | Manuális End-to-End (E2E) UI/UX Tesztelés |
| **Teszt leírása:** | A felhasználói felület (Frontend) és az üzleti logika (Backend) együttes működésének vizsgálata kritikus folyamatokon keresztül. |
| **Átnézte:** | [Konzulens/Józsa Béla] |
| **Tesztelő neve:** | Nagy Etelka |
| **Tesztelés dátuma:** | 2024. 04. 13-16. |
| **Teszt státuszok:** | pass, fail (Javítás után: FIXED) |
| **Követelmény:** | A rendszernek stabilan, reszponzívan és az üzleti specifikációknak megfelelően kell működnie. |

---

## 2. Részletes Teszt Folyamatok - teszt esetekkel 

### P_01.1: Regisztrációs folyamat (Register Process)

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_01.1** | **Sikeres regisztráció** | Név: "Teszt Elek"<br>Email: teszt@email.com<br>Pw: "Abc12345!"<br>Confirm: "Abc12345!" | Az `onSubmit()` lefut, a `Swal.fire` sikert jelez. OK után átirányítás `/booking` vagy `/admin/staff` oldalra a `roleId` függvényében. | A regisztráció lezajlott, a popup megjelent, az átirányítás sikeres. | **pass** |
| **P_01.2** | **Jelszó egyezés hiba (Mismatch)** | Pw: "Jelszo123"<br>Confirm: "MasJelszo" | A `createCompareValidator` detektálja az eltérést, a `confirmPassword` mező megkapja a `mismatch: true` hibát. A form `invalid` (Error Sweetalert). | A `confirmPassword` mező pirossal jelez, a kérés nem indul el. | **pass** |
| **P_01.3** | **Validációs korlátok (MinLength)** | Email: "test@email.com"<br>Pw: "Abc12345!" | A `Validators.minLength` és `Validators.email` hibát jelez. Az `onSubmit` során a `markAllAsTouched()` érvényesül. | A SweetAlert hibaablak megjelent. A mezők alatt megjelennek a hibaüzenetek, a gomb nem küldi be az adatokat. Bejelentkezési gomb szürke | **pass** |
| **P_01.4** | **Foglalt email (Szerver hiba)** | Már létező email cím | Az API `400` vagy `409` hibát ad vissza. Az `error` ág lefut, a `Swal.fire` megjeleníti a szerver hibaüzenetét. | A hibaüzenet (pl. "Email already exists") megjelent a felületen. | **pass** |
| **P_01.5** | **Loading állapot jelzése** | Kattintás a regisztrációra | A `this.isLoading` értéke `true`-ra vált, a felületen a spinner aktívvá válik a kérés befejezéséig. | A felhasználó vizuális visszajelzést kap a folyamatban lévő műveletről. | **pass** |

## P_01.2 Fiókaktiválás

Ez a folyamat a felhasználói fiók létrehozását és az email-alapú hitelesítést (aktiválást) fedi le.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_01.6** | **Regisztrációs űrlap küldése** | Név, Email, Jelszó | Valid adatok esetén a rendszer létrehozza a fiókot "inaktív" státusszal, és kiküldi az aktiváló emailt. | A backend rögzítette az adatokat, a sikeres regisztráció üzenet megjelent. | **pass** |
| **P_01.7** | **Kliensoldali validáció** | Hibás email formátum | Az "Aktiválás" gomb inaktív marad, vagy hibaüzenet jelenik meg a mező alatt. | A form-validátorok megakadályozták a hibás adatok elküldését. | **pass** |
| **P_01.8** | **Duplikált regisztráció** | Már létező email cím | A rendszer hibaüzenetet dob (pl. "Email already exists"), nem jön létre új rekord. | A SweetAlert hibaablak megjelent a szerver válasza alapján. | **pass** |
| **P_01.9** | **Token kinyerése az URL-ből** | `token` paraméter | Az aktiváló linkre kattintva a rendszer kiolvassa a tokent az URL-ből a `route.snapshot` segítségével. | A komponens sikeresen azonosította a tokent az inicializáláskor. | **pass** |
| **P_01.10** | **Email megerősítés (Verify)** | Valid aktivációs token | A rendszer elküldi a tokent a backendnek. Sikeres válasz esetén a felhasználó státusza "aktívra" változik. | A `sendVerificationToken` hívás után a `success` állapot true-ra váltott. | **pass** |
| **P_01.11** | **Hibás/Lejárt token kezelése** | Érvénytelen token | Ha a token lejárt vagy módosították, az API hibaágra fut, és a felület jelzi a sikertelen aktiválást. | A rendszer nem aktiválta a fiókot, a hibaüzenet megjelent a felületen. | **pass** |

---

## P_02: Bejelentkezési folyamat, Hitelesítés és Munkamenet-kezelés

Ez a szakasz a felhasználók azonosítását, a szerepkör-alapú átirányítást, a biztonsági token-kezelést és a UI-tisztítási folyamatokat ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_02.1** | **Sikeres login (Páciens)** | Valid páciens adatok | A rendszer elmenti a JWT tokent és a felhasználót a LocalStorage-ba. Alapértelmezett átirányítás a `/booking` oldalra. | A `saveUserData` lefutott, a munkamenet létrejött, a navigáció sikeres. | **pass** |
| **P_02.2** | **Sikeres login (Admin)** | Email: admin@ep.com (roleId: 2) | A rendszer felismeri a privilegizált szerepkört, és automatikusan az `/admin/staff` vagy `/admin/dashboard` oldalra navigál. | A `roleId` alapján a rendszer a megfelelő adminisztrációs felületre irányított. | **pass** |
| **P_02.3** | **Login validációs hiba** | Rossz formátum / rövid jelszó | A `loginForm.invalid` miatt a rendszer nem küld API kérést. A mezők piros jelzést kapnak, `Swal` figyelmeztetés jelenik meg. | A kliensoldali validáció megakadályozta a felesleges hálózati forgalmat. | **pass** |
| **P_02.4** | **Szerveroldali hiba kezelése** | Helyes formátum, rossz jelszó | Az API hibaüzenetére a rendszer a `serverKey` alapján lefordított, barátságos hibaüzenetet mutat a felhasználónak. | A `translate.instant` a szerver hibaüzenetét sikeresen magyarította a felugró ablakban. | **pass** |
| **P_02.5** | **Átirányítás célzott URL-re** | `returnUrl` query paraméter | Bejelentkezés után a rendszer nem az alapértelmezett oldalra, hanem a `returnUrl`-ben tárolt címre (pl. `/profile`) navigál. | Az átirányítási logika sikeresen kezelte a `snapshot.queryParams` értékét. | **pass** |
| **P_02.6** | **Modal és DOM tisztítás** | Belépés Modal ablakon át | Sikeres belépéskor a `cleanupModal()` eltávolítja a `modal-backdrop`-ot, így az UI nem akad be és a görgetés aktív marad. | A háttér-overlay eltűnt, a body osztályai frissültek, a felület tiszta maradt. | **pass** |
| **P_02.7** | **Munkamenet perzisztencia** | Oldalfrissítés (F5) | A `loadStorage` a `isPlatformBrowser` ellenőrzés után visszaépíti a Signal-okat a LocalStorage-ból. | A felhasználó bejelentkezve maradt, a Signal-ok (név, role) frissültek. | **pass** |
| **P_02.8** | **Kijelentkezés és biztonság** | Logout esemény | A `localStorage.clear()` lefut, a Signal-ok alaphelyzetbe állnak, a rendszer a login oldalra navigál. | A munkamenet lezárult, a Guard-ok blokkolják a későbbi jogosulatlan hozzáférést. | **pass** |

---

## P_03 Jelszókezelés és Helyreállítás 

### P_03.1: Helyreállító email kérése (Forgot Password)

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_03.1.1** | **Helyreállító email kérése** | Email: létező@email.hu | A rendszer elküldi az emailt a választott nyelven. Az `isError` hamis, a sikerüzenet megjelenik a felületen. | Az `authService.forgotPassword` lefutott, a `message` megkapta a sikerüzenetet. | **pass** |
| **P_03.1.2** | **Nem létező email cím** | Email: nincsilyen@email.hu | A backend hibaüzenetet küld (pl. "USER_NOT_FOUND"). A rendszer lefordítja a kulcsot és piros jelzéssel mutatja. | Az `isError` értéke `true` lett, a hibaüzenet megjelent. | **pass** |
| **P_03.1.3** | **Loading állapot kezelése** | Kattintás a küldésre | A `this.isLoading` érték `true` lesz, a gomb inaktívvá válik a hálózati kérés ideje alatt. | Megakadályozza a többszörös beküldést és jelzi a folyamatot a felhasználónak. | **pass** |
| **P_03.1.4** | **Nyelvspecifikus kiküldés** | Aktuális nyelv: 'en' | A kérés tartalmazza a `lang: 'en'` paramétert, így a felhasználó angol nyelvű jelszó-helyreállító levelet kap. | A payload-ban a `lang` paraméter helyesen ment ki. | **pass** |

### P_03.2: Jelszó felülírása (Password Reset Completion)

| **P_03.2.1** | **Sikeres jelszó módosítás** | Új jelszó + Token | A kérés sikeres, a rendszer navigál a `/login` oldalra, a hivatkozásba befűzi a `resetSuccess=true` paramétert. | Az átirányítás megtörtént, a login oldalon a sikerüzenet látható. | **pass** |
| **P_03.2.2** | **Érvénytelen vagy lejárt token** | Lejárt/módosított token | A szerver hibaüzenetet küld. Az `error` ág lefut, a `translate` lefordítja a hibaüzenetet a felületre. | A felhasználó értesül a hibáról, nem történik átirányítás. | **pass** |
| **P_03.2.3** | **Űrlap validáció (Frontend)** | Üres mezők vagy eltérő jelszavak | Az `onSubmit` ág a `markAllAsTouched()`-ra fut, nem indul el hálózati kérés. | A hibaüzenetek megjelentek a beviteli mezők alatt. | **pass** |
| **P_03.2.4** | **Manuális visszalépés** | `goToLogin()` hívása | A felhasználó meggondolja magát és a bejelentkezéshez navigál mentés nélkül. | A router hiba nélkül a `/login` útvonalra navigált. | **pass** |

---

## P_04. Adminisztrációs funkciók és Felhasználókezelés

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_04.1** | **Felhasználói lista betöltése** | Automatikus (OnInit) | Az `adminService` lekéri az összes felhasználót. A rendszer szétválasztja a Staff és sima User státuszokat, és beállítja a `roleId`-t. | A lista betöltődött, a `staffProfile` alapján a szakemberek helyesen megkülönböztetve. | **pass** |
| **P_04.2** | **Státusz módosítása (Toggle)** | Felhasználó ID + `newStatus` | A gombra kattintva a `user.isActive` megváltozik. Sikeres mentés után egy "Toast" üzenet jelenik meg a jobb felső sarokban. | A LocalStorage és a DB frissült, a Toast megjelent. | **pass** |
| **P_04.3** | **Adminisztrátori jelszó-reset** | Új jelszó (min. 6 kar.) | Az admin új jelszót adhat meg egy usernek. A `Swal` input validátora nem engedi a 6 karakternél rövidebb bevitelt. | A validáció blokkolta a rövid jelszót, a mentés sikeres volt. | **pass** |
| **P_04.4** | **Előléptetés Szakemberré** | Specialty: pl. "Kardiológus" | A sima felhasználó szakemberré válik. A sikeres mentés után a `loadUsers()` újra lefut a frissített adatokért. | A felhasználó megkapta a `STAFF` szerepkört és a szakterületet. | **pass** |
| **P_04.5** | **Felhasználói adatok szerkesztése** | Név, Email, Role, Specialty | A `Swal` HTML formjában megadott új adatok elküldésre kerülnek. Kötelező mezők hiánya esetén `ValidationMessage` jelenik meg. | Az adatok frissültek, az űrlap validációja megfelelően működött. | **pass** |
| **P_04.6** | **Felhasználó archiválása** | Felhasználó ID | Egy megerősítő kérdés (Warning) után a felhasználó archiválásra kerül. Sikertelen törlés esetén 404-es vagy egyéb hibaüzenet látszik. | Az archiválás lezajlott, a törölt user eltűnt a listából. | **pass** |
| **P_04.7** | **Hiba kezelése betöltéskor** | API hiba szimuláció | Ha a szerver nem elérhető, a `loadUsers()` error ága lefut és egy SweetAlert hibaüzenetet mutat. | A felület nem fagyott le, a felhasználó tájékoztatást kapott. | **pass** |

---

## P_05. Foglalások kezelése - Adminisztrátori nézet

Ez a szakasz a rendszerben lévő foglalások listázását, az adminisztrátori felülbírálatokat és az adatok konzisztenciáját ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_05.1** | **Foglalások listázása és rendezése** | Automatikus lekérés (OnInit) | Az `adminService` visszaadja a foglalásokat. A rendszer kliensoldalon időrendi sorrendbe rendezi őket (`date` + `startTime`). | A lista megjelent, a rendezésért felelős `sort()` metódus helyesen sorrendbe tette az elemeket. | **pass** |
| **P_05.2** | **Delegált foglalás azonosítása** | `patientId` vs `createdBy.id` | Ha a foglalást nem a páciens, hanem egy admin hozta létre, az `isDelegated` flag `true` lesz. | A rendszer sikeresen megkülönbözteti a manuálisan felvitt és a páciens által indított foglalásokat. | **pass** |
| **P_05.3** | **Foglalás törlése (Admin)** | `bookingId` | Megerősítő kérdés után a törlés lefut. A Signal `update()` metódusa azonnal, újratöltés nélkül kiveszi az elemet a listából. | Az elem eltűnt a táblázatból, a siker-Toast (SweetAlert2) megjelent. | **pass** |
| **P_05.4** | **Múltbéli időpontok detektálása** | `isPast()` metódus | A rendszer összehasonlítja az aktuális időt a foglalás idejével, és logikai értéket ad vissza a validációhoz. | A múltbéli időpontok helyesen kerülnek azonosításra a naptárban. | **pass** |
| **P_05.5** | **Hiba kezelése betöltéskor/törléskor** | API hiba (pl. 403 Forbidden) | Hálózati vagy jogosultsági hiba esetén a rendszer lefordított hibaüzenetet mutat `Swal.fire` segítségével. | A `this.errorMessage` beállítása és a hiba-popup megjelenítése sikeres. | **pass** |
| **P_05.6** | **Loading állapot visszajelzése** | `isLoading` Signal | A kérés indításakor a `isLoading` értéke `true`, befejezésekor `false` lesz, vezérelve a felületi pörgőt (spinner). | A felhasználó látható visszajelzést kap az adatlekérdezés folyamatáról. | **pass** |
| **P_05.7** | **Páciens ütközésvizsgálat (Conflict Check)** | `targetPatientId`, `date`, `startTime` | A rendszer megakadályozza, hogy ugyanaz a páciens két különböző orvoshoz is foglaljon ugyanarra az időpontra. | A backend `BOOKING.CONFLICT` hibát ad vissza, amit a frontend megfelelően kijelez. | **pass** |
| **P_05.8** | **Adminisztrátori 24h felülbírálás** | `id`, `now()` | Míg a páciensnek tilos a lemondás 24 órán belül, az adminisztrátor bármikor jogosult törölni vagy módosítani a foglalást. | Az adminisztrátor sikeresen törölte a közeli időpontot is, a rendszer nem dobott 403-as hibát. | **pass** |
| **P_05.9** | **Státuszkonzisztencia és Slot felszabadítás** | `status` frissítése | Lemondáskor a foglalás státusza `cancelled` lesz, a kapcsolódó slot pedig automatikusan újra `isAvailable: true` állapotba kerül. | Az adatbázis-tranzakció sikeres: a státusz frissült, a slot pedig azonnal újra foglalhatóvá vált. | **pass** |
| **P_05.10** | **Adminisztrátori kényszerített törlés (Force Delete)** | `bookingId`, `force=true` query param | Az adminisztrátor képes véglegesen (Hard Delete) eltávolítani egy foglalást a rendszerből tesztelési vagy karbantartási célból. | A rekord véglegesen törlődött az adatbázisból, a `destroy` metódus hiba nélkül lefutott. | **pass** |

---

## P_06. Adminisztrációs Vezérlőpult és Üzleti Analitika

Ez a szakasz a vezetői információs rendszer (Dashboard) pontosságát, az adatok összesítését (KPI) és a riportálási funkciókat ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_06.1** | **Összesített KPI kalkuláció** | Bookings, Consultations adatok | A rendszer kiszámítja a teljes bevételt (lemondott foglalások nélkül) és a százalékos lemondási arányt. | A `totalRevenue` és `cancellationRate` számítása a valid adatok alapján pontos. | **pass** |
| **P_06.2** | **Szakember hatékonyság (Utilization)** | Foglalások száma / Kapacitás (40) | A rendszer kiszámítja a szakemberek százalékos kihasználtságát. 100% feletti értéket a logika limitál. | A `staffEfficiency` lista a legmagasabb kihasználtság szerint rendezve jelenik meg. | **pass** |
| **P_06.3** | **Heti terheltségi hőtérkép (Heatmap)** | Foglalások időpontjai (nap/óra) | A rendszer 5 munkanapra és 12 idősávra bontva összesíti a foglalásokat a `generateHeatmap()` metódussal. | A `heatmapData` objektum helyesen épül fel, az idősávok színe a sűrűség függvényében változik. | **pass** |
| **P_06.4** | **PDF Riport generálása** | Aktuális heatmap adatok + Fordítások | A `exportToPDF()` hívásakor létrejön egy márkázott, táblázatos PDF. A fájlnév tartalmazza az aktuális időbélyeget. | A PDF letöltődik, a tartalma (lefordított napok, órák) konzisztens a felületi adatokkal. | **pass** |
| **P_06.5** | **Párhuzamos adatbetöltés** | `forkJoin` (Users, Bookings, Staff, stb.) | Minden adatforrásnak meg kell érkeznie a kalkulációk indítása előtt. A `finalize` blokk leállítja a loading állapotot. | Az `isLoading` jelző pontosan fedi a hálózati folyamatokat, hiba esetén a konzol naplózza az eseményt. | **pass** |
| **P_06.6** | **Nyelvspecifikus riportálás** | Aktuális nyelv: 'hu' vagy 'en' | A PDF export során a fejléc és a táblázat oszlopai a `translate.instant` segítségével a választott nyelven jelennek meg. | A generált dokumentum nyelve követi az alkalmazás aktuális beállítását. | **pass** |

---

## P_07 Szolgáltatások és Konzultációk kezelése 

Ez a szakasz a kínált szolgáltatások adminisztrációját, azok szakmai besorolását és a foglalási folyamatba való becsatlakozását vizsgálja.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_07.1** | **Szolgáltatások listázása és szűrése** | `selectedStaff.specialty` | A rendszer betölti az összes konzultációt. Ha van kijelölt szakember, csak az ő szakterületéhez (`specialty`) illő elemek jelennek meg. | Az `applyFilter()` metódus sikeresen szűri a listát, vagy alapértelmezetten mutat mindent. | **pass** |
| **P_07.2** | **Új szolgáltatás hozzáadása** | Valid név, specialty, ár, időtartam | Az `addMode` aktív, a form adatai elküldésre kerülnek (ID nélkül). Sikeres mentés után a lista frissül, a modal bezárul. | A `createConsultation` lefutott, a siker-popup megjelent, a form resetelődött. | **pass** |
| **P_07.3** | **Meglévő szolgáltatás szerkesztése** | `consultation` objektum | A `startEdit` feltölti a formot (`patchValue`), az `addMode` hamis lesz. Mentéskor az adatok az ID-val együtt frissülnek. | Az adatok megjelentek a modalban, a módosítás sikeresen mentésre került a DB-be. | **pass** |
| **P_07.4** | **Szolgáltatás törlése** | `consultation.id` | Figyelmeztető üzenet után a törlés lefut. Sikeres törlés után a lista automatikusan újratöltődik. | A megerősítő dialógus működik, a törlés után az elem eltűnik a listából. | **pass** |
| **P_07.5** | **Űrlap validáció** | Üres név, 0-nál kisebb ár/idő | A `Validators.required` és `min` szabályok blokkolják a mentést. A hibás mezők vizuális jelzést kapnak. | A `markAllAsTouched()` hatására a hibaüzenetek megjelennek, a kérés nem indul el. | **pass** |
| **P_07.6** | **Navigáció foglaláshoz** | `consultation.id` | A kiválasztott szolgáltatás után a rendszer átirányít a `/booking/:id` útvonalra a foglalás folytatásához. | A router sikeresen átadta az ID-t a foglalási komponensnek. | **pass** |

---

## P_08 Szakember-kezelés és Naptár-generálás

Ez a szakasz a gyógyászati személyzet adminisztrációját, a szolgáltatások szakemberekhez rendelését és az automatizált munkaidő-beosztás generálását ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_08.1** | **Szakember adat-transzformáció** | `res.data` (Backend JSON) | A rendszer az összetett objektumokból (`staffProfile`, `user`) egységesített listát készít. Hiányos adatok esetén "Unknown" fallback értéket alkalmaz. | A lista minden orvost helyesen jelenít meg, függetlenül az adatstruktúra mélységétől. | **pass** |
| **P_08.2** | **Szolgáltatások társítása** | `selectedTreatments` (ID lista) | Az orvos szerkesztésekor a rendszer lekéri a hozzárendelt kezeléseket. Mentéskor az `assignTreatments` szinkronizálja a választottakat. | A szakember adatlapján a jelölőnégyzetek hűen tükrözik a valós kompetenciákat. | **pass** |
| **P_08.3** | **Automatikus idősáv generálás** | Start/End idő, 30/60 min intervallum | A `generateAutoSlots` metódus a következő 14 napra (`sv-SE` dátumformátumban) legenerálja a szabad foglalási helyeket. | A rendszer tömegesen hozta létre az időpontokat, a sikeres darabszám visszajelzésre került. | **pass** |
| **P_08.4** | **Elérhetőség és Státuszkezelés** | `isAvailable` / `isActive` | Az adminisztrátor bármikor felfüggesztheti a foglalhatóságot vagy archiválhatja a szakembert (`isActive: false`). | Az állapotváltozások azonnal érvényre jutnak a páciens oldali keresőfelületen is. | **pass** |
| **P_08.5** | **Biztonsági jelszó-kezelés** | `password` (min. 6 karakter) | Szerkesztésnél a jelszó mező opcionális; csak akkor küldi el a rendszer, ha az admin módosítani kívánja a hitelesítő adatokat. | Üresen hagyott mező esetén a meglévő jelszó nem sérül és nem íródik felül. | **pass** |
| **P_08.6** | **Loading és Hiba visszajelzés** | API válaszidő / Hibaág | A generálási folyamat alatt az `isLoading` jelző aktív. Hiba esetén a `Swal.fire` lefordított hibaüzenetet mutat. | A felhasználó egyértelmű visszajelzést kap a háttérfolyamatok állapotáról. Hibaüzenetek, kulcsok ellenőrzése is megtörtént. | **pass** |

---

## P_09 Szakember kártyák és Páciens navigáció

Ez a szakasz a páciensek számára megjelenített szakember-listát, az intelligens képkezelést és a foglalási folyamat elindítását vizsgálja.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_09.1** | **Aktív szakemberek szűrése** | `isActive` státusz | A rendszer kizárólag az aktív (`true` vagy `1`) státuszú orvosokat jeleníti meg a páciens-oldali listában. | Az inaktív/archivált szakemberek automatikusan kikerültek a publikus nézetből. | **pass** |
| **P_09.2** | **Intelligens profilkép fallback** | Szakember neve | Amennyiben nincs feltöltött fotó, a rendszer keresztnevek alapján (pl. Tünde, Anna) azonosítja a nemet és hozzáillő képet rendel hozzá. | A rendszer sikeresen társította a nem-specifikus avatarokat a nevek alapján. | **pass** |
| **P_09.3** | **Kép elérési út korrekció** | `imageUrl` (adatbázis) | A rendszer automatikusan javítja a hibásan rögzített elérési utakat (prefixek pótlása, URL validáció). | A képek minden esetben helyesen, törött linkek nélkül jelennek meg. | **pass** |
| **P_09.4** | **Hibás betöltés kezelése** | `handleImageError()` | Ha a profilkép nem érhető el a szerveren, a rendszer automatikusan a `default_doctor.png` képre vált. | A hálózati hiba (404) ellenére is esztétikus, helyettesítő kép látható a kártyákon. | **pass** |
| **P_09.5** | **Részletes adatlap és görgetés** | `selectStaff()` hívás | A szakember kiválasztásakor az oldal tetejére görget, és aszinkron módon betölti az adott orvoshoz tartozó szolgáltatásokat. | A `window.scrollTo` zökkenőmentes navigációt biztosított, a `treatments` lista frissült. | **pass** |
| **P_09.6** | **Navigáció a foglaláshoz** | `staffId` (query param) |

---

## P_10. Foglalási folyamat és Naptárkezelés

Ez a szakasz a páciensek számára készített interaktív foglalási felületet, a heti beosztás generálását és a foglalási tranzakciók biztonságos lebonyolítását ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_10.1** | **Heti nézet generálása** | `currentDate` (Date) | A rendszer kiszámítja az aktuális hét hétfőjét és legenerál egy 5 napos (H-P) munkahét tömböt a naptár fejlécéhez. | A `generateWeek` metódus helyesen kezeli a hétváltásokat és a dátumugrásokat. | **pass** |
| **P_10.2** | **Dinamikus szűrési lánc** | Szakterület > Szakember > Szolgáltatás | A szakterület kiválasztása szűri az orvosokat, az orvos kiválasztása pedig az elérhető szolgáltatásokat. | Az `onSpecialtyChange` és `onStaffChange` események konzisztensen frissítik a függő listákat. | **pass** |
| **P_10.3** | **Külső paraméterek szinkronizálása** | `queryParams` (staffId) | Ha a páciens konkrét szakember adatlapjáról érkezik, a naptár automatikusan előválasztja az orvost és betölti az adatait. | A `syncSelectionFromParams` sikeresen inicializálja a nézetet a kapott paraméterek alapján. | **pass** |
| **P_10.4** | **Szabad idősávok validációja** | `availableSlots` + `limitTime` | Csak a jövőbeli időpontok jelenhetnek meg. A rendszer kiszűri a már múltbéli vagy "azonnali" slotokat. | A szűrési logika (`slotDateTime > limitTime`) megakadályozza a technikai okokból már nem foglalható sávok megjelenését. | **pass** |
| **P_10.5** | **Foglalás és Auth ellenőrzés** | `userId` (AuthService) | Foglalási kísérletkor a rendszer ellenőrzi a bejelentkezési státuszt. Ha nincs aktív munkamenet, a `/login` oldalra irányít. | Az `executeBooking` meggátolja az anonim foglalásokat és figyelmeztető üzenetet küld. | **pass** |
| **P_10.6** | **Nyelvspecifikus lokalizáció** | `translate.currentLang` | A naptár fejléce (napok nevei) és a megerősítő ablak dátumformátuma dinamikusan alkalmazkodik a választott nyelvhez (HU/EN). | A `dayFormat` és `dateFormat` property-k helyesen váltanak a nyelvek között. | **pass** |

---
## P_11. Fiókaktiválás folyamat ellenőrzése a P_01 fejezet része lett témakör szempontokat követve egységesítettem lásd. P_01.2 
---

## P_12. Rendszerbiztonság és Útvonalvédelem 

Ez a szakasz a hozzáférési jogosultságokat, a szerepkör-alapú védelmet (RBAC) és a hibás útvonalak automatikus kezelését ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_12.1** | **Bejelentkezés ellenőrzése (AuthGuard)** | `isAuthenticated() === false` | Védett útvonal megnyitásakor a rendszer blokkolja a hozzáférést, és átirányít a `/login` oldalra a visszatérési útvonal (`returnUrl`) mentésével. | A Guard sikeresen megvédte a privát útvonalakat az illetéktelenektől. | **pass** |
| **P_12.2** | **Szerepkör-alapú védelem (Admin)** | `userRole !== 2` | Ha nem-admin felhasználó próbál belépni az `/admin` útvonalakra, a Guard visszairányítja a `/booking` oldalra. | A jogosultsági szintek elkülönítése (Admin vs. Páciens) megfelelően működik. | **pass** |
| **P_12.3** | **Hibás URL (404) kezelése** | Ismeretlen útvonal | Érvénytelen URL beírásakor a wildcard (`**`) szabály aktiválódik, és betölti a `NopageComponent`-et. | A rendszer nem omlik össze hibás link esetén, hanem tájékoztató oldalt mutat. | **pass** |
| **P_12.4** | **Automatikus fallback navigáció** | `setTimeout` (8s) | A hibaoldal (404) 8 másodperc várakozás után automatikusan visszairányítja a felhasználót a kezdőlapra. | Az időzített navigáció lefutott, javítva a felhasználói élményt (UX). | **pass** |
| **P_12.5** | **Időzítő takarítás (Cleanup)** | `ngOnDestroy` | Ha a felhasználó manuálisan elnavigál a hibaoldalról az időzítő lejárta előtt, a rendszer törli a folyamatban lévő `setTimeout`-ot. | A `clearTimeout` megakadályozza a háttérben futó felesleges átirányításokat. | **pass** |

---

## P_13. Általános rendszerstabilitás és UX 

Ez a szakasz a felhasználói élményt, a mobil-optimalizálást, a többnyelvűséget és a biztonságos kijelentkezési folyamatokat ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_13.1** | **Mobil Reszponzivitás** | Mobilnézet (Viewport) | A navigációs menü hamburger-menüvé alakul, a naptár és az űrlapok nem törnek szét, érintéssel jól kezelhetőek. | A felület stabil mobilon is, a CSS Flexbox/Grid rugalmasan alkalmazkodik. | **pass** |
| **P_13.2** | **Többnyelvűség váltása** | Nyelvváltás (HU/EN) | A `TranslateService` segítségével minden statikus felirat, hibaüzenet és naptár-bejegyzés azonnal átvált a választott nyelvre. | A lokalizáció konzisztens, nincs benne maradt fixen kódolt szöveg. | **pass** |
| **P_13.3** | **Biztonságos kijelentkezés** | Logout esemény | A rendszer törli az auth-tokent, megszünteti a munkamenetet és visszairányít a kezdőlapra. | A munkamenet biztonságosan lezárul, a védett útvonalak ezután nem elérhetőek. | **pass** |
| **P_13.4** | **Email sablon reszponzivitás** | Visszaigazoló email | A kiküldött HTML emailek mobileszközökön is olvashatóak, a szöveg és a gombok illeszkednek a képernyőhöz. | A beágyazott CSS stílusok reszponzív megjelenítést biztosítanak. | **pass** |
| **P_13.5** | **Staff Logikai Inaktiválása** | `isActive` kapcsoló | Az inaktivált szakember adatai megmaradnak az adatbázisban (statisztikákhoz), de a páciensek számára eltűnik a kínálatból. | A szűrési logika (`active: true`) megbízhatóan kezeli a láthatóságot. | **pass** |
| **P_13.6** | **Dashboard Adaptivitás** | Tablet/Laptop nézet | Az összetett statisztikai táblázatok és grafikonok szűkebb képernyőn is olvashatóak maradnak (pl. vízszintes görgetés vagy átrendeződés). | A vezetői felület (Dashboard) megőrzi használhatóságát kisebb felbontáson is. | **pass** |

---

## P_14. Navigációs és Elrendezési Struktúra

Ez a szakasz az alkalmazás globális keretrendszerét, a reszponzív navigációt (Navbar) és a dinamikus lábléc (Footer) viselkedését ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_14.1** | **Sticky Footer elrendezés** | `min-height: 100vh` | Kevés tartalom esetén a Footer az oldal alján marad, sok tartalomnál pedig kitolódik. | A Flexbox elrendezés (`flex: 1 0 auto`) stabilan tartja a vázat. | **pass** |
| **P_14.2** | **Háromlépcsős Navbar törés** | Képernyőszélesség váltás | 1. **Desktop**: Teljes menü. 2. **Tablet**: Kompakt nyelvváltó és ikonok. 3. **Mobile**: Hamburger menübe rejtett navigáció. | Az `@media (max-width: 991px)` szabályok zökkenőmentesen váltanak a nézetek között. | **pass** |
| **P_14.3** | **Dinamikus Admin Menü** | `isAdminMenuOpen()` szignál | Az Adminisztrátorok számára megjelenik egy sárga kiemelésű, lenyíló menü az extra funkciókkal (Dashboard, Users-, Staff-, Booking management stb.). | Az animált (`navFadeIn`) dropdown menü csak jogosultaknak látható. | **pass** |
| **P_14.4** | **Kontextus-függő Footer** | `isBookingPage()` feltétel | A foglalási oldalon (ahol a naptár nagy helyet foglal) a lábléc elrejtésre kerül, hogy több tér jusson az időpontoknak. | A feltételes renderelés (`@if`) tisztább felhasználói felületet biztosít a kritikus pontokon. | **pass** |
| **P_14.5** | **Interaktív Nyelvváltó** | `switchLanguage()` | A nyelvváltó HU/EN gombjai vizuálisan is jelzik az aktív állapotot (`bg-white` kiemelés), és azonnal frissítik a feliratokat. | A `translate.currentLang` figyelése reaktív és pontos. | **pass** |
| **P_14.6** | **Mobil Menü Esztétika** | `navbar-collapse` (nyitott) | Mobil nézetben a kinyitott menü áttetsző kék hátteret, árnyékot és lekerekített sarkokat kap a jobb olvashatóság érdekében. | A mobil UI prémium hatást kelt, nem takarja el átlátszatlanul a tartalmat. | **pass** |

---

## P_15. Kezdőoldal és Reszponzív UI elemek (Landing Page)

Ez a szakasz a felhasználói élmény elsődleges belépési pontját, a vizuális elemeket és a kontextusfüggő hívó-gombokat (CTA) ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_15.1** | **Hero szekció és Animáció** | Oldalbetöltés | A cím és alcím megjelenésekor az `animate__fadeIn` animáció lefut, a `divider-line` központosítva jelenik meg. | A vizuális elemek sima átmenettel jelennek meg, növelve a professzionális hatást. | **pass** |
| **P_15.2** | **Dinamikus CTA gomb** | `authService` állapota | Bejelentkezett felhasználónak a "Foglalás", anonim felhasználónak a "Bejelentkezés" szöveg és ikon jelenik meg. | A gomb felirata és ikonja (`calendar-check` vs `lock`) reaktívan változik a belépési állapottól függően. | **pass** |
| **P_15.3** | **Elite-Card reszponzivitás** | Viewport szűkítése | A kártyák asztali gépen egymás mellett (2 oszlop), mobilon egymás alatt (1 oszlop) jelennek meg a `col-lg-5` és `col-12` osztályok miatt. | A kártyarendszer stabilan törik, a képek nem torzulnak, a szöveg olvasható marad. | **pass** |
| **P_15.4** | **Lokalizált tartalom** | `translate` pipe | Minden szöveg (Cím, Alcím, Kártya szövegek) a nyelvi fájlokból töltődik be, dinamikusan követve a nyelvváltót. | A HU/EN váltás azonnal frissíti a kezdőoldal teljes tartalmát. | **pass** |
| **P_15.5** | **Interaktív navigáció** | `onStartBooking()` | A gombra kattintva a rendszer a megfelelő oldalra navigál (bejelentkezés vagy foglalás), figyelembe véve az auth státuszt. | A metódus helyesen választja ki a célútvonalat a felhasználói állapot alapján. | **pass** |

---

## P_16. Globális Stílusrendszer és Arculati Elemek

Ez a szakasz az alkalmazás egységes megjelenését, a CSS architektúrát és a vizuális visszajelzések stílusát ellenőrzi.

| Id | Folyamat / Lépés | Bemenő adatok | Elvárt Működés | Tényleges Működés | Státusz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P_16.1** | **Globális Tipográfia** | Montserrat Google Font | A rendszer az alkalmazásban a Montserrat betűtípust használja `-webkit-font-smoothing` simítással az elit megjelenésért. | A betűtípus minden platformon konzisztensen és olvashatóan jelenik meg. | **pass** |
| **P_16.2** | **Arculati változók használata** | `:root` változók | Az alapszínek (Elite Blue, Dark, Light) központosított változókból öröklődnek, biztosítva a könnyű módosíthatóságot. | A színek egységesek minden komponensben (gombok, szövegek, ikonok). | **pass** |
| **P_16.3** | **Interaktív Branding (Szívverés)** | Navbar logo hover | A `bi-heart-pulse-fill` ikonra való navigáláskor a `beat` animáció aktiválódik (szívverés effekt). | Az animáció sima, a `transform-origin` miatt központosított. | **pass** |
| **P_16.4** | **Autentikációs UI (Glassmorphism)** | Card design | A Login/Reset kártyák `backdrop-filter: blur` és finom árnyék (`box-shadow`) hatást kapnak a modern, lebegő érzetért. | A kártyák a hover effektusra (`translateY`) is reagálnak, dinamikussá téve a belépést. | **pass** |
| **P_16.5** | **Gradiens Ikonográfia** | Auth ikonok | A funkcionális ikonok (profil, pajzs, boríték) 135 fokos kék gradienst kapnak, egyedi vizuális karaktert adva a funkcióknak. | Az ikonok kiemelkednek a felületről a `drop-shadow` segítségével. | **pass** |
| **P_16.6** | **Egyedi Scrollbar és Overflow** | CSS Webkit szabályok | A böngésző görgetősávja vékonyított, lekerekített és az arculati kék színt használja hover esetén. | A `body { overflow-x: hidden }` megakadályozza a véletlen vízszintes elcsúszásokat. | **pass** |
| **P_16.7** | **Állapotjelző Ikonboxok** | Success/Error nézetek | A visszaigazoló oldalakon (pl. sikeres email aktiválás) nagy méretű, színezett és árnyékolt ikonok jelzik a folyamat kimenetelét. | A zöld/piros állapotjelzések azonnal felismerhetővé teszik a művelet sikerességét. | **pass** |

## 3. Összegzés és Következtetés

A manuális tesztelés során az **ElitPort** rendszer minden kritikus üzleti folyamata (End-to-End) átfogó ellenőrzésre került, a regisztrációtól kezdve az összetett adminisztrációs folyamatokig.

### Főbb megállapítások:

* **Műszaki stabilitás:** A vizsgálat igazolta, hogy a frontend és backend közötti kommunikáció hibamentes. A **Signal-alapú állapotkezelés** és az aszinkron adatfolyamok (RxJS) megbízhatóan szolgálják ki a felhasználói interakciókat.
* **Biztonsági megfelelőség:** Az **AuthGuard** és a szerepkör-alapú hozzáférés-kezelés (RBAC) szigorúan korlátozza a jogosulatlan hozzáféréseket, a munkamenetek kezelése (token perzisztencia) pedig biztonságos és konzisztens.
* **Felhasználói élmény (UX/UI):** Az alkalmazás reszponzivitása kiemelkedő; a háromlépcsős navigációs töréspontok és a modern CSS megoldások (Glassmorphism, Flexbox) stabil megjelenítést biztosítanak asztali, tablet és mobil nézetben egyaránt.
* **Hiba-ellenállóság:** A rendszer hatékonyan kezeli a szélső eseteket (pl. lejárt tokenek, hibás URL-ek, szerveroldali hibaüzenetek), és minden esetben egyértelmű, lokalizált visszajelzést ad a felhasználónak a SweetAlert interfészen keresztül.

### Záró nyilatkozat:

A tesztelési jegyzőkönyvben rögzített **16 ellenőrzési fejezet** alapján a szoftver megfelel a specifikációnak, kritikusan hibás működés nem azonosítható. Az alkalmazás technikai felépítése, kódminősége és funkcionális sokszínűsége alapján **alkalmas a bemutatásra.**

A manuális tesztelés során a rendszer minden kritikus üzleti folyamata (End-to-End) ellenőrzésre került. A vizsgálat igazolta, hogy a frontend és backend közötti kommunikáció hibamentes, a felhasználói élmény pedig konzisztens az asztali és mobil nézetekben egyaránt.
