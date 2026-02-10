const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");

exports.createBooking = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropLocation,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      distanceKm,
      durationMinutes,
      vehicleType,
      vehicleId,
      scheduledDate
    } = req.body;

    let totalPrice = Number(req.body.totalPrice) || 0;
    if (vehicleId && (!totalPrice || totalPrice === 0)) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle) totalPrice = (Number(distanceKm) || 0) * (vehicle.pricePerKm || 0);
    }

    const booking = await Booking.create({
      user: req.user.id,
      vehicle: vehicleId || undefined,
      vehicleType: vehicleType || undefined,
      pickupLocation: pickupLocation || "",
      dropLocation: dropLocation || "",
      pickupLat: pickupLat ? Number(pickupLat) : null,
      pickupLng: pickupLng ? Number(pickupLng) : null,
      dropLat: dropLat ? Number(dropLat) : null,
      dropLng: dropLng ? Number(dropLng) : null,
      distanceKm: Number(distanceKm) || 0,
      durationMinutes: Number(durationMinutes) || 0,
      totalPrice,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      status: vehicleId ? "confirmed" : "requested"
    });

    const populated = await Booking.findById(booking._id)
      .populate("user", "name email phone")
      .populate("vehicle", "name type numberPlate pricePerKm driver");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// User: my bookings
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("vehicle", "name type numberPlate pricePerKm")
    .populate("vehicle.driver", "name phone");
  res.json(bookings);
};

// Driver: bookings for my vehicles
exports.getDriverBookings = async (req, res) => {
  const myVehicles = await Vehicle.find({ driver: req.user.id }).select("_id");
  const vehicleIds = myVehicles.map((v) => v._id);
  const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
    .sort({ createdAt: -1 })
    .populate("vehicle", "name type numberPlate")
    .populate("user", "name phone");
  res.json(bookings);
};

// User: confirm booking with selected vehicle (assign vehicle, set price)
exports.confirmBooking = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.status !== "requested") return res.status(400).json({ msg: "Booking already confirmed or invalid" });

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.status !== "approved") return res.status(400).json({ msg: "Vehicle not available" });

    const totalPrice = (booking.distanceKm || 0) * (vehicle.pricePerKm || 0);
    booking.vehicle = vehicleId;
    booking.totalPrice = totalPrice;
    booking.status = "confirmed";
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("user", "name phone")
      .populate("vehicle", "name type numberPlate driver");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Driver: accept/confirm trip
exports.driverConfirm = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle", "driver");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (String(booking.vehicle.driver._id) !== String(req.user.id)) return res.status(403).json({ msg: "Not your booking" });
    if (booking.status !== "confirmed") return res.status(400).json({ msg: "Invalid status" });

    booking.status = "driver_assigned";
    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate("user", "name phone")
      .populate("vehicle", "name type numberPlate");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Driver: start trip
exports.startTrip = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle", "driver");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (String(booking.vehicle.driver._id) !== String(req.user.id)) return res.status(403).json({ msg: "Not your booking" });
    if (booking.status !== "driver_assigned") return res.status(400).json({ msg: "Confirm trip first" });

    booking.status = "trip_started";
    await booking.save();
    await Vehicle.findByIdAndUpdate(booking.vehicle._id, { isAvailable: false });
    const populated = await Booking.findById(booking._id)
      .populate("user", "name phone")
      .populate("vehicle", "name type numberPlate");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Driver: complete trip
exports.completeTrip = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle", "driver");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (String(booking.vehicle.driver._id) !== String(req.user.id)) return res.status(403).json({ msg: "Not your booking" });
    if (booking.status !== "trip_started") return res.status(400).json({ msg: "Trip not started" });

    booking.status = "completed";
    await booking.save();
    if (booking.vehicle && booking.vehicle._id) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id, { isAvailable: true });
    }
    const populated = await Booking.findById(booking._id)
      .populate("user", "name phone")
      .populate("vehicle", "name type numberPlate");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getBookings = async (req, res) => {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email phone")
    .populate("vehicle", "name type numberPlate driver");
  res.json(bookings);
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("vehicle", "name type numberPlate pricePerKm driver");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("user", "name email")
      .populate("vehicle", "name type numberPlate");
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    res.json({ msg: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

