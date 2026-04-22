# USER DOCUMENTATION - API SERVICE

## 1. INSTALLATION - Install dependencies

All dependencies must be installed before starting the application:

```cmd
npm install
```

Or use your favorite package manager.

## 2. CONFIGURATION (.ENV) - Generate config file

Environment settings are managed through .env files.

* **Main config:** `node op conf:generate` -> creates `.env`
* **Test config:** `node op testconf:generate` -> creates `.env.test`
* **App Key:** `node op key:generate` -> generates `APP_KEY`

### Test configurations file generate

Generate the test environment file (.env.test):
```cmd
node op testconf:generate
```

Result: .env.test file.

## App key generation

Generate the Application Security Key (APP_KEY):

```cmd
node op key:generate
```

## 3. DATABASE MANAGEMENT 

### Migrations & Setup

* **Run all migrations:** `node op migrate`
* **Rollback last:** `node op migrate:rollback`
* **Reset database:** `node op migrate:reset`
* **Fresh install:** `node op migrate:fresh`

### Seeders & Admin (Data population):
* Generate Admin user:      > node op admin:generate
* Populate test data:       > node op db:seed


## 4. API ENDPOINTS 

All endpoints are prefixed with `/api`.

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | POST | no | Create new user account |
| `/auth/login` | POST | no | User login & Token generation |
| `/profile/me` | GET | yes | Get own profile data |
| `/staff` | GET | no | List all medical staff |
| `/staff` | POST | Admin | Add new staff member |
| `/consultations`| GET | no | List all available treatments |
| `/bookings` | POST | yes | Book an appointment |
| `/users` | GET | Admin | List all users |
| `/users/:id` | DELETE| Admin | Delete a user |

### Payload Examples
**Login/Register:**
```json
{
    "name": "Dr.Kovács Antal",
    "email": "dr.kovacs@example.com",
    "password": "doctor123",
    "password_confirmation": "doctor123"
}
```
## The login endpoint

```json
{
    "email": "dr.kovacs@example.com",
    "password": "password123"
}
```

You receive the Bearear token with accessToken key.

## The users endpoint

To query users or user, send the bearer token to endpoint.

## 5. DATA IMPORT

Import data from JSON or CSV files. The last parameter is the separator.
```cmd
node op db:import thing things.json
node op db:import thing things.csv
node op db:import thing things.csv ,
node op db:import thing things.csv ";"
node op db:import thing things.csv :
```

For example JSON file:

employees.json:

```json
[
    { "id": 1, "name": "Tom Miller" },
    { "id": 2, "name": "Jack Smith" }
]
```

The default separator is comma.

```cmd
node op db:import staff staffs.json
```

For example CSV file:

staffs.csv:

```csv
id,name
1,Tom Miller
2,Jack Smith
```

If you have colon separator, use sep parameter.

```csv
id:name
1:Jack Smith
2:Tom Miller
```

```cmd
node op db:import staff staffs.csv --sep :
```

If the file has semicolon separator, use sep parameter, for example:

```csv
id;name
1;Tom Miller
2;Jack Smith
```

Use next command:

```cmd
node op db:import staff staffs.csv --sep ";"
```

## 6. DEVELOPMENT TOOLS  
### Model and Controller Generation
Use the following instructions to generate models and controllers:

```cmd
node op make:model [name]
node op make:controller [name]
```


## Database

### Database synchronization

Models and database tables can be synchronized.

Database synchronization can be set up in the app/models/modrels.js file. 

* **Safe Update:** `{ alter: true }`
  - Updates the structure but keeps your data.
* **Hard Reset:** `{ force: true }`
  - WARNING: Deletes all data and recreates tables!
* **Disabled:** `false`
  - No automatic synchronization.

Default values are:

```js
{ alter: true }
```

This preserves the data and existing structure.

Possible values:

```js
{ force: true }
```

If the value is false, there is no synchronization in either case.

## 7. MIGRATIONS
### Generate and Run
Generate a new migration file:
```cmd
node op make/migration staff


### Migration example for staff table:

```cmd
node op make/migration staff
```

```javascript
import { DataTypes } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('employees', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING
    },
    city: {
      type: DataTypes.STRING
    },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE }
  });
}

async function down({context: QueryInterface}) {
  await QueryInterface.dropTable('staff');
}

export { up, down }
```

Run all migration:

```bash
node op migration:run
node op migrate
```

Run a migration:

```bash
node op migration:run <migration_name>
node op migrate <migration_name>
```

Rollback the last migration:

```bash
node op migration:rollback
node op migrate:rollback
```

Rollback two migrations:

```bash
node op migration:rollback 2
node op migrate:rollback 2
```

Reset the database:

```bash
node op migration:reset
node op migrate:reset
```

This command also undoes seeder operations.

Reset the database and run all migrations:

```bash
node op migration:fresh
node op migrate:fresh
```

### Database seeding

Generate and Run a seeder:

```bash
node op make/seeder ...
```

Seeder example for staff table:

```bash
node op make/seeder staff
```

```javascript

async function up({context: QueryInterface}) {
  if(db.Employee) {
    await db.Employee.bulkCreate([
      { id: 1, name: "John Smith" },
      { id: 2, name: "Alice Johnson" }
    ]);
  }else {
    const now = new Date()
    await QueryInterface.bulkInsert('things', [
      { 
        id: 1, name: "John Smith", 
        createdAt: now, updatedAt: now
      },
      { 
        id: 2, name: "Alice Johnson", 
        createdAt: now, updatedAt: now
      }
    ]);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('things', null, {});
}

export { up, down }
````

Run all seeders:

```bash
node op db:seed
```

Run a seeder:

```bash
node op db:seed path_...
```
