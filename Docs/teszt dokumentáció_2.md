# Teszt dokumentáció 2

## Tesztadatok

| Mező | Érték |
| --- | --- |
| Teszt ID | TC_002 |

| Típus | Funkció |
| Teszt leírása | Az ElitPort webes alkalmazás fő felhasználói folyamatainak funkcionális ellenőrzése |
| Tesztelő neve | Livi |
| Tesztelés dátuma | 2026-03-29 |
| Teszt státuszok | pass, fail |
| Követelmény | A rendszer támogassa a regisztrációt, bejelentkezést, időpontfoglalást és a foglalások kezelését |

## Tesztesetek

| Teszteset | Lépés részletei | Elvárt eredmény | Aktuális eredmény | Státusz |
| --- | --- | --- | --- | --- |
| Kezdőoldal betöltése | Megnyitom az alkalmazást böngészőben | A kezdőoldal hiba nélkül megjelenik | A funkció manuális ellenőrzése még nem történt meg | fail |
| Regisztráció érvényes adatokkal | Megadom a nevet, e-mail címet, jelszót és jelszó megerősítést, majd elküldöm az űrlapot | A rendszer létrehozza a fiókot és megerősítő üzenetet jelenít meg | A backend logika alapján működő folyamat, de manuális végellenőrzés még nem történt meg | fail |
| Regisztráció hibás megerősítéssel | A jelszó és a megerősítő jelszó eltér, majd elküldöm az űrlapot | A rendszer hibaüzenetet jelenít meg és nem hoz létre fiókot | A backend ezt kezeli, automata teszt jelenleg elavult mezőnevet használ | fail |
| Bejelentkezés helyes adatokkal | Megadom a regisztrált e-mail címet és jelszót, majd belépek | A rendszer beléptet és jogosultság szerint átirányít | A meglévő backend teszt hibás request mezőt használ, ezért az automatizált ellenőrzés jelenleg hibás | fail |
| Bejelentkezés nem megerősített e-maillel | Olyan felhasználóval próbálok belépni, amelynek nincs megerősítve az e-mail címe | A rendszer tiltja a belépést és figyelmeztető üzenetet ad | A backend logika ezt támogatja, de manuális ellenőrzés még nem történt meg | fail |
| Elfelejtett jelszó indítása | Megadom a regisztrált e-mail címet az elfelejtett jelszó felületen | A rendszer visszaállító linket küld vagy semleges üzenetet jelenít meg | A folyamat implementálva van, de az e-mail konfiguráció és manuális ellenőrzés még nincs igazolva | fail |
| Időpontfoglalás indítása | Bejelentkezés után kiválasztok szakembert, szolgáltatást, dátumot és időpontot | A rendszer sikeresen rögzíti a foglalást | Automatizált e2e teszt nincs, manuális ellenőrzés még nem történt meg | fail |
| Saját foglalások megtekintése | Megnyitom a Saját foglalásaim oldalt | A rendszer listázza az aktív és korábbi foglalásokat | A frontend nézet rendelkezésre áll, de manuális ellenőrzés még nem történt meg | fail |
| Foglalás lemondása | Kiválasztok egy lemondható jövőbeli foglalást és rákattintok a Lemondás gombra | A foglalás törlődik vagy inaktívvá válik, a felület frissül | A folyamat létezik, de végponti és üzleti szabály ellenőrzés még nem történt meg | fail |
| Staff lista lekérése | Lekérem a staff listát a rendszerből | A staff lista visszatér | A backend automata teszt alapján sikeres | pass |
| Slot lista lekérése | Lekérem a slot listát a rendszerből | A slot lista visszatér | A backend automata teszt alapján sikeres | pass |
| Staff létrehozása jogosultság nélkül | Jogosulatlan felhasználóként staff létrehozást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |
| Slot módosítása jogosultság nélkül | Jogosulatlan felhasználóként slot módosítást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |

## Megjegyzések

- A `pass` státusz azt jelzi, hogy a teszt eredménye megfelelő, a vizsgált működés rendben van.
- A `fail` státusz jelen esetben főként az elavult automatizált tesztekre utal, nem feltétlenül a backend vagy frontend üzleti logika hibájára.