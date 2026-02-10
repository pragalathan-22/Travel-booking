const mongoose = require("mongoose");

// Status flow: requested -> confirmed (vehicle selected) -> driver_assigned (driver accepted) -> trip_started -> completed | cancelled
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  vehicleType: { type: String, enum: ["bike", "car", "van", "minibus", "bus_30", "bus_50"] }, // requested type if no vehicle yet
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  pickupLat: { type: Number, default: null },
  pickupLng: { type: Number, default: null },
  dropLat: { type: Number, default: null },
  dropLng: { type: Number, default: null },
  distanceKm: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  scheduledDate: { type: Date, default: null }, // optional trip date/time
  status: {
    type: String,
    enum: ["requested", "confirmed", "driver_assigned", "trip_started", "completed", "cancelled"],
    default: "requested"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
