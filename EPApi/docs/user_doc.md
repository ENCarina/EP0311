# User Documentation

## Installation

Install dependencies before starting the API.

```cmd
npm install
```

## Environment

The application reads its settings from a `.env` file.

1. Duplicate or rename `.env.example` to `.env`.
2. Review at least these values before running the API:

- `APP_KEY`
- `EMAIL_USER`
- `EMAIL_PASS`
- `DB_STORAGE`

The test suite uses `.env.test`.

## Running the API

Development mode:

```cmd
npm run dev
```

Tests:

```cmd
npm test
```

Database reset and seeding:

```cmd
npm run db:reset
```

## Authentication

Every API endpoint is mounted under the `/api` prefix.

Protected endpoints expect a bearer token in the `Authorization` header.

```http
Authorization: Bearer <token>
```

Role model used by the backend:

- `0`: patient
- `1`: doctor or staff
- `2`: admin

The authorization middleware allows access when `user.roleId >= requiredRole`.

## Auth endpoints

### Register

`POST /api/register`

```json
{
  "name": "Teszt Elek",
  "email": "teszt@example.com",
  "password": "secret123",
  "confirmPassword": "secret123"
}
```

Notes:

- all four fields are required
- the email must be unique
- new users are created with patient role
- email verification is supported through `GET /api/verify-email/:token`

### Login

`POST /api/login`

```json
{
  "email": "teszt@example.com",
  "password": "secret123"
}
```

Successful login returns a JWT token and the basic user object.

## Profile endpoints

### Get my profile

`GET /api/profile/me`

Returns the authenticated user's profile, role, bookings and optional staff profile.

### Update my profile

`PUT /api/profile/update`

```json
{
  "name": "Új Név",
  "email": "uj@example.com"
}
```

Both fields are optional.

## User management

### List users

`GET /api/users`

Admin only.

### List patients

`GET /api/patients`

Doctor or admin only.

### Get user by id

`GET /api/users/:id`

Requires authentication.

### Update user password

`POST /api/users/:id/password`

```json
{
  "password": "newSecret123"
}
```

Admin only.

### Update user status

`POST /api/users/:id/status`

```json
{
  "isActive": false
}
```

Admin only.

### Update user

`PUT /api/users/:id`

```json
{
  "name": "Minta Név",
  "email": "minta@example.com",
  "roleId": 1
}
```

Admin only.

### Delete user

`DELETE /api/users/:id`

Admin only. The current implementation archives the related staff profile instead of deleting the user record.

## Staff management

### Public endpoints

- `GET /api/staff`
- `GET /api/staff/public`
- `GET /api/staff/:id`
- `GET /api/staff/:id/treatments`

### Promote a user to staff

`POST /api/staff/promote`

```json
{
  "userId": 12,
  "specialty": "Fogorvos",
  "treatmentIds": [1, 2, 3]
}
```

Admin only.

Notes:

- `userId` and `specialty` are required
- `treatmentIds` is optional
- if `treatmentIds` is omitted, treatments are assigned from the staff specialty
- future slots can be auto-generated for the promoted staff member

### Direct staff creation

`POST /api/staff`

This endpoint currently returns an error by design. Staff records are expected to be created through `/api/staff/promote`.

### Update staff profile

`PUT /api/staff/:id`

Possible fields include `specialty`, `bio`, `isActive`, `isAvailable`, `imageUrl`.

### Delete staff profile

`DELETE /api/staff/:id`

Deletes the staff profile.

### Update staff treatments

`POST /api/staff/:id/treatments`

```json
{
  "treatmentIds": [1, 2, 3]
}
```

Admin only.

## Consultations

### Public endpoints

- `GET /api/consultations`
- `GET /api/consultations/:id`

`GET /api/consultations` supports optional filtering with `?specialty=...`.

### Create consultation

`POST /api/consultations`

```json
{
  "name": "Kardiológiai szakvizsgálat",
  "description": "Teljes körű állapotfelmérés",
  "specialty": "Kardiológia",
  "duration": 30,
  "price": 25000
}
```

Admin only.

### Update consultation

`PUT /api/consultations/:id`

Any subset of the consultation fields can be sent.

### Delete consultation

`DELETE /api/consultations/:id`

Admin only.

## Slots

### Public listing

`GET /api/slots`

Supported query parameters:

- `staffId`
- `consultationId`
- `date`

Only future and available slots are returned.

### Get slot by id

`GET /api/slots/:id`

Requires authentication.

### Create slot

`POST /api/slots`

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

Doctor or admin only.

Notes:

- non-admin users can manage only their own calendar
- past dates are rejected

### Update slot

`PUT /api/slots/:id`

Requires authentication.

### Delete slot

`DELETE /api/slots/:id`

Requires authentication.

## Bookings

### List bookings

`GET /api/bookings`

Requires authentication.

Returned data depends on the current user's role:

- patient: own bookings
- doctor: bookings assigned to the doctor's staff profile
- admin: all bookings

### Get booking by id

`GET /api/bookings/:id`

Requires authentication.

### Create booking

`POST /api/bookings`

```json
{
  "slotId": 10,
  "staffId": 3,
  "consultationId": 5,
  "duration": 30,
  "status": "Confirmed"
}
```

Requires authentication.

The backend fills the patient from the logged-in user.

### Update booking

`PUT /api/bookings/:id`

Requires authentication.

### Cancel or delete booking

`DELETE /api/bookings/:id`

Requires authentication.

Notes:

- admins delete the booking and release the related slot
- non-admin users go through the cancellation logic
- cancellation inside 24 hours is rejected