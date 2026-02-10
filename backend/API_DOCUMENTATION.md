# Travel Booking System – Backend API Documentation

Base URL: `http://<your-server>:5000/api`

All authenticated requests must include a token in the header:

- Preferred: `Authorization: Bearer <token>`  
- Also accepted: `Authorization: <token>`

Tokens are obtained from `POST /auth/login`.

---

## 0. Apps & roles overview

You will typically have **three clients**:

- **Admin Web (React / Web)** – manages users, vehicles, bookings, dashboard.
- **Driver App (React Native)** – driver login, register vehicle, see/accept trips, start/finish trips.
- **User App (React Native)** – user signup, see vehicles, create & manage bookings.

### 0.1 Quick API index (by app)

**Shared Auth (all apps)**
- `POST /auth/register` – Register user/driver account.
- `POST /auth/login` – Login and get JWT token.

**Driver App (role = "driver")**
- `POST /vehicles` – Add/register vehicle (licence, image, per‑km rate).
- `GET /vehicles/my` – List my vehicles.
- `GET /bookings/driver` – List bookings for my vehicles.
- `PUT /bookings/:id/confirm-driver` – Accept booking.
- `PUT /bookings/:id/start` – Start trip.
- `PUT /bookings/:id/complete` – Complete trip.

**User App (role = "user")**
- `GET /vehicles/available` – List available vehicles (optionally by type).
- `GET /vehicles/nearby` – Same as available; can filter by type.
- `POST /bookings` – Create booking (with or without selected vehicle).
- `GET /bookings/my` – My bookings.
- `PUT /bookings/:id/confirm` – Choose vehicle for an existing requested booking.

**Admin Web (role = "admin")**
- `GET /admin/dashboard` – Dashboard stats.
- `GET /users` / `DELETE /users/:id` – Manage users.
- `GET /vehicles` / `PUT /vehicles/approve/:id` / `PUT /vehicles/reject/:id` / `DELETE /vehicles/:id` – Manage vehicles.
- `GET /bookings` / `GET /bookings/:id` / `PUT /bookings/:id` / `DELETE /bookings/:id` – Manage bookings.

The sections below describe each API in detail, with request/response formats that you can use directly from your React Native apps.

---

## 1. Auth (shared)

### 1.1 Register

- **Method / Path:** `POST /auth/register`
- **Auth:** No
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "phone": "+1234567890"
  }
  ```
  - `name` *(string, required)*
  - `email` *(string, required, unique)*
  - `password` *(string, required)*
  - `role` *(string, optional)*: `"user"` or `"driver"` (defaults to `"user"`).  
    `"admin"` is **not** allowed for self‑register; if sent, it is forced to `"user"`.
  - `phone` *(string, optional)*
- **Response:** user object **without** password.

### 1.2 Login

- **Method / Path:** `POST /auth/login`
- **Auth:** No
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "<jwt_token>",
    "user": {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "phone": "+1234567890"
    }
  }
  ```

---

## 2. Driver APIs (React Native Driver app)

Use token from login where `role = "driver"`.

### 2.1 Add vehicle (with licence / image upload)

- **Method / Path:** `POST /vehicles`
- **Auth:** Driver required (`Authorization` header)
- **Content-Type:** `multipart/form-data`
- **Fields (form-data):**
  - `name` *(string, required)* – vehicle name/model
  - `type` *(string, required)* – one of: `bike` | `car` | `van` | `minibus` | `bus_30` | `bus_50`
  - `numberPlate` *(string, required)* – vehicle registration
  - `pricePerKm` *(number, required)* – price per kilometer
  - `seats` *(number, optional)* – number of seats (default depends on type)
  - `licence` *(file, required)* – driver licence image/PDF
  - `image` *(file, optional)* – vehicle image
- **Behavior:**
  - `driver` is taken from the authenticated user (`req.user.id`).
  - `status` initially `"pending"`; admin must approve before it becomes available.
  - Uploaded files are stored under `/uploads` and URLs saved as `licenceUrl` / `image`.
- **Response:** created vehicle document.

### 2.2 Get my vehicles

- **Method / Path:** `GET /vehicles/my`
- **Auth:** Driver required
- **Response:** array of vehicles where `driver == currentUser`.

### 2.3 Get my bookings (for my vehicles)

- **Method / Path:** `GET /bookings/driver`
- **Auth:** Driver required
- **Description:** Returns bookings where the vehicle belongs to the current driver.
- **Response:** array of populated bookings (includes user and vehicle summaries).

### 2.4 Accept / confirm trip

- **Method / Path:** `PUT /bookings/:id/confirm-driver`
- **Auth:** Driver required
- **Body:** *(empty)*
- **Behavior:**
  - Only the driver who owns the vehicle can confirm.
  - Booking must currently have `status = "confirmed"`.
  - On success, status becomes `"driver_assigned"`.

### 2.5 Start trip

- **Method / Path:** `PUT /bookings/:id/start`
- **Auth:** Driver required
- **Body:** *(empty)*
- **Behavior:**
  - Only the driver who owns the vehicle can start.
  - Booking must have `status = "driver_assigned"`.
  - Status becomes `"trip_started"` and vehicle is marked `isAvailable = false`.

