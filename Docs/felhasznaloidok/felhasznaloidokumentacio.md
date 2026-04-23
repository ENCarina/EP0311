# Vizsgaremek felhasználói dokumentációja

## ElitPort: Magánklinikai digitális időpontfoglaló rendszer

### BZSH Külkereskedelmi Technikum



Dátum: 2026. április 23.

\newpage

# Bevezetés

Ez a dokumentum az Elit Port Klinika webalkalmazás felhasználói dokumentációja. Célja, hogy részletes, ugyanakkor jól követhető útmutatást adjon a rendszer mindennapi használatához. A leírás az alkalmazás fő funkcióit, a felhasználói szerepköröket, a gyakori műveleteket, valamint a hibakezeléshez szükséges gyakorlati lépéseket mutatja be.

A dokumentáció szakdolgozati jellegű szerkezetben készült, ezért a funkcionális ismertetés mellett röviden kitér az üzleti folyamatokra, az adatkezelési szempontokra és a felhasználói munkafolyamatok logikájára is. Ennek célja, hogy a rendszer ne csak technikailag, hanem működési szemléletben is érthető legyen.

A dokumentum célközönsége:
- páciensek,
- adminisztrátorok,
- rendelői munkatársak,
- valamint a rendszert átvevő és üzemeltető személyek.

A dokumentációban szereplő képernyők és menüpontok megnevezései a rendszer jelenlegi verziójához tartoznak. A későbbi verziófrissítések során kisebb eltérések előfordulhatnak.

\newpage

# Tartalomjegyzék

