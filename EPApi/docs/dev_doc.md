# expressapi

## API KEY

The app key generated with generate-api-key package.

## Testing

Run tests:

```cmd
npm test
```

The test using the .env.test file and run in the memory database.

Tests can be placed in the test directory, where Mocha runs them.

## Development

Start the application:

```cmd
npm run dev
```

Restarting the application when saving is done by nodemon.

## Migrations and seeders

The project uses umzug for migrations and seeders.

1. User: Authentication & Roles (Admin, Staff, Doctor, Patient).

2. Profile: The public-facing "Card" data for Doctors.

3. Slot: The time availability.

4. Booking: The actual appointment record.

5. Consultation: CRUD 

6. Review: Patient feedback.