# EPort Telepítési Útmutató

Ez a workspace két külön projektet tartalmaz:

- `EPApi`: Node.js + Express backend SQLite adatbázissal
- `epweb`: Angular frontend

## Előfeltételek

- Node.js
- npm

Ajánlott verzióellenőrzés:

```bash
node -v
npm -v
```

## 1. Backend telepítése

Lépj be a backend mappájába:

```bash
cd EPApi
```

Telepítsd a backend függőségeit:

```bash
npm install
```

Ellenőrizd, hogy létezik a `.env` fájl. Ha nincs, hozz létre egyet az `.env.example` alapján.

Ezután hozd létre és seedeld az SQLite adatbázist:

```bash
npm run db:init
```

Indítsd el a backendet:

```bash
npm run dev
```

Alapértelmezett backend cím:

```text
http://localhost:8000
```

## 2. Frontend telepítése

Új terminálban lépj be a frontend mappájába:

```bash
cd epweb
```

Telepítsd a frontend függőségeit:

```bash
npm install
```

Indítsd el a fejlesztői szervert:

```bash
npm start
```

Alapértelmezett frontend cím:

```text
http://localhost:4200
```

## 3. Indítási sorrend

Ajánlott sorrend:

1. `EPApi` mappában `npm install`
2. `EPApi` mappában `npm run db:init`
3. `EPApi` mappában `npm run dev`
4. `epweb` mappában `npm install`
5. `epweb` mappában `npm start`

## 4. Hasznos megjegyzések

- Az adatbázis SQLite alapú, nem külön szolgáltatásként fut.
- Az adatbázis fájl alapértelmezett helye: `EPApi/database/data.sqlite`
- A frontend a backend API-t a `http://localhost:8000` címen várja.