1. [A rendszer célja és áttekintése](#1-a-rendszer-célja-és-áttekintése)
2. [Felhasználói szerepkörök](#2-felhasználói-szerepkörök)
3. [Bejelentkezés és fiókkezelés](#3-bejelentkezés-és-fiókkezelés)
4. [Időpontfoglalási folyamat](#4-időpontfoglalási-folyamat)
5. [Saját foglalások kezelése](#5-saját-foglalások-kezelése)
6. [Adminisztrációs funkciók](#6-adminisztrációs-funkciók)
7. [Hibaelhárítás és gyakori kérdések](#7-hibaelhárítás-és-gyakori-kérdések)
8. [Adatvédelem és biztonság](#8-adatvédelem-és-biztonság)
9. [Üzemeltetési és támogatási információk](#9-üzemeltetési-és-támogatási-információk)
10. [Összefoglalás](#10-összefoglalás)

\newpage

# 1. A rendszer célja és áttekintése

Az Elit Port Klinika webalkalmazás célja az időpontfoglalási és adminisztrációs folyamatok digitalizálása. A rendszer segítségével a páciensek önállóan tudnak regisztrálni, időpontot foglalni, valamint nyomon követni korábbi és aktuális foglalásaikat. A rendelő személyzete és az adminisztrátorok a háttérfelületen kezelni tudják az elérhető szolgáltatásokat, idősávokat és felhasználói adatokat.

A rendszer fő előnyei:
- gyors online ügyintézés,
- átlátható foglalási folyamat,
- naprakész időpontkínálat,
- központi adminisztráció,
- csökkentett manuális hibalehetőség.

# 2. Felhasználói szerepkörök

A rendszer több szerepkört kezel, amelyek eltérő jogosultsággal rendelkeznek.

## 2.1 Páciens

A páciens jogosultságai:
- regisztráció és bejelentkezés,
- időpontfoglalás elérhető konzultációra,
- saját foglalások megtekintése,
- saját foglalás lemondása,
- jelszó-visszaállítás.

## 2.2 Adminisztrátor

Az adminisztrátor jogosultságai:
- felhasználók listázása és kezelése,
- munkatársak kezelése,
- konzultációtípusok kezelése,
- idősávok kezelése,
- foglalások áttekintése és felügyelete.

## 2.3 Személyzet

A személyzet szerepkör a klinikai folyamatok támogatására szolgál. A pontos jogosultságok intézményi beállítástól függhetnek, de jellemzően ide tartozik a naptárkezelés és a foglalási állapotok követése.

# 3. Bejelentkezés és fiókkezelés

## 3.1 Regisztráció

1. Nyissa meg a webalkalmazást.
2. Válassza a Regisztráció menüpontot.
3. Adja meg a kötelező adatokat (név, e-mail-cím, jelszó).
4. Küldje el az űrlapot.
5. Sikeres regisztráció után jelentkezzen be.

## 3.2 Bejelentkezés

1. Nyissa meg a Bejelentkezés oldalt.
2. Adja meg e-mail-címét és jelszavát.
3. Kattintson a bejelentkezés gombra.

Hibás adatok esetén a rendszer figyelmeztetést küld, és a belépés nem történik meg.

## 3.3 Elfelejtett jelszó

1. Válassza az Elfelejtett jelszó opciót.
2. Adja meg a regisztrált e-mail-címet.
3. A rendszer jelszó-visszaállító hivatkozást küld.
4. A hivatkozáson keresztül adjon meg új jelszót.

# 4. Időpontfoglalási folyamat

## 4.1 Konzultáció kiválasztása

A páciens a konzultációk listájából kiválaszthatja a számára megfelelő szolgáltatást. A lista tartalmazza a konzultáció nevét és rövid leírását.

## 4.2 Idősáv kiválasztása

A rendszer csak a szabad idősávokat jeleníti meg. A foglalás csak akkor véglegesíthető, ha az adott idősáv még elérhető.

## 4.3 Foglalás véglegesítése

1. Ellenőrizze a kiválasztott konzultációt és időpontot.
2. Erősítse meg a foglalást.
3. Sikeres rögzítés után a rendszer visszaigazolást jelenít meg.

# 5. Saját foglalások kezelése

A Saját foglalások oldalon a páciens áttekintheti:
- jövőbeli időpontjait,
- korábbi foglalásait,
- valamint a foglalások állapotát.

## 5.1 Foglalás lemondása

1. Nyissa meg a Saját foglalások felületet.
2. Válassza ki a lemondani kívánt időpontot.
3. Erősítse meg a lemondást.

A lemondás után a felszabadult idősáv újra foglalhatóvá válik.

# 6. Adminisztrációs funkciók

## 6.1 Felhasználókezelés

Az adminisztrátor megtekintheti a felhasználók listáját, és szükség esetén módosíthatja az adatokat vagy jogosultságokat.

## 6.2 Munkatársak és konzultációk kezelése

Az adminisztrációs felület támogatja:
- új munkatárs felvételét,
- konzultáció típusok létrehozását,
- meglévő elemek módosítását és archiválását.

## 6.3 Idősávok kezelése

Az adminisztrátor állítja be a foglalható idősávokat. A jól konfigurált idősávstruktúra csökkenti az ütközések és túlterhelések esélyét.

# 7. Hibaelhárítás és gyakori kérdések

## 7.1 Nem tudok bejelentkezni

Lehetséges okok:
- hibás e-mail-cím vagy jelszó,
- nem aktivált fiók,
- átmeneti hálózati hiba.

Javaslat:
- ellenőrizze a megadott adatokat,
- használja a jelszó-visszaállítást,
- próbálja meg később újra.

## 7.2 Nem jelenik meg foglalható időpont

Lehetséges okok:
- nincs szabad idősáv a kiválasztott időszakban,
- adminisztrációs karbantartás,
- átmeneti szinkronizációs hiba.

Javaslat:
- válasszon másik dátumot,
- frissítse az oldalt,
- jelezze a problémát az üzemeltető felé.

## 7.3 Nem érkezett meg a visszaállító e-mail

Lehetséges okok:
- spam mappába került,
- hibásan megadott e-mail-cím,
- levelezési szolgáltató késleltetése.

Javaslat:
- ellenőrizze a spam mappát,
- küldje újra az igényt,
- ellenőrizze a regisztrált e-mail-címet.

# 8. Adatvédelem és biztonság

A rendszer a felhasználói adatokat kizárólag a szolgáltatás működtetéséhez szükséges mértékben kezeli. A belépési adatok védelme, a jogosultságkezelés és a naplózás hozzájárul a biztonságos működéshez.

Felhasználói ajánlások:
- használjon erős, egyedi jelszót,
- ne ossza meg jelszavát másokkal,
- nyilvános gépen mindig jelentkezzen ki.

# 9. Üzemeltetési és támogatási információk

Rendszerhiba vagy rendellenes működés esetén a felhasználó az üzemeltetői kapcsolati csatornán jelezheti a problémát. Hibajegy küldésekor célszerű megadni:
- a hiba időpontját,
- a használt funkciót,
- a kapott hibaüzenetet,
- lehetőség szerint képernyőképet.

Ezek az adatok lerövidítik a hibafeltárás és javítás idejét.

# 10. Összefoglalás

Az Elit Port Klinika webalkalmazás felhasználói felülete az időpontfoglalási folyamat egyszerűsítését szolgálja. A rendszer szerepkör-alapú működése biztosítja, hogy a páciensek és az adminisztráció eltérő, de egymást kiegészítő feladatokat hatékonyan tudjanak elvégezni.

A dokumentáció célja, hogy önállóan használható, átlátható útmutatót adjon a napi munkavégzéshez, és egyben támogassa a rendszer átadását, oktatását és hosszú távú fenntartható használatát.
