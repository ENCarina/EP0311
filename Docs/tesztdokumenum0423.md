# Teszt dokumentáció 0423

## Tesztadatok
| Mező | Érték |
| :--- | :--- | :--- | :--- | :--- |
| Teszt ID | TC_0423 |
| Készítette | Varga Lívia |
| Típus | Funkció |
| Teszt leírása | Az EP0311 - ElitPort webes alkalmazás funkcionális tesztelése a jelenlegi master ág alapján |
| Tesztelés dátuma | 2026-04-23 |
| Teszt Státuszok | pass |
| Követelmény | A rendszer támogassa a regisztrációt, bejelentkezést, email megerősítést, jelszó-visszaállítást, időpontfoglalást és adminisztrációt |
| Projekt | ElitPort: Magánklinikai digitális időpontfoglaló rendszer |
| Kompatibilitási forrás | EPApi/app/routes/api.js, epweb/src/app/app.routes.ts |

## Tesztesetek

| Id | Teszteset | Lépés részletei | Elvárt eredmény | Státusz |
| :--- | :--- | :--- | :--- | :--- |
| TC0423_001 | Kezdőoldal betöltése | Frontend megnyitása, /home útvonal | A kezdőoldal betöltődik hiba nélkül | pass |
| TC0423_002 | Login oldal megnyitása | Navigáció /login oldalra | Login oldal és űrlap megjelenik | pass |
| TC0423_003 | Register oldal megnyitása | Navigáció /register oldalra | Regisztrációs oldal megjelenik | pass |
| TC0423_004 | Verify email route működése | /verify-email/:token megnyitása valid tokennel | Sikeres visszajelzés és aktiválás | pass |
| TC0423_005 | Forgot password oldal | /forgot-password megnyitása | Jelszó-visszaállítás kérő űrlap látszik | pass |
| TC0423_006 | Reset password oldal | /reset-password/:token megnyitása valid tokennel | Új jelszó beállító űrlap látszik | pass |
| TC0423_007 | Sikeres regisztráció API | POST /register valid adatokkal | 2xx válasz, fiók létrejön | pass |
| TC0423_008 | Sikeres login API | POST /login valid felhasználóval | Token és user adatok visszatérnek | pass |
| TC0423_009 | Verify email API | GET /verify-email/:token | Aktiválás sikeres valid tokennél | pass |
| TC0423_010 | Forgot password API | POST /forgot-password regisztrált emaillel | Sikeres visszajelzés | pass |
| TC0423_011 | Reset password API | POST /reset-password valid token + új jelszó | Jelszó módosul, sikeres válasz | pass |
| TC0423_012 | Saját profil lekérés | GET /profile/me tokennel | Saját profil adatai visszatérnek | pass |
| TC0423_013 | Saját profil frissítés | PUT /profile/update tokennel | Módosítás mentésre kerül | pass |
| TC0423_014 | Admin user lista | GET /users admin tokennel | Felhasználólista visszatér | pass |
| TC0423_015 | Egy user lekérése | GET /users/:id tokennel | Kiválasztott user adatai visszatérnek | pass |
| TC0423_016 | Admin user jelszó módosítás | POST /users/:id/password adminnal | Jelszó frissül | pass |
| TC0423_017 | Admin user Státusz módosítás | POST /users/:id/status adminnal | Aktív/inaktív állapot mentődik | pass |
| TC0423_018 | Admin user update | PUT /users/:id adminnal | User adatok frissülnek | pass |
| TC0423_019 | Admin user törlés vagy archiválás | DELETE /users/:id adminnal | User Státusz vagy törlés sikeres | pass |
| TC0423_020 | Publikus staff lista | GET /staff/public | Nyilvános szakember lista visszatér | pass |
| TC0423_021 | Staff teljes lista | GET /staff | Staff lista elérhető | pass |
| TC0423_022 | Staff részletek | GET /staff/:id | Staff profil adatai visszatérnek | pass |
| TC0423_023 | Staff kezelések lekérése | GET /staff/:id/treatments | Kezeléslista visszatér | pass |
| TC0423_024 | Staff létrehozás adminnal | POST /staff admin tokennel | Új staff rekord létrejön | pass |
| TC0423_025 | Staff módosítás adminnal | PUT /staff/:id admin tokennel | Staff rekord frissül | pass |
| TC0423_026 | Staff törlés adminnal | DELETE /staff/:id admin tokennel | Staff inaktiválás vagy törlés sikeres | pass |
| TC0423_027 | Staff promote adminnal | POST /staff/promote admin tokennel | User staff szerepkört kap | pass |
| TC0423_028 | Staff treatment hozzárendelés | POST /staff/:id/treatments admin tokennel | Kezelés hozzárendelés sikeres | pass |
| TC0423_029 | Konzultációk listázása | GET /consultations | Konzultációk visszatérnek | pass |
| TC0423_030 | Konzultáció létrehozás adminnal | POST /consultations admin tokennel | Új konzultáció létrejön | pass |
| TC0423_031 | Konzultáció módosítás adminnal | PUT /consultations/:id admin tokennel | Konzultáció frissül | pass |
| TC0423_032 | Konzultáció törlés adminnal | DELETE /consultations/:id admin tokennel | Konzultáció törlés sikeres | pass |
| TC0423_033 | Slot lista | GET /slots | Slot lista visszatér | pass |
| TC0423_034 | Slot részletek lekérése | GET /slots/:id tokennel | Slot részletek visszatérnek | pass |
| TC0423_035 | Slot létrehozás staff joggal | POST /slots role=1 tokennel | Slot létrejön | pass |
| TC0423_036 | Slot bulk generate | POST /slots/generate tokennel | Tömeges slot generálás sikeres | pass |
| TC0423_037 | Slot módosítás | PUT /slots/:id tokennel | Slot adatok frissülnek | pass |
| TC0423_038 | Slot törlés | DELETE /slots/:id tokennel | Slot törlés sikeres | pass |
| TC0423_039 | Booking lista | GET /bookings tokennel | Foglaláslista visszatér | pass |
| TC0423_040 | Booking létrehozás | POST /bookings tokennel | Foglalás sikeresen létrejön | pass |
| TC0423_041 | Booking részletek | GET /bookings/:id tokennel | Foglalás részletek visszatérnek | pass |
| TC0423_042 | Booking módosítás | PUT /bookings/:id tokennel | Foglalás frissül | pass |
| TC0423_043 | Booking törlés | DELETE /bookings/:id tokennel | Foglalás törlés vagy lemondás sikeres | pass |
| TC0423_044 | Saját foglalások oldal | /my-bookings megnyitása belépett felhasználóval | Saját foglalások oldal betöltődik | pass |
| TC0423_045 | Admin dashboard oldal | /admin/dashboard megnyitása adminnal | Admin dashboard oldal betöltődik | pass |
| TC0423_046 | Admin users oldal | /admin/users megnyitása adminnal | Felhasználókezelő oldal betöltődik | pass |
| TC0423_047 | Admin staff oldal | /admin/staff megnyitása adminnal | Staff kezelő oldal betöltődik | pass |
| TC0423_048 | Admin consultation oldal | /admin/consultation megnyitása adminnal | Konzultáció kezelő oldal betöltődik | pass |
| TC0423_049 | Admin bookings oldal | /admin/bookings megnyitása adminnal | Foglalás kezelő oldal betöltődik | pass |
| TC0423_050 | StaffCard oldal | /staffCard megnyitása | Publikus staff kártya oldal megjelenik | pass |
| TC0423_051 | About oldal megnyitása | Navigáció /about oldalra | Az információs oldal betöltődik | pass |
| TC0423_052 | Home oldal visszanavigálás | Tetszőleges oldalról /home megnyitása | A kezdőoldal tartalma újra megjelenik | pass |
| TC0423_053 | Register űrlap mezők megjelenése | /register oldalon mezők ellenőrzése | Név, email, jelszó mezők láthatók | pass |
| TC0423_054 | Login űrlap mezők megjelenése | /login oldalon mezők ellenőrzése | Email és jelszó mezők láthatók | pass |
| TC0423_055 | Forgot password űrlap mező | /forgot-password oldalon mező ellenőrzése | Email mező megjelenik és kitölthető | pass |
| TC0423_056 | Reset password űrlap mezők | /reset-password/:token oldalon mezők ellenőrzése | Új jelszó és megerősítés mezők megjelennek | pass |
| TC0423_057 | Verify oldal Státusz üzenet | /verify-email/:token oldalon tartalom ellenőrzése | Visszajelző üzenet megjelenik | pass |
| TC0423_058 | Bejelentkezés utáni foglalás oldal | Belépés után /booking megnyitása | Foglalási felület betöltődik | pass |
| TC0423_059 | Foglalás oldal paraméterrel | /booking/:id megnyitása belépve | Paraméterezett foglalási nézet betöltődik | pass |
| TC0423_060 | Saját foglalások lista megjelenés | /my-bookings oldalon lista ellenőrzése | Foglalási lista komponens megjelenik | pass |
| TC0423_061 | Admin dashboard statisztika blokk | /admin/dashboard oldalon kártyák ellenőrzése | Dashboard statisztika elemek látszanak | pass |
| TC0423_062 | Admin users táblázat megjelenés | /admin/users oldalon tábla ellenőrzése | Felhasználói táblázat betöltődik | pass |
| TC0423_063 | Admin staff lista megjelenés | /admin/staff oldalon lista ellenőrzése | Szakember lista megjelenik | pass |
| TC0423_064 | Admin consultation lista megjelenés | /admin/consultation oldalon lista ellenőrzése | Konzultációs lista betöltődik | pass |
| TC0423_065 | Admin bookings lista megjelenés | /admin/bookings oldalon lista ellenőrzése | Foglalási lista betöltődik | pass |
| TC0423_066 | Staff publikus profil kép megjelenés | /staffCard oldalon kártya elemek ellenőrzése | Profilkép és név mezők látszanak | pass |
| TC0423_067 | API staff publikus lista tartalom | GET /staff/public hívás adatellenőrzéssel | Tömbös válasz és staff mezők visszatérnek | pass |
| TC0423_068 | API consultations tartalom | GET /consultations hívás adatellenőrzéssel | Konzultáció név és leírás mezők visszatérnek | pass |
| TC0423_069 | API slots tartalom | GET /slots hívás adatellenőrzéssel | Slot időpont mezők visszatérnek | pass |
| TC0423_070 | API bookings tartalom | GET /bookings tokennel adatellenőrzés | Booking mezők visszatérnek | pass |
| TC0423_071 | API profile tartalom | GET /profile/me tokennel adatellenőrzés | Profil alapmezők visszatérnek | pass |
| TC0423_072 | User Státuszváltás utáni lekérés | Státusz módosítás után GET /users/:id | Frissített Státusz visszaolvasható | pass |
| TC0423_073 | User adatfrissítés utáni lekérés | User update után GET /users/:id | Módosított adatok visszaolvashatók | pass |
| TC0423_074 | Konzultáció létrehozás utáni lista | Új konzultáció után GET /consultations | Új elem megjelenik a listában | pass |
| TC0423_075 | Slot létrehozás utáni lista | Új slot után GET /slots | Új slot megjelenik a listában | pass |
| TC0423_076 | Booking létrehozás utáni lista | Új booking után GET /bookings | Új booking megjelenik a listában | pass |
| TC0423_077 | Booking módosítás utáni részletek | Booking update után GET /bookings/:id | Frissített booking adatok visszatérnek | pass |
| TC0423_078 | Staff módosítás utáni részletek | Staff update után GET /staff/:id | Frissített staff adatok visszatérnek | pass |
| TC0423_079 | Staff kezelés hozzárendelés utáni lekérés | Treatment hozzárendelés után GET /staff/:id/treatments | Új kezelés szerepel a listában | pass |
| TC0423_080 | Teljes alap felhasználói folyamat | Regisztráció, belépés, foglalás, saját foglalás megnyitás | A folyamat minden lépése sikeresen teljesül | pass |
| TC0423_081 | Home oldal újratöltés | /home oldalon böngésző frissítés | Az oldal stabilan újratöltődik | pass |
| TC0423_082 | Login oldal újratöltés | /login oldalon böngésző frissítés | A login űrlap újratöltés után is használható | pass |
| TC0423_083 | Register oldal újratöltés | /register oldalon böngésző frissítés | A regisztrációs felület stabilan betölt | pass |
| TC0423_084 | StaffCard visszanavigálás | /staffCard után vissza a /home oldalra | Navigációs átmenet sikeres | pass |
| TC0423_085 | Booking oldal megnyitása menüből | Bejelentkezve foglalás menüpontra kattintás | Foglalás oldal hiba nélkül nyílik meg | pass |
| TC0423_086 | My-bookings oldal frissítése | /my-bookings oldalon frissítés | Foglalási lista újratöltődik | pass |
| TC0423_087 | Admin users oldal frissítése | /admin/users oldalon frissítés | Felhasználói táblázat újratöltődik | pass |
| TC0423_088 | Admin staff oldal frissítése | /admin/staff oldalon frissítés | Staff lista újratöltődik | pass |
| TC0423_089 | Admin consultation oldal frissítése | /admin/consultation oldalon frissítés | Konzultációs lista újratöltődik | pass |
| TC0423_090 | Admin bookings oldal frissítése | /admin/bookings oldalon frissítés | Booking lista újratöltődik | pass |
| TC0423_091 | API staff részletes mezők | GET /staff/:id válasz mezőinek ellenőrzése | Alap profilmezők visszatérnek | pass |
| TC0423_092 | API consultations részletes mezők | GET /consultations/:id válasz ellenőrzése | Konzultáció részletes mezők visszatérnek | pass |
| TC0423_093 | API slots időmezők | GET /slots válasz idő mezők ellenőrzése | Dátum és idősáv mezők konzisztensen jelennek meg | pass |
| TC0423_094 | API bookings tulajdonosi mezők | GET /bookings válasz mezők ellenőrzése | Foglalás és kapcsolt mezők visszatérnek | pass |
| TC0423_095 | Profil update utáni újra login | Profil adat frissítés, majd új login | Frissített adatokkal belépés sikeres | pass |
| TC0423_096 | Jelszó reset utáni login folyamat | Reset után login új jelszóval | Bejelentkezés sikeres új jelszóval | pass |
| TC0423_097 | Staff létrehozás utáni publikus megjelenés | Staff create után /staff/public lekérés | Új szakember publikus listában megjelenik | pass |
| TC0423_098 | Konzultáció frissítés utáni lista | Konzultáció update után /consultations | Frissített értékek listában láthatók | pass |
| TC0423_099 | Slot törlés utáni lista frissítés | Slot delete után /slots lekérés | Törölt slot már nem látható | pass |
| TC0423_100 | Booking törlés utáni saját lista | Booking delete után /my-bookings megnyitás | Törölt foglalás nem jelenik meg | pass |




