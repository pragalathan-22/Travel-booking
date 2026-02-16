import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const NewBookingScreen = ({ route, navigation }) => {
  const { vehicle } = route.params || {};
  const { token } = useAuth();

  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingDistance, setFetchingDistance] = useState(false);
  
  // Map modal states
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null); // 'pickup' or 'drop'
  const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai

  // Generate HTML for OpenStreetMap with Leaflet
  const generateMapHTML = () => {
    const markers = [];
    
    if (selectingFor === 'pickup' && pickupCoords) {
      markers.push({
        lat: pickupCoords.latitude,
        lng: pickupCoords.longitude,
        label: 'P',
        color: 'green'
      });
    } else if (selectingFor === 'drop') {
      if (pickupCoords) {
        markers.push({
          lat: pickupCoords.latitude,
          lng: pickupCoords.longitude,
          label: 'P',
          color: 'green'
        });
      }
      if (dropCoords) {
        markers.push({
          lat: dropCoords.latitude,
          lng: dropCoords.longitude,
          label: 'D',
          color: 'red'
        });
      }
    }

    const showRoute = pickupCoords && dropCoords && selectingFor === 'drop';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #map { height: 100%; width: 100%; }
          .instruction {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="instruction">
          Tap on the map to select ${selectingFor === 'pickup' ? 'Pickup' : 'Drop'} location
        </div>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          let map;
          let currentMarker;
          let routeLayer;

          // Initialize map
          map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 12);

          // Add OpenStreetMap tiles (completely free!)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);

          // Custom icon function
          function createIcon(color) {
            return L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
          }

          // Add existing markers
          ${markers.map(m => `
            L.marker([${m.lat}, ${m.lng}], {
              icon: createIcon('${m.color}')
            }).addTo(map).bindPopup('${m.label === 'P' ? 'Pickup Location' : 'Drop Location'}');
          `).join('')}

          ${showRoute ? `
            // Draw route using OSRM (free routing service)
            fetch('https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${dropCoords.longitude},${dropCoords.latitude}?overview=full&geometries=geojson')
              .then(response => response.json())
              .then(data => {
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                  const route = data.routes[0];
                  const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                  
                  // Draw route on map
                  routeLayer = L.polyline(coordinates, {
                    color: '#2196F3',
                    weight: 5,
                    opacity: 0.7
                  }).addTo(map);
                  
                  // Fit map to show entire route
                  map.fitBounds(routeLayer.getBounds());
                }
              })
              .catch(err => console.error('Routing error:', err));
          ` : ''}

          // Click event to select location
          map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Remove previous marker if exists
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }
            
            // Add new marker
            const markerColor = '${selectingFor === 'pickup' ? 'green' : 'red'}';
            currentMarker = L.marker([lat, lng], {
              icon: createIcon(markerColor)
            }).addTo(map);
            
            currentMarker.bindPopup('${selectingFor === 'pickup' ? 'Pickup Location' : 'Drop Location'}').openPopup();

            // Send location back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              latitude: lat,
              longitude: lng
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  // Handle map location selection
  const handleMapMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const { latitude, longitude } = data;

      // Reverse geocode to get address using Nominatim (free service)
      const address = await reverseGeocode(latitude, longitude);

      if (selectingFor === 'pickup') {
        setPickupCoords({ latitude, longitude });
        setPickupLocation(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } else if (selectingFor === 'drop') {
        setDropCoords({ latitude, longitude });
        setDropLocation(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

      // Close modal after selection
      setShowMapModal(false);
      setSelectingFor(null);

      Alert.alert('Location Selected', address || 'Coordinates saved successfully');
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  // Reverse geocode coordinates to address using Nominatim (FREE!)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BookingApp/1.0' // Required by Nominatim
        }
      });
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Geocode location to coordinates using Nominatim (FREE!)
  const geocodeLocation = async (location) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BookingApp/1.0' // Required by Nominatim
        }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Calculate distance and duration using OSRM (FREE!)
  const calculateDistanceAndDuration = async () => {
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Missing Locations', 'Please select both pickup and drop locations from the map');
      return;
    }

    try {
      setFetchingDistance(true);

      // Use OSRM for free routing (no API key needed!)
      const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.longitude},${pickupCoords.latitude};${dropCoords.longitude},${dropCoords.latitude}?overview=false`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceInMeters = route.distance;
        const durationInSeconds = route.duration;

        const km = (distanceInMeters / 1000).toFixed(2);
        const minutes = Math.ceil(durationInSeconds / 60);

        setDistanceKm(km);
        setDurationMinutes(minutes.toString());

        // Calculate total price if vehicle is selected
        if (vehicle && vehicle.pricePerKm) {
          const price = (parseFloat(km) * vehicle.pricePerKm).toFixed(2);
          setTotalPrice(price);
        }

        Alert.alert(
          '✅ Route Calculated', 
          `Distance: ${km} km\nDuration: ${minutes} min${vehicle ? `\nPrice: ₹${(parseFloat(km) * vehicle.pricePerKm).toFixed(2)}` : ''}`
        );
      } else {
        throw new Error('Could not calculate route');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      Alert.alert('Error', error.message || 'Failed to calculate distance');
    } finally {
      setFetchingDistance(false);
    }
  };

  // Auto-calculate when both locations are selected
  useEffect(() => {
    if (pickupCoords && dropCoords) {
      calculateDistanceAndDuration();
    }
  }, [pickupCoords, dropCoords]);

  // Update price when distance changes
  useEffect(() => {
    if (distanceKm && vehicle && vehicle.pricePerKm) {
      const price = (parseFloat(distanceKm) * vehicle.pricePerKm).toFixed(2);
      setTotalPrice(price);
    }
  }, [distanceKm, vehicle]);

  // Open map for location selection
  const openMapForLocation = (type) => {
    setSelectingFor(type);
    
    // Set map center based on existing location
    if (type === 'pickup' && pickupCoords) {
      setMapCenter({ lat: pickupCoords.latitude, lng: pickupCoords.longitude });
    } else if (type === 'drop' && dropCoords) {
      setMapCenter({ lat: dropCoords.latitude, lng: dropCoords.longitude });
    } else if (pickupCoords) {
      setMapCenter({ lat: pickupCoords.latitude, lng: pickupCoords.longitude });
    }
    
    setShowMapModal(true);
  };

  const onSubmit = async () => {
    // Validation
    if (!pickupLocation.trim()) {
      Alert.alert('Validation Error', 'Please select pickup location');
      return;
    }
    if (!dropLocation.trim()) {
      Alert.alert('Validation Error', 'Please select drop location');
      return;
    }
    if (!distanceKm || parseFloat(distanceKm) <= 0) {
      Alert.alert('Validation Error', 'Distance not calculated');
      return;
    }
    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter total price');
      return;
    }

    try {
      setSubmitting(true);

      const body = {
        pickupLocation: pickupLocation.trim(),
        dropLocation: dropLocation.trim(),
        distanceKm: parseFloat(distanceKm),
        durationMinutes: parseInt(durationMinutes),
        totalPrice: parseFloat(totalPrice),
        pickupCoordinates: pickupCoords,
        dropCoordinates: dropCoords,
      };

      if (vehicle) {
        body.vehicleId = vehicle._id;
        body.vehicleType = vehicle.type;
      } else {
        body.vehicleType = 'car';
      }

      console.log('=== BOOKING SUBMISSION START ===');
      console.log('Submitting booking:', JSON.stringify(body, null, 2));
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      const res = await apiRequest(
        '/bookings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        token
      );

      console.log('=== BOOKING SUCCESS ===');
      console.log('Booking created:', res);

      Alert.alert('✅ Success', 'Booking created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('BookingsTab', {
              screen: 'MyBookings',
            });
          },
        },
      ]);
    } catch (e) {
      console.log('=== BOOKING ERROR ===');
      console.error('Booking error:', e);
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      
      // Try to get more details from the error object
      if (e.response) {
        console.error('Error response:', e.response);
        console.error('Error status:', e.response?.status);
        console.error('Error data:', e.response?.data);
      }
      
      if (e.request) {
        console.error('Error request:', e.request);
      }
      
      // Log all error properties
      console.error('All error properties:', Object.keys(e));
      console.error('Error toString:', e.toString());
      
      // Try to extract more meaningful error message
      let errorMessage = 'Failed to create booking';
      
      if (e.response && e.response.data && e.response.data.message) {
        errorMessage = e.response.data.message;
      } else if (e.response && e.response.data && e.response.data.error) {
        errorMessage = e.response.data.error;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      console.error('Final error message shown to user:', errorMessage);
      
      Alert.alert('Booking Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>🚗 New Booking</Text>

        {vehicle && (
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleText}>
              Vehicle: {vehicle.name} ({vehicle.type})
            </Text>
            <Text style={styles.vehicleText}>
              Price per km: ₹{vehicle.pricePerKm}
            </Text>
          </View>
        )}

        {/* Pickup Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Pickup Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              value={pickupLocation}
              placeholder="Select from map"
              style={[styles.input, styles.locationInput]}
              editable={false}
            />
            <TouchableOpacity
              style={styles.mapSelectButton}
              onPress={() => openMapForLocation('pickup')}
            >
              <Text style={styles.mapSelectButtonText}>📍 Select on Map</Text>
            </TouchableOpacity>
          </View>
          {pickupCoords && (
            <Text style={styles.coordsText}>
              📌 {pickupCoords.latitude.toFixed(4)}, {pickupCoords.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Drop Location */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Drop Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              value={dropLocation}
              placeholder="Select from map"
              style={[styles.input, styles.locationInput]}
              editable={false}
            />
            <TouchableOpacity
              style={styles.mapSelectButton}
              onPress={() => openMapForLocation('drop')}
            >
              <Text style={styles.mapSelectButtonText}>📍 Select on Map</Text>
            </TouchableOpacity>
          </View>
          {dropCoords && (
            <Text style={styles.coordsText}>
              📌 {dropCoords.latitude.toFixed(4)}, {dropCoords.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Calculate Button */}
        {pickupCoords && dropCoords && !distanceKm && (
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={calculateDistanceAndDuration}
            disabled={fetchingDistance}
          >
            {fetchingDistance ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.calculateButtonText}>  Calculating...</Text>
              </View>
            ) : (
              <Text style={styles.calculateButtonText}>🧮 Calculate Distance & Price</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Distance & Duration */}
        {distanceKm && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Distance</Text>
              <TextInput
                value={`${distanceKm} km`}
                editable={false}
                style={[styles.input, styles.calculatedInput]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                value={`${durationMinutes} minutes`}
                editable={false}
                style={[styles.input, styles.calculatedInput]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Price (₹) *</Text>
              <TextInput
                value={totalPrice}
                onChangeText={setTotalPrice}
                keyboardType="decimal-pad"
                placeholder="Auto-calculated"
                style={[styles.input, vehicle && styles.calculatedInput]}
                editable={!vehicle}
              />
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>📋 Booking Summary</Text>
              <Text style={styles.summaryText}>🚩 From: {pickupLocation}</Text>
              <Text style={styles.summaryText}>🏁 To: {dropLocation}</Text>
              <Text style={styles.summaryText}>📏 Distance: {distanceKm} km</Text>
              <Text style={styles.summaryText}>⏱️ Duration: {durationMinutes} min</Text>
              <Text style={styles.summaryText}>💵 Total: ₹{totalPrice}</Text>
            </View>
          </>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!distanceKm || !totalPrice || submitting) && styles.submitButtonDisabled
          ]}
          onPress={onSubmit}
          disabled={!distanceKm || !totalPrice || submitting}
        >
          {submitting ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitButtonText}>  Creating Booking...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>✅ Create Booking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => {
          setShowMapModal(false);
          setSelectingFor(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {selectingFor === 'pickup' ? 'Pickup' : 'Drop'} Location
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowMapModal(false);
                setSelectingFor(null);
              }}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: generateMapHTML() }}
            onMessage={handleMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={styles.webview}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  vehicleInfo: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  vehicleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  locationContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  locationInput: {
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  calculatedInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  mapSelectButton: {
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapSelectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 16,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  summaryText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 3,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  webview: {
    flex: 1,
  },
});

export default NewBookingScreen;