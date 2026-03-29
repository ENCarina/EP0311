# Teszt dokumentáció 2

## Tesztadatok
| Mező | Érték |

| Típus | Funkció |
| Teszt leírása | Az ElitPort webes alkalmazás fő felhasználói folyamatainak funkcionális ellenőrzése |
| Tesztelő neve | Livi |
| Tesztelés dátuma | 2026-03-29 |
| Teszt státuszok | pass, fail |
| Követelmény | A rendszer támogassa a regisztrációt, bejelentkezést, időpontfoglalást és a foglalások kezelését |

## Tesztkörnyezet
| Szempont | Rögzített környezet |
| --- | --- |
| Hardverkörnyezet | Fejlesztői számítógép / laptop |
| Operációs rendszer | Windows |
| Böngésző | Modern Chromium alapú böngésző |
| Asztali nézet | Asztali webböngésző |
| Mobil ellenőrzés | Böngészőben szimulált mobil nézet |
| Vizsgált sajátosság | Űrlapok, navigáció, foglalási folyamat és jogosultsági viselkedés |

## Tesztelési formák
| Típus | Leírás |
| --- | --- |
| Statikus tesztelés | A route-ok, vezérlők, űrlapmezők, jogosultsági feltételek és meglévő tesztek áttekintése |
| Dinamikus tesztelés | Manuális és automatizált futtatás valós kérésekkel, helyes és hibás adatokkal |
| Stresszteszt | Nagyobb adatmennyiség, ismételt beküldés és nem optimális használat melletti viselkedés ellenőrzése |

## Tesztesetek
| Teszteset | Lépés részletei | Elvárt eredmény | Aktuális eredmény | Státusz |
| --- | --- | --- | --- | --- |
| Statikus ellenőrzés a regisztrációs folyamaton | Áttekintem a regisztrációs űrlap mezőit és a backend által várt request mezőket | A frontend és backend mezői összhangban vannak | A jelenlegi backend tesztek között látható eltérés az elavult mezőnevek miatt | fail |
| Kezdőoldal betöltése | Megnyitom az alkalmazást böngészőben | A kezdőoldal hiba nélkül megjelenik | A funkció manuális ellenőrzése még nem történt meg | fail |
| Regisztráció érvényes adatokkal | Megadom a nevet, e-mail címet, jelszót és jelszó megerősítést, majd elküldöm az űrlapot | A rendszer létrehozza a fiókot és megerősítő üzenetet jelenít meg | A backend logika alapján működő folyamat, de manuális végellenőrzés még nem történt meg | fail |
| Regisztráció hibás megerősítéssel | A jelszó és a megerősítő jelszó eltér, majd elküldöm az űrlapot | A rendszer hibaüzenetet jelenít meg és nem hoz létre fiókot | A backend ezt kezeli, automata teszt jelenleg elavult mezőnevet használ | fail |
| Regisztráció hiányzó adatokkal | Üresen hagyok kötelező mezőket, majd elküldöm az űrlapot | A rendszer nem engedi a mentést és hibát jelez | Manuális ellenőrzés még nem történt meg | fail |
| Bejelentkezés helyes adatokkal | Megadom a regisztrált e-mail címet és jelszót, majd belépek | A rendszer beléptet és jogosultság szerint átirányít | A meglévő backend teszt hibás request mezőt használ, ezért az automatizált ellenőrzés jelenleg hibás | fail |
| Bejelentkezés nem megerősített e-maillel | Olyan felhasználóval próbálok belépni, amelynek nincs megerősítve az e-mail címe | A rendszer tiltja a belépést és figyelmeztető üzenetet ad | A backend logika ezt támogatja, de manuális ellenőrzés még nem történt meg | fail |
| Elfelejtett jelszó indítása | Megadom a regisztrált e-mail címet az elfelejtett jelszó felületen | A rendszer visszaállító linket küld vagy semleges üzenetet jelenít meg | A folyamat implementálva van, de az e-mail konfiguráció és manuális ellenőrzés még nincs igazolva | fail |
| Időpontfoglalás indítása | Bejelentkezés után kiválasztok szakembert, szolgáltatást, dátumot és időpontot | A rendszer sikeresen rögzíti a foglalást | Automatizált e2e teszt nincs, manuális ellenőrzés még nem történt meg | fail |
| Időpontfoglalás hiányzó adatokkal | Nem választok ki minden kötelező mezőt, majd foglalást indítok | A rendszer blokkolja a mentést és hibaüzenetet mutat | Manuális ellenőrzés még nem történt meg | fail |
| Saját foglalások megtekintése | Megnyitom a Saját foglalásaim oldalt | A rendszer listázza az aktív és korábbi foglalásokat | A frontend nézet rendelkezésre áll, de manuális ellenőrzés még nem történt meg | fail |
| Foglalás lemondása | Kiválasztok egy lemondható jövőbeli foglalást és rákattintok a Lemondás gombra | A foglalás törlődik vagy inaktívvá válik, a felület frissül | A folyamat létezik, de végponti és üzleti szabály ellenőrzés még nem történt meg | fail |
| Staff lista lekérése | Lekérem a staff listát a rendszerből | A staff lista visszatér | A backend automata teszt alapján sikeres | pass |
| Slot lista lekérése | Lekérem a slot listát a rendszerből | A slot lista visszatér | A backend automata teszt alapján sikeres | pass |
| Staff létrehozása jogosultság nélkül | Jogosulatlan felhasználóként staff létrehozást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |
| Slot módosítása jogosultság nélkül | Jogosulatlan felhasználóként slot módosítást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |
| Asztali nézet ellenőrzése | Asztali böngészőnézetben végigmegyek a fő felhasználói oldalakon | A navigáció és az űrlapok megfelelően jelennek meg | Részletes manuális ellenőrzés még nem történt meg | fail |
| Mobil nézet ellenőrzése | Mobil nézetre váltok a böngészőben és megnyitom a fő oldalakat | A fő elemek kezelhetők maradnak kisebb felbontáson is | Részletes manuális ellenőrzés még nem történt meg | fail |
| Stresszteszt sok adatkéréssel | Rövid idő alatt többször kérem le a staff és slot listát | A rendszer stabil választ ad és nem omlik össze | Külön terheléses mérés még nem történt meg | fail |
| Stresszteszt ismételt hibás beküldéssel | Többször küldök hiányos vagy hibás adatokat az űrlapokról | A rendszer hibát jelez, de stabil marad | Külön terheléses mérés még nem történt meg | fail |

