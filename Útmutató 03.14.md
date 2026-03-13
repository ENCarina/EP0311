# Útmutató 03.14

Ez az útmutató a **most ellenőrzötten működő** nulláról telepítési/futtatási lépéseket tartalmazza ehhez a projekthez.

## 0) Előfeltételek

- Node.js 20+ (itt 22.12.0-val is működött) (ha nincs, akkor letöltés a node hivatalos oldaláról és telepítés)
- npm
- Windows PowerShell (jó a cmd is)

## 1) Projekt klónozás

```powershell
git clone https://github.com/ENCarina/EP0311.git
cd EP0311
```

## 1/b) Átváltás a telepítési útmutató branchre

Megjegyzés: a `git clone` alapból a default branch-et húzza le (jelenleg ez a `master`).
Ezután válts át a telepítési útmutató branchre:

```powershell
git fetch origin
git switch --track origin/telepitesi-utmutato-v2
```

Ha a branch már létezik lokálisan:

```powershell
git switch telepitesi-utmutato-v2
```

## 2) Backend függőségek telepítése

```powershell
cd EPApi
npm install
```

## 3) Backend `.env` létrehozása

Hozd létre az `EPApi/.env` fájlt ezzel a tartalommal:

APP_PORT=8000
APP_KEY=local-dev-key
APP_LOG=false

DB_DIALECT=sqlite
DB_HOST=127.0.0.1
DB_NAME=epapi
DB_USER=
DB_PASS=
DB_STORAGE=database.sqlite

## 4) Frontend függőségek telepítése

```powershell
cd ..\epweb
npm install
npm install bootstrap
```

## 5) Frontend indítása

```powershell
npm start
```

Elérési cím:
- http://localhost:4200

## 6) Demo adatok feltöltése (nulláról, biztosan működő mód)

Nyiss egy **új** PowerShellt, és futtasd:

```powershell
cd EPApi
node database/seeders/07_seed_demo_v2.js
```

Ez a v2 seed fájl:
- újraépíti az adatbázist (`sync force`) 
- feltölti a user/staff/consultation/slot demo adatokat
- a végén kiírja a létrehozott rekordszámokat

## 7) Backend indítása

```powershell
npm run dev
```

Backend cím:
- http://localhost:8000

Gyors ellenőrzés:
- http://localhost:8000/api/staff

## 8) Teszt belépési adatok

Normál user:
- `user@ep.com` / `test1243`
- `elitport@freemail.hu` / `test987`

Orvosok:
- `dr.kovacs@ep.com` / `doctor123`
- `dr.toth@ep.com` / `doctor123`
- `dr.house@ep.com` / `doctor123`

Admin:
- `admin@ep.com` / `joyEtna`

## 9) Gyors hibakezelés

- Ha a backend nem indul és `EADDRINUSE 8000` hiba van: már fut egy példány.
- Ha login után nincs időpont: futtasd újra a 6. lépést (demo feltöltés).
- Ha frontend build hiba: ellenőrizd, hogy a 4. lépésben a `bootstrap` telepítve van.