### 2.6 Complete trip

- **Method / Path:** `PUT /bookings/:id/complete`
- **Auth:** Driver required
- **Body:** *(empty)*
- **Behavior:**
  - Only the driver who owns the vehicle can complete.
  - Booking must have `status = "trip_started"`.
  - Status becomes `"completed"` and vehicle is marked `isAvailable = true`.

---

## 3. User APIs (React Native User app)

Use token from login where `role = "user"`.

### 3.1 Get available vehicles (for booking)

- **Method / Path:** `GET /vehicles/available`
- **Auth:** Not required (public listing), but booking requires user auth.
- **Query params (optional):**
  - `type`: `bike` | `car` | `van` | `minibus` | `bus_30` | `bus_50`
- **Behavior:** Returns vehicles with `status = "approved"` and `isAvailable = true`.
- **Response:** array of available vehicles (with driver basic info).

### 3.2 Get nearby vehicles (by type)

- **Method / Path:** `GET /vehicles/nearby`
- **Auth:** Not required
- **Query params (optional):**
  - `type`: same values as above
- **Behavior:** Same filter as `/vehicles/available`; `lat/lng` can be added in future.
- **Response:** array of available vehicles.

### 3.3 Create booking

- **Method / Path:** `POST /bookings`
- **Auth:** User required
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "pickupLocation": "123 Main St, City",
    "dropLocation": "456 Park Ave, City",
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "dropLat": 12.9352,
    "dropLng": 77.6245,
    "distanceKm": 15.5,
    "durationMinutes": 25,
    "vehicleType": "car",
    "vehicleId": "OPTIONAL_VEHICLE_ID",
    "totalPrice": 775,
    "scheduledDate": "2026-02-10T10:00:00Z"
  }
  ```
  - `pickupLocation`, `dropLocation` *(strings, required)*
  - `pickupLat`, `pickupLng`, `dropLat`, `dropLng` *(numbers, optional)*
  - `distanceKm`, `durationMinutes` *(numbers, required)*
  - `vehicleType` *(string, optional)* – desired type when no vehicle chosen yet
  - `vehicleId` *(string, optional)* – selected vehicle ID
  - `totalPrice` *(number, optional)* – if omitted and `vehicleId` is provided, backend calculates `distanceKm * vehicle.pricePerKm`
  - `scheduledDate` *(ISO string, optional)*
- **Status on create:**
  - If `vehicleId` is provided → `status = "confirmed"`.
  - If no `vehicleId` → `status = "requested"`.
- **Response:** created booking with populated `user` and `vehicle` (if any).

### 3.4 Get my bookings

- **Method / Path:** `GET /bookings/my`
- **Auth:** User required
- **Behavior:** Returns current user’s bookings, newest first.

### 3.5 Confirm booking (user selects vehicle for requested booking)

- **Method / Path:** `PUT /bookings/:id/confirm`
- **Auth:** User required
- **Content-Type:** `application/json`
- **Body:**
  ```json
  { "vehicleId": "<vehicle_id>" }
  ```
- **Behavior:**
  - Only the user who owns the booking can confirm.
  - Booking must have `status = "requested"`.
  - Vehicle must be approved and available.
  - Backend calculates `totalPrice = distanceKm * vehicle.pricePerKm` and sets `status = "confirmed"`.

---

## 4. Vehicle types

| type    | Description   |
|---------|---------------|
| bike    | Bike          |
| car     | Car           |
| van     | Van           |
| minibus | Mini bus      |
| bus_30  | 30-seat bus   |
| bus_50  | 50-seat bus   |

---

## 5. Booking status flow

1. **requested** – User created booking, no vehicle selected yet.  
2. **confirmed** – User selected a vehicle (or sent `vehicleId` on create).  
3. **driver_assigned** – Driver accepted the trip (`/bookings/:id/confirm-driver`).  
4. **trip_started** – Driver started the trip (`/bookings/:id/start`).  
5. **completed** – Driver completed the trip (`/bookings/:id/complete`).  
6. **cancelled** – Booking cancelled (e.g. by admin or app logic).  

---

## 6. Admin APIs (Web dashboard)

All admin APIs require an admin token (`role = "admin"`).

### 6.1 Dashboard stats

- **Method / Path:** `GET /admin/dashboard`
- **Auth:** Admin required
- **Description:** Returns overall stats (users, drivers, vehicles, bookings, revenue, recent bookings, pending vehicles, etc.).

### 6.2 Users

- **List users**
  - **GET** `/users`
  - **Auth:** Admin required
  - **Query (optional):** `?role=user` or `?role=driver` to filter.

- **Delete user**
  - **DELETE** `/users/:id`
  - **Auth:** Admin required

### 6.3 Vehicles

- **List all vehicles**
  - **GET** `/vehicles`
  - **Auth:** Authenticated (typically used by admin dashboard)

- **Approve vehicle**
  - **PUT** `/vehicles/approve/:id`
  - **Auth:** Admin required
  - **Behavior:** Sets `status = "approved"`.

- **Reject vehicle**
  - **PUT** `/vehicles/reject/:id`
  - **Auth:** Admin required
  - **Behavior:** Sets `status = "rejected"`.

- **Delete vehicle**
  - **DELETE** `/vehicles/:id`
  - **Auth:** Admin required

### 6.4 Bookings (admin)

- **List all bookings**
  - **GET** `/bookings`
  - **Auth:** Admin required

- **Get booking by id**
  - **GET** `/bookings/:id`
  - **Auth:** Admin required

- **Update booking**
  - **PUT** `/bookings/:id`
  - **Auth:** Admin required
  - **Body:** partial booking fields to update (e.g. `status`).

- **Delete booking**
  - **DELETE** `/bookings/:id`
  - **Auth:** Admin required

---

## 7. Upload URLs

Uploaded files (licence and vehicle images) are exposed under:

- **Base:** `http://<host>:5000/uploads/<filename>`

