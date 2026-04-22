# expressapi - Fejlesztői Dokumentáció

## 🛠 Technológiai Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **ORM:** Sequelize (MySQL / MariaDB csatlakozás is megoldható)
* **Adatbázis:** SQLite (Fájl alapú: `database.sqlite`)
* **Auth:** JSON Web Token (JWT) + Bcrypt a jelszavak titkosításához
* **Logging:** Morgan (HTTP kérésekhez) & Custom Logger (access.log)

## 🗄 Adatbázis Kezelés (Migrations & Seeders)
A projekt egy egyedi operátor eszközt (`op.js`) használ az adatbázis kezelésére.Mivel SQLite-ot használunk, a táblák és az adatok közvetlenül a `database.sqlite` fájlba kerülnek.

### 1. Migrációk (Migrations)
A migrációs fájlok definiálják a táblák szerkezetét. Új telepítéskor vagy szerkezetmódosításkor futtatandó:
1. **Migrációk futtatása:** Létrehozza a táblákat az adatbázis fájlban.
```cmd
node op migrate

```
### 2. Adatok feltöltése (Seeding)
Feltölti a rendszert tesztadatokkal (Admin, szakemberek, vizsgálatok).

```cmd
node op db:seed

```
## 🔑 API KEY & Biztonság
A `generate-api-key` csomaggal létrehozott `APP_KEY` az `.env` fájlban tárolódik. 
Ez a kulcs kritikus a JWT tokenek aláírásához. Soha ne töltsd fel ezt a kulcsot publikus verziókezelőbe!

## 📁 Projekt Felépítés - Mappaszerkezet (Project Structure)
* `/database`: Tartalmazza a database.js konfigurációt és a database.sqlite fájlt.Adatbázis kapcsolat és Sequelize konfiguráció.
* `/models`: A Sequelize modellek, amelyek leképezik a SQLite táblákat. Az adatbázis táblák leképezése (Booking, Consultation, Role, Slot, Staff, User).
* `/routes`: Az API végpontok fájljai (api.js).
* `/controllers`: Az üzleti logika (pl. foglalások kezelése, szakemberek szűrése).A végpontok logikáját megvalósító függvények.
* `/routes`: Az Express útvonalválasztója (`api.js`).
* `/middleware`: `verifyToken` (JWT ellenőrzés) és `checkRole` (jogosultságkezelés). Auth és Role ellenőrző rétegek.
* `/utils`: Segédfüggvények (Logger, Path-kezelők).
* `/services`: Segédfüggvények (BookingService, EmailService).

## 🗄 Adatbázis architektúra
Az alkalmazás relációs adatmodellt követ:
* **User - Staff:** Egy-az-egyhez kapcsolat. Nem minden User dolgozó, de minden dolgozó egy User.
* **Staff - Slot:** Egy-a-többhöz kapcsolat. Egy szakemberhez több szabad/foglalt időpont tartozik.
* **Booking:** Kapcsolótábla, amely összeköti a pácienst (User), a szolgáltatást (Consultation) és az időpontot (Slot).

## 🧪 Tesztelés
A tesztelés során a rendszer egy ideiglenes, memóriában futó SQLite adatbázist használ (`:memory:`).
Futtatás:
```cmd
npm test

```
A teszteléshez **Mocha**  könyvtárakat is használunk.
A tesztek elkülönített környezetben futnak, így nem módosítják a fejlesztői database.sqlite fájlt.

## 🚀 Fejlesztői környezet indítása
A projekt első futtatásához és a fejlesztői környezet beállításához kövesse az alábbi lépéseket:

* 1. **Függőségek telepítése:**
   ```cmd
   npm install

   ```
* 2. **Titkosító kulcs generálása:**
   ```cmd
    node op key:generate

   ```
* 3. **Adatbázis sémák létrehozása**
   ```cmd
   node op migrate

   ```
* 4. **Alapadatok feltöltése**
    ```cmd
   node op db:seed

   ```
* 5. **Szerver indítása**
   ```cmd
   npm run dev
   
   ```

## 🔐 BIZTONSÁG ÉS ADATVÉDELEM

* Jelszókezelés: Bcrypt (10-es salt).

* Munkamenet: Állapotmentes JWT hitelesítés.

* Jogosultságok: Middleware ellenőrzi (Páciens, Szakember, Admin).
