# EPort Telepítési Útmutató

Ez a workspace két fő projektet tartalmaz:

- `EPApi`: Node.js + Express backend SQLite adatbázissal
- `epweb`: Angular frontend

## Előfeltételek

- Node.js 20+ ajánlott
- npm

Verzióellenőrzés:

```cmd
node -v
npm -v
```

## 1. Backend telepítése

Lépj be a backend mappájába:

```cmd
cd EPApi
```

Telepítsd a függőségeket:

```cmd
npm install
```

Hozd létre a környezeti változókat tartalmazó fájlt az `.env.example` alapján:

```cmd
copy .env.example .env
```

Minimum ajánlott beállítások a `.env` fájlban:

```env
APP_PORT=8000
APP_KEY=valamilyen_hosszu_titkos_kulcs
APP_URL=http://localhost:4200
FRONTEND_URL=http://localhost:4200
```

Megjegyzés:

- Az email küldéshez `EMAIL_USER`, `EMAIL_PASS` és kapcsolódó SMTP beállítások is szükségesek.
- Ezek nélkül is elindul a rendszer, de az emailes funkciók nem fognak működni teljesen.

Adatbázis létrehozása és seedelése:

```cmd
npm run db:init
```

Ha teljesen tiszta adatbázist szeretnél újragenerálni:

```cmd
npm run db:reset
```

Backend indítása:

```cmd
npm run dev
```

Alapértelmezett backend cím:

```text
http://localhost:8000
```

## 2. Frontend telepítése

Új terminálban lépj be a frontend mappájába:

```cmd
cd epweb
```

Telepítsd a függőségeket:

```cmd
npm install
```

Frontend indítása fejlesztői módban:

```cmd
npm start
```

Alapértelmezett frontend cím:

```text
http://localhost:4200
```

## 3. Ajánlott indítási sorrend

1. `EPApi` mappában `npm install`
2. `EPApi` mappában `.env` létrehozása az `.env.example` alapján
3. `EPApi` mappában `npm run db:init`
4. `EPApi` mappában `npm run dev`
5. `epweb` mappában `npm install`
6. `epweb` mappában `npm start`

## 4. Hasznos parancsok

Backend tesztek:

```cmd
cd EPApi
npm test
```

Frontend build:

```cmd
cd epweb
npm run build
```

## 5. Hasznos megjegyzések

- Az SQLite adatbázis fájl helye: `EPApi/database/data.sqlite`
- A backend a `8000`-es porton indul, ha az `APP_PORT` nincs felülírva.
- A frontend a backend API-t alapértelmezetten a `http://localhost:8000` címen éri el.
- A seedelt adatok tartalmaznak admin, páciens és orvos felhasználókat is.

## 6. Seedelt belépési adatok

Jellemző teszt felhasználók:

- Admin: `admin@ep.com` / `joyEtna`
- Orvosok: például `dr.toth@ep.com` / `doctor123`
- Páciensek: például `user@ep.com` / `test987`

Ha email-visszaigazolás kell a saját regisztrált userhez, az seedelt tesztfiókok már verifikált állapotban jönnek létre.