## Megjegyzések
- A `pass` státusz azt jelzi, hogy a teszt eredménye megfelelő, a vizsgált működés rendben van.
- A `fail` státusz jelen esetben főként az elavult automatizált tesztekre utal, nem feltétlenül a backend vagy frontend üzleti logika hibájára.
- A dokumentum a statikus, dinamikus és stresszteszt szempontokat is rögzíti, de több manuális és terheléses ellenőrzés még további gyakorlati futtatást igényel.
# Teszt dokumentáció 2

## Tesztadatok

| Mező | Érték |

| Típus | Funkció |
| Teszt leírása | Az ElitPort webes alkalmazás fő felhasználói folyamatainak funkcionális ellenőrzése |
| Tesztelő neve | Livi |
| Tesztelés dátuma | 2026-03-29 |
| Teszt státuszok | pass, fail |
| Követelmény | A rendszer támogassa a regisztrációt, bejelentkezést, időpontfoglalást és a foglalások kezelését |

## Tesztkörnyezet

| Szempont | Rögzített környezet |
| --- | --- |
| Hardverkörnyezet | Fejlesztői számítógép / laptop |
| Operációs rendszer | Windows |
| Böngésző | Modern Chromium alapú böngésző |
| Asztali nézet | Asztali webböngésző |
| Mobil ellenőrzés | Böngészőben szimulált mobil nézet |
| Vizsgált sajátosság | Űrlapok, navigáció, foglalási folyamat és jogosultsági viselkedés |

## Tesztelési formák

| Típus | Leírás |
| --- | --- |
| Statikus tesztelés | A route-ok, vezérlők, űrlapmezők, jogosultsági feltételek és meglévő tesztek áttekintése |
| Dinamikus tesztelés | Manuális és automatizált futtatás valós kérésekkel, helyes és hibás adatokkal |
| Stresszteszt | Nagyobb adatmennyiség, ismételt beküldés és nem optimális használat melletti viselkedés ellenőrzése |

## Tesztesetek

