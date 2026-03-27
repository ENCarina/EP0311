# API Endpoints

Every endpoint below is mounted under the `/api` prefix.

## Auth

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/register` | POST | no | public | Register a new patient account |
| `/login` | POST | no | public | Login with email and password |
| `/verify-email/:token` | GET | no | public | Verify email address |

## Profile

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/profile/me` | GET | yes | any | Get current user's profile |
| `/profile/update` | PUT | yes | any | Update current user's name or email |

## Users

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/users` | GET | yes | admin | List all users |
| `/patients` | GET | yes | doctor or admin | List active patients |
| `/users/:id` | GET | yes | any authenticated | Get one user |
| `/users/:id/password` | POST | yes | admin | Change a user's password |
| `/users/:id/status` | POST | yes | admin | Toggle a user's active status |
| `/users/:id` | PUT | yes | admin | Update name, email or role |
| `/users/:id` | DELETE | yes | admin | Archive related staff profile |

## Staff

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/staff` | GET | no | public | List staff profiles |
| `/staff/public` | GET | no | public | List active public staff profiles |
| `/staff/:id` | GET | no | public | Get one staff profile |
| `/staff` | POST | yes | admin | Direct creation is intentionally blocked |
| `/staff/:id` | PUT | yes | admin | Update staff profile |
| `/staff/:id` | DELETE | yes | admin | Delete staff profile |
| `/staff/promote` | POST | yes | admin | Promote an existing user to staff |
| `/staff/:id/treatments` | GET | no | public | List treatments assigned to a staff member |
| `/staff/:id/treatments` | POST | yes | admin | Replace assigned treatments |

### Staff promote example

```json
{
    "userId": 12,
    "specialty": "Fogorvos",
    "treatmentIds": [1, 2, 3]
}
```

## Consultations

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/consultations` | GET | no | public | List consultations |
| `/consultations/:id` | GET | no | public | Get one consultation |
| `/consultations` | POST | yes | admin | Create consultation |
| `/consultations/:id` | PUT | yes | admin | Update consultation |
| `/consultations/:id` | DELETE | yes | admin | Delete consultation |

`GET /consultations` supports `?specialty=...` filtering.

### Consultation example

```json
{
    "name": "Kardiológiai szakvizsgálat",
    "description": "Teljes körű szív- és érrendszeri állapotfelmérés",
    "specialty": "Kardiológia",
    "duration": 30,
    "price": 25000
}
```

## Slots

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/slots` | GET | no | public | List available future slots |
| `/slots/:id` | GET | yes | any | Get one slot |
| `/slots` | POST | yes | doctor or admin | Create a slot |
| `/slots/:id` | PUT | yes | any | Update a slot |
| `/slots/:id` | DELETE | yes | any | Delete a slot |

Supported query parameters for `/slots`:

- `staffId`
- `consultationId`
- `date`

### Slot example

```json
{
    "date": "2026-04-10",
    "staffId": 3,
    "consultationId": 5,
    "startTime": "08:00:00",
    "endTime": "08:30:00",
    "isAvailable": true
}
```

## Bookings

| Endpoint | Method | Auth | Role | Description |
| - | - | - | - | - |
| `/bookings` | GET | yes | any | List bookings visible to current user |
| `/bookings/:id` | GET | yes | any | Get one booking |
| `/bookings` | POST | yes | any | Create booking |
| `/bookings/:id` | PUT | yes | any | Update booking |
| `/bookings/:id` | DELETE | yes | any | Cancel or delete booking |

### Booking example

```json
{
    "slotId": 10,
    "staffId": 3,
    "consultationId": 5,
    "duration": 30,
    "status": "Confirmed"
}
```

Notes:

- patients see their own bookings
- doctors see bookings assigned to their staff record
- admins see every booking
- admin delete also frees the related slot
- non-admin cancellation can be blocked inside 24 hours