These URLs are stored in:

- Vehicle `licenceUrl` – driver licence file
- Vehicle `image` – vehicle image

---

## 8. Full API list by method (quick reference)

Use this as a checklist when wiring your React Native apps (Driver & User) and the Admin dashboard.

### 8.1 POST (create)

- `POST /auth/register`  
  - **Auth:** none  
  - **Body:** JSON – `{ name, email, password, role?, phone? }`

- `POST /auth/login`  
  - **Auth:** none  
  - **Body:** JSON – `{ email, password }`  
  - **Returns:** `{ token, user }`

- `POST /vehicles`  
  - **Auth:** driver  
  - **Body:** `multipart/form-data` – vehicle info + `licence` file (+ optional `image`)  
  - **Creates:** pending vehicle linked to logged‑in driver.

- `POST /bookings`  
  - **Auth:** user  
  - **Body:** JSON – trip details + optional `vehicleId`  
  - **Creates:** booking with `status = "requested"` or `"confirmed"`.

### 8.2 GET (read)

- `GET /vehicles/available`  
  - **Auth:** none  
  - **Query:** `type?`  
  - **Use in:** User app (list vehicles to book).

- `GET /vehicles/nearby`  
  - **Auth:** none  
  - **Query:** `type?`

- `GET /vehicles/my`  
  - **Auth:** driver  
  - **Use in:** Driver app (My Vehicles screen).

- `GET /vehicles`  
  - **Auth:** any authenticated user (typically admin dashboard)  
  - **Use in:** Admin vehicles list.

- `GET /bookings/my`  
  - **Auth:** user  
  - **Use in:** User app (My Trips / My Bookings screen).

- `GET /bookings/driver`  
  - **Auth:** driver  
  - **Use in:** Driver app (Bookings assigned to my vehicles).

- `GET /bookings`  
  - **Auth:** admin  
  - **Use in:** Admin bookings table.

- `GET /bookings/:id`  
  - **Auth:** admin  
  - **Use in:** Admin booking details.

- `GET /users`  
  - **Auth:** admin  
  - **Query:** `role=user|driver` (optional)  
  - **Use in:** Admin users list.

- `GET /admin/dashboard`  
  - **Auth:** admin  
  - **Use in:** Admin dashboard summary cards & charts.

### 8.3 PUT (update / actions)

- `PUT /bookings/:id/confirm`  
  - **Auth:** user  
  - **Body:** JSON – `{ "vehicleId": "<vehicle_id>" }`  
  - **Action:** attach vehicle + set price, `requested → confirmed`.

- `PUT /bookings/:id/confirm-driver`  
  - **Auth:** driver  
  - **Body:** *(empty)*  
  - **Action:** driver accepts trip, `confirmed → driver_assigned`.

- `PUT /bookings/:id/start`  
  - **Auth:** driver  
  - **Body:** *(empty)*  
  - **Action:** start trip, `driver_assigned → trip_started`, vehicle unavailable.

- `PUT /bookings/:id/complete`  
  - **Auth:** driver  
  - **Body:** *(empty)*  
  - **Action:** complete trip, `trip_started → completed`, vehicle available.

- `PUT /bookings/:id`  
  - **Auth:** admin  
  - **Body:** partial booking JSON (e.g. `{ "status": "cancelled" }`)  
  - **Action:** admin updates booking fields.

- `PUT /vehicles/approve/:id`  
  - **Auth:** admin  
  - **Body:** *(empty)*  
  - **Action:** set vehicle `status = "approved"`.

- `PUT /vehicles/reject/:id`  
  - **Auth:** admin  
  - **Body:** *(empty)*  
  - **Action:** set vehicle `status = "rejected"`.

> Note: if you later add a **driver live location** API (e.g. `PUT /vehicles/:id/location`), also document it here as a PUT with JSON `{ currentLat, currentLng }`.

### 8.4 DELETE (remove)

- `DELETE /users/:id`  
  - **Auth:** admin  
  - **Use in:** Admin users management.

- `DELETE /vehicles/:id`  
  - **Auth:** admin  
  - **Use in:** Admin vehicles management.

- `DELETE /bookings/:id`  
  - **Auth:** admin  
  - **Use in:** Admin bookings management.


