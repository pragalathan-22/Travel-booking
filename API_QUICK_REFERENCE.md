# Travel Booking System - API Quick Reference

Base URL: `http://localhost:5000/api`

**All authenticated requests require:**
```
Authorization: <token>
```
(Get token from `/auth/login`)

---

## 1. 🚗 VEHICLE ENTRY API (Driver adds vehicle)

**Endpoint:** `POST /vehicles`

**Auth Required:** Yes (Driver role)

**Content-Type:** `multipart/form-data` (for file uploads)

**Fields:**
- `name` (string, required) - Vehicle name/model
- `type` (string, required) - `bike` | `car` | `van` | `minibus` | `bus_30` | `bus_50`
- `numberPlate` (string, required) - Vehicle registration number
- `pricePerKm` (number, required) - Price per kilometer
- `seats` (number, optional) - Number of seats
- `licence` (file, required) - Driver licence image/PDF
- `image` (file, optional) - Vehicle image

**Example using FormData (JavaScript):**
```javascript
const formData = new FormData();
formData.append('name', 'Toyota Camry');
formData.append('type', 'car');
formData.append('numberPlate', 'ABC-1234');
formData.append('pricePerKm', '50');
formData.append('seats', '4');
formData.append('licence', licenceFile); // File object
formData.append('image', vehicleImageFile); // File object (optional)

const response = await fetch('http://localhost:5000/api/vehicles', {
  method: 'POST',
  headers: {
    'Authorization': token
  },
  body: formData
});
```

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Authorization: YOUR_TOKEN" \
  -F "name=Toyota Camry" \
  -F "type=car" \
  -F "numberPlate=ABC-1234" \
  -F "pricePerKm=50" \
  -F "seats=4" \
  -F "licence=@/path/to/licence.pdf" \
  -F "image=@/path/to/vehicle.jpg"
```

**Response:**
```json
{
  "_id": "...",
  "driver": "...",
  "name": "Toyota Camry",
  "type": "car",
  "numberPlate": "ABC-1234",
  "seats": 4,
  "pricePerKm": 50,
  "licenceUrl": "http://localhost:5000/uploads/licence-123.pdf",
  "image": "http://localhost:5000/uploads/vehicle-123.jpg",
  "status": "pending",
  "isAvailable": true,
  "createdAt": "2026-02-09T...",
  "updatedAt": "2026-02-09T..."
}
```

---

## 2. 👤 USER ENTRY API (Create user - shown in dashboard)

**Endpoint:** `POST /auth/register`

**Auth Required:** No (Public registration)

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "+1234567890"
}
```

**Field Details:**
- `name` (string, required) - User's full name
- `email` (string, required) - Unique email address
- `password` (string, required) - User password
- `role` (string, optional) - `"user"` or `"driver"` (default: `"user"`)
  - ⚠️ Cannot register as `"admin"` - admin must be created via seed script
- `phone` (string, optional) - Phone number

**Example Request:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1234567890'
  })
});
```

**Example for Driver:**
```json
{
  "name": "Jane Driver",
  "email": "jane@example.com",
  "password": "driver123",
  "role": "driver",
  "phone": "+9876543210"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "phone": "+1234567890",
  "createdAt": "2026-02-09T...",
  "updatedAt": "2026-02-09T..."
}
```

**Note:** Users created via this API will appear in the admin dashboard when you call `GET /users`

---

## 3. 📅 BOOKING API (User creates booking)

**Endpoint:** `POST /bookings`

**Auth Required:** Yes (User role)

**Content-Type:** `application/json`

**Body:**
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
  "vehicleId": "65f1234567890abcdef12345",
  "totalPrice": 775,
  "scheduledDate": "2026-02-10T10:00:00Z"
}
```

**Field Details:**
- `pickupLocation` (string, required) - Pickup address
- `dropLocation` (string, required) - Drop-off address
- `pickupLat` (number, optional) - Pickup latitude
- `pickupLng` (number, optional) - Pickup longitude
- `dropLat` (number, optional) - Drop-off latitude
- `dropLng` (number, optional) - Drop-off longitude
- `distanceKm` (number, required) - Distance in kilometers (from maps API)
- `durationMinutes` (number, required) - Duration in minutes (from maps API)
- `vehicleType` (string, optional) - `bike` | `car` | `van` | `minibus` | `bus_30` | `bus_50`
- `vehicleId` (string, optional) - If provided, booking status = `confirmed`, else `requested`
- `totalPrice` (number, optional) - If `vehicleId` provided but no `totalPrice`, backend calculates: `distanceKm * vehicle.pricePerKm`
- `scheduledDate` (ISO string, optional) - Scheduled trip date/time

