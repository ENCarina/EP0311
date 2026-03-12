# Végpontok _ EndPoints

## staffs - Személyzet - Dolgozók

| Végpont | Metódus | Auth | CRUD | Leírás |
| - | - | - | - | - |
|/staffs | GET | igen | read | Személyzet lekérése|
|/staffs | POST | igen | create | Új személy felvétele|
|/staffs/: id | PUT | igen | update | Személyzet frissítése|
|/staffs/: id | DELETE | igen | delete | Személy/dolgozó törlése|

### Személyzet lekérdezése 

* /api/staffs GET

### Új Személy felvétele 

* /api/staffs POST

```json

{
    
	"userId":"102",
	"role":"doctor",
	"specialty":"fogorvos",
    "isAvailable":"true",
    "bio":"15 éves nemzetközi tapasztalattal rendelkező...",
    "imageUrl":"https://example.com/images/dr_toth.jpg",

}
```

### Személyzet frissítése 

* /api/staffs/5 PUT

```json
{
	"specialty": "szakterület", 
	"bio": "szakmai tapasztalat", 
	"role": "Assistens"
}
```
### Személy törlése 

* /api/staffs/4 DELETE

## consultations - Vizsgálat

| Végpont | Metódus | Auth | CRUD | Leírás |
| - | - | - | - | - |
|/consultations | GET | igen | read | Vizsgálat lekérése|
|/consultations | POST | igen | create | Új vizsgálatfelvétele|
|/consultations/: id | PUT | igen | update | Vizsgálat frissítése|
|/consultations/: id | DELETE | igen | delete | Vizsgálat törlése|

### Vizsgálat lekérdezése 

* /api/consultations GET

### Új Vizsgálat felvétele 

* /api/consultations POST

```json
{
    "name": "Kardiológiai szakvizsgálat",
    "description": "Teljes körű szív- és érrendszeri állapotfelmérés",
    "specialty": "Kardiológia",
    "duration":" 30",
    "price":"25000"
}
```

### Vizsgálat frissítése 

* /api/consultations/5 PUT

```json
 {
      "name": "Fogászati kontroll",
      "description": "Általános állapotfelmérés és tanácsadás",
      "specialty": "Fogászat",
      "duration": 20,
      "price": 15000.00
    }
```

### Vizsgálat törlése 

* /api/consultations/7 DELETE