| Teszteset | Lépés részletei | Elvárt eredmény | Aktuális eredmény | Státusz |
| --- | --- | --- | --- | --- |
| Statikus ellenőrzés a regisztrációs folyamaton | Áttekintem a regisztrációs űrlap mezőit és a backend által várt request mezőket | A frontend és backend mezői összhangban vannak | A jelenlegi backend tesztek között látható eltérés az elavult mezőnevek miatt | fail |
| Kezdőoldal betöltése | Megnyitom az alkalmazást böngészőben | A kezdőoldal hiba nélkül megjelenik | A funkció manuális ellenőrzése még nem történt meg | fail |
| Regisztráció érvényes adatokkal | Megadom a nevet, e-mail címet, jelszót és jelszó megerősítést, majd elküldöm az űrlapot | A rendszer létrehozza a fiókot és megerősítő üzenetet jelenít meg | A backend logika alapján működő folyamat, de manuális végellenőrzés még nem történt meg | fail |
| Regisztráció hibás megerősítéssel | A jelszó és a megerősítő jelszó eltér, majd elküldöm az űrlapot | A rendszer hibaüzenetet jelenít meg és nem hoz létre fiókot | A backend ezt kezeli, automata teszt jelenleg elavult mezőnevet használ | fail |
| Regisztráció hiányzó adatokkal | Üresen hagyok kötelező mezőket, majd elküldöm az űrlapot | A rendszer nem engedi a mentést és hibát jelez | Manuális ellenőrzés még nem történt meg | fail |
| Bejelentkezés helyes adatokkal | Megadom a regisztrált e-mail címet és jelszót, majd belépek | A rendszer beléptet és jogosultság szerint átirányít | A meglévő backend teszt hibás request mezőt használ, ezért az automatizált ellenőrzés jelenleg hibás | fail |
| Bejelentkezés nem megerősített e-maillel | Olyan felhasználóval próbálok belépni, amelynek nincs megerősítve az e-mail címe | A rendszer tiltja a belépést és figyelmeztető üzenetet ad | A backend logika ezt támogatja, de manuális ellenőrzés még nem történt meg | fail |
| Elfelejtett jelszó indítása | Megadom a regisztrált e-mail címet az elfelejtett jelszó felületen | A rendszer visszaállító linket küld vagy semleges üzenetet jelenít meg | A folyamat implementálva van, de az e-mail konfiguráció és manuális ellenőrzés még nincs igazolva | fail |
| Időpontfoglalás indítása | Bejelentkezés után kiválasztok szakembert, szolgáltatást, dátumot és időpontot | A rendszer sikeresen rögzíti a foglalást | Automatizált e2e teszt nincs, manuális ellenőrzés még nem történt meg | fail |
| Időpontfoglalás hiányzó adatokkal | Nem választok ki minden kötelező mezőt, majd foglalást indítok | A rendszer blokkolja a mentést és hibaüzenetet mutat | Manuális ellenőrzés még nem történt meg | fail |
| Saját foglalások megtekintése | Megnyitom a Saját foglalásaim oldalt | A rendszer listázza az aktív és korábbi foglalásokat | A frontend nézet rendelkezésre áll, de manuális ellenőrzés még nem történt meg | fail |
| Foglalás lemondása | Kiválasztok egy lemondható jövőbeli foglalást és rákattintok a Lemondás gombra | A foglalás törlődik vagy inaktívvá válik, a felület frissül | A folyamat létezik, de végponti és üzleti szabály ellenőrzés még nem történt meg | fail |
| Staff lista lekérése | Lekérem a staff listát a rendszerből | A staff lista visszatér | A backend automata teszt alapján sikeres | pass |
| Slot lista lekérése | Lekérem a slot listát a rendszerből | A slot lista visszatér | A backend automata teszt alapján sikeres | pass |
| Staff létrehozása jogosultság nélkül | Jogosulatlan felhasználóként staff létrehozást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |
| Slot módosítása jogosultság nélkül | Jogosulatlan felhasználóként slot módosítást indítok | A rendszer elutasítja a kérést | Az automatizált teszt 403 választ kapott, ami a jelenlegi jogosultsági logikával összhangban van | pass |
| Asztali nézet ellenőrzése | Asztali böngészőnézetben végigmegyek a fő felhasználói oldalakon | A navigáció és az űrlapok megfelelően jelennek meg | Részletes manuális ellenőrzés még nem történt meg | fail |
| Mobil nézet ellenőrzése | Mobil nézetre váltok a böngészőben és megnyitom a fő oldalakat | A fő elemek kezelhetők maradnak kisebb felbontáson is | Részletes manuális ellenőrzés még nem történt meg | fail |
| Stresszteszt sok adatkéréssel | Rövid idő alatt többször kérem le a staff és slot listát | A rendszer stabil választ ad és nem omlik össze | Külön terheléses mérés még nem történt meg | fail |
| Stresszteszt ismételt hibás beküldéssel | Többször küldök hiányos vagy hibás adatokat az űrlapokról | A rendszer hibát jelez, de stabil marad | Külön terheléses mérés még nem történt meg | fail |

## Megjegyzések

- A `pass` státusz azt jelzi, hogy a teszt eredménye megfelelő, a vizsgált működés rendben van.
- A `fail` státusz jelen esetben főként az elavult automatizált tesztekre utal, nem feltétlenül a backend vagy frontend üzleti logika hibájára.
- A dokumentum a statikus, dinamikus és stresszteszt szempontokat is rögzíti, de több manuális és terheléses ellenőrzés még további gyakorlati futtatást igényel.