**Example Request (With Vehicle Selected):**
```javascript
const response = await fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token
  },
  body: JSON.stringify({
    pickupLocation: '123 Main St, City',
    dropLocation: '456 Park Ave, City',
    pickupLat: 12.9716,
    pickupLng: 77.5946,
    dropLat: 12.9352,
    dropLng: 77.6245,
    distanceKm: 15.5,
    durationMinutes: 25,
    vehicleId: '65f1234567890abcdef12345',
    scheduledDate: '2026-02-10T10:00:00Z'
  })
});
```

**Example Request (Without Vehicle - Status = requested):**
```json
{
  "pickupLocation": "123 Main St, City",
  "dropLocation": "456 Park Ave, City",
  "distanceKm": 15.5,
  "durationMinutes": 25,
  "vehicleType": "car"
}
```

**Response:**
```json
{
  "_id": "...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "vehicle": {
    "_id": "...",
    "name": "Toyota Camry",
    "type": "car",
    "numberPlate": "ABC-1234",
    "pricePerKm": 50,
    "driver": "..."
  },
  "pickupLocation": "123 Main St, City",
  "dropLocation": "456 Park Ave, City",
  "distanceKm": 15.5,
  "durationMinutes": 25,
  "totalPrice": 775,
  "status": "confirmed",
  "scheduledDate": "2026-02-10T10:00:00.000Z",
  "createdAt": "2026-02-09T...",
  "updatedAt": "2026-02-09T..."
}
```

---

## 4. ✅ VEHICLE CONFIRM API (Driver confirms booking)

**Endpoint:** `PUT /bookings/:id/confirm-driver`

**Auth Required:** Yes (Driver role)

**Content-Type:** `application/json`

**Body:** None (empty body)

**Description:** Driver accepts/confirms a booking for their vehicle. Changes status from `confirmed` to `driver_assigned`.

**Example Request:**
```javascript
const bookingId = '65f1234567890abcdef12345';

const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/confirm-driver`, {
  method: 'PUT',
  headers: {
    'Authorization': token
  }
});
```

**Example using cURL:**
```bash
curl -X PUT http://localhost:5000/api/bookings/65f1234567890abcdef12345/confirm-driver \
  -H "Authorization: YOUR_DRIVER_TOKEN"
```

**Response:**
```json
{
  "_id": "...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "vehicle": {
    "_id": "...",
    "name": "Toyota Camry",
    "type": "car",
    "numberPlate": "ABC-1234"
  },
  "pickupLocation": "123 Main St, City",
  "dropLocation": "456 Park Ave, City",
  "distanceKm": 15.5,
  "durationMinutes": 25,
  "totalPrice": 775,
  "status": "driver_assigned",
  "createdAt": "2026-02-09T...",
  "updatedAt": "2026-02-09T..."
}
```

**Status Flow:**
- `requested` → User created booking without vehicle
- `confirmed` → User selected vehicle (or created with vehicleId)
- `driver_assigned` → **Driver confirmed** (this API)
- `trip_started` → Driver started trip
- `completed` → Driver completed trip

---

## 📊 DASHBOARD APIs (Admin - View all data)

### Get All Users
**Endpoint:** `GET /users`
**Query:** `?role=user` | `?role=driver` (optional filter)
**Auth:** Admin required

### Get All Vehicles
**Endpoint:** `GET /vehicles`
**Auth:** Admin required

### Get All Bookings
**Endpoint:** `GET /bookings`
**Auth:** Admin required

### Dashboard Stats
**Endpoint:** `GET /admin/dashboard`
**Auth:** Admin required
**Returns:** Stats including user count, driver count, vehicle count, booking count, revenue, etc.

---

## 🔐 Authentication Flow

1. **Login to get token:**
   ```json
   POST /auth/login
   {
     "email": "admin@gmail.com",
     "password": "111"
   }
   ```

2. **Use token in headers:**
   ```
   Authorization: <token>
   ```

---

## 📝 Notes

- Vehicle status: `pending` → Admin approves → `approved` → Available for booking
- Booking without `vehicleId` creates status `requested` - user can later confirm with `PUT /bookings/:id/confirm`
- Driver can only confirm bookings for their own vehicles
- All timestamps are in ISO 8601 format
