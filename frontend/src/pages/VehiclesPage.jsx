import { useEffect, useState } from "react";
import API from "../api/axios";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filterStatus, filterType, searchQuery]);

  const loadVehicles = async () => {
    try {
      const res = await API.get("/vehicles");
      setVehicles(res.data);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(v => v.status === filterStatus);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(v => v.type === filterType);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.numberPlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driver?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVehicles(filtered);
  };

  const approveVehicle = async (id) => {
    try {
      await API.put("/vehicles/approve/" + id);
      loadVehicles();
    } catch (error) {
      console.error("Error approving vehicle:", error);
    }
  };

  const deleteVehicle = async (id) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    
    try {
      await API.delete("/vehicles/" + id);
      loadVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const vehicleTypeLabels = {
    bike: "Bike",
    car: "Car",
    van: "Van",
    minibus: "Mini Bus",
    bus_30: "30-Seat Bus",
    bus_50: "50-Seat Bus"
  };

  const vehicleTypeColors = {
    bike: "bg-blue-100 text-blue-800",
    car: "bg-green-100 text-green-800",
    van: "bg-purple-100 text-purple-800",
    minibus: "bg-orange-100 text-orange-800",
    bus_30: "bg-red-100 text-red-800",
    bus_50: "bg-indigo-100 text-indigo-800"
  };

  const vehicleTypeIcons = {
    bike: "🏍️",
    car: "🚗",
    van: "🚐",
    minibus: "🚐",
    bus_30: "🚌",
    bus_50: "🚌"
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Management</h1>
        <p className="text-gray-600">Manage all vehicles in your fleet</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, plate, or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="bike">Bike</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="minibus">Mini Bus</option>
              <option value="bus_30">30-Seat Bus</option>
              <option value="bus_50">50-Seat Bus</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredVehicles.length}</span> of <span className="font-semibold">{vehicles.length}</span> vehicles
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500">Try adjusting your filters or add a new vehicle</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden">
              {/* Vehicle Image */}
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-6xl">
                    {vehicleTypeIcons[vehicle.type] || "🚗"}
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {vehicle.status === "approved" ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      ✓ Approved
                    </span>
                  ) : (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{vehicle.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${vehicleTypeColors[vehicle.type] || "bg-gray-100 text-gray-800"}`}>
                      {vehicleTypeLabels[vehicle.type] || vehicle.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm font-medium">{vehicle.numberPlate || "N/A"}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">{vehicle.driver?.name || "No driver assigned"}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-green-600">₹{vehicle.pricePerKm || 0}/km</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {vehicle.status === "pending" && (
                    <button
                      onClick={() => approveVehicle(vehicle._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve</span>
                    </button>
                  )}
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVehicle(vehicle._id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

