const Vehicle = require("../models/Vehicle");

const getBaseUrl = (req) => {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  return `${protocol}://${host}`;
};

exports.addVehicle = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const licenceFile = req.files?.licence?.[0] || req.file;
    const imageFile = req.files?.image?.[0];
    const licenceUrl = licenceFile ? `${baseUrl}/uploads/${licenceFile.filename}` : (req.body.licenceUrl || "");
    const image = imageFile ? `${baseUrl}/uploads/${imageFile.filename}` : (req.body.image || "");

    const payload = {
      ...req.body,
      driver: req.user.id,
      licenceUrl,
      image: image || req.body.image
    };
    if (req.body.seats) payload.seats = Number(req.body.seats);
    if (req.body.pricePerKm) payload.pricePerKm = Number(req.body.pricePerKm);

    const vehicle = await Vehicle.create(payload);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getVehicles = async (req, res) => {
  const vehicles = await Vehicle.find().populate("driver", "name email phone");
  res.json(vehicles);
};

// Driver: get my vehicles
exports.getMyVehicles = async (req, res) => {
  const vehicles = await Vehicle.find({ driver: req.user.id });
  res.json(vehicles);
};

// User/App: get available vehicles (approved, optional type filter)
exports.getAvailable = async (req, res) => {
  const filter = { status: "approved", isAvailable: true };
  if (req.query.type) filter.type = req.query.type;
  const vehicles = await Vehicle.find(filter).populate("driver", "name phone");
  res.json(vehicles);
};

// Nearby vehicles (by type; optional lat/lng for future use)
exports.getNearby = async (req, res) => {
  const filter = { status: "approved", isAvailable: true };
  if (req.query.type) filter.type = req.query.type;
  const vehicles = await Vehicle.find(filter).populate("driver", "name phone");
  res.json(vehicles);
};

exports.approveVehicle = async (req, res) => {
  await Vehicle.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ msg: "Approved" });
};

exports.rejectVehicle = async (req, res) => {
  await Vehicle.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.json({ msg: "Rejected" });
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });
    res.json({ msg: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

