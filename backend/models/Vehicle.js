const mongoose = require("mongoose");

// Vehicle types: 50-seat bus, 30-seat bus, minibus, van, car, bike
const vehicleSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: ["bike", "car", "van", "minibus", "bus_30", "bus_50"],
    required: true
  },
  name: { type: String, required: true },
  numberPlate: { type: String, required: true },
  seats: { type: Number, default: 1 }, // bike=1, car=4, van=7, minibus=15, bus_30=30, bus_50=50
  pricePerKm: { type: Number, required: true },
  image: { type: String, default: "" },
  licenceUrl: { type: String, default: "" }, // driver licence upload
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  currentLat: { type: Number, default: null },
  currentLng: { type: Number, default: null },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
