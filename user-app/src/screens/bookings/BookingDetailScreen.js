import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const { width } = Dimensions.get('window');

const BookingDetailScreen = ({ route, navigation }) => {
  const { booking: initialBooking } = route.params;
  const { token } = useAuth();
  const [booking, setBooking] = useState(initialBooking);
  const [submitting, setSubmitting] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const mapRef = useRef(null);

  // Function to fetch latest booking data
  const refresh = async () => {
    try {
      const updated = await apiRequest(`/bookings/${booking._id}`, { method: 'GET' }, token);
      setBooking(updated);
      if (updated.driverLocation) {
        setDriverLocation(updated.driverLocation);
        // Inject JS to update the map marker if the WebView is ready
        mapRef.current?.injectJavaScript(`
          if(window.updateDriverLocation) {
            window.updateDriverLocation(${updated.driverLocation.latitude}, ${updated.driverLocation.longitude});
          }
        `);
      }
    } catch (e) {
      console.log('Error refreshing', e.message);
    }
  };

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (['confirmed', 'in-progress'].includes(booking.status)) {
        refresh();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [booking.status]);

  // Handle Order Cancellation
  const handleCancelPress = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this trip?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: executeCancellation 
        }
      ]
    );
  };

  const executeCancellation = async () => {
    try {
      setSubmitting(true);
      // Adjust the endpoint according to your API (e.g., /cancel or status update)
      const response = await apiRequest(`/bookings/${booking._id}/cancel`, { 
        method: 'PATCH' 
      }, token);
      
      setBooking(response);
      Alert.alert("Success", "Your booking has been cancelled.");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to cancel booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateTrackingMapHTML = () => {
    const pickup = booking.pickupCoordinates || { latitude: 13.08, longitude: 80.27 };
    const drop = booking.dropCoordinates || { latitude: 13.10, longitude: 80.30 };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body { margin: 0; } #map { height: 100vh; width: 100vw; }
          .marker-pin { width: 34px; height: 34px; border-radius: 50% 50% 50% 0; background: #000; position: absolute; transform: rotate(-45deg); left: 50%; top: 50%; margin: -22px 0 0 -17px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
          .marker-pin span { transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${pickup.latitude}, ${pickup.longitude}], 13);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

          let driverMarker;
          const pIcon = L.divIcon({ className: '', html: '<div class="marker-pin" style="background:#000"><span>A</span></div>', iconSize: [30, 42], iconAnchor: [15, 42] });
          const dIcon = L.divIcon({ className: '', html: '<div class="marker-pin" style="background:#2ECC71"><span>B</span></div>', iconSize: [30, 42], iconAnchor: [15, 42] });
          const carIcon = L.divIcon({ className: '', html: '<div class="marker-pin" style="background:#007AFF"><span>🚗</span></div>', iconSize: [30, 42], iconAnchor: [15, 42] });

          L.marker([${pickup.latitude}, ${pickup.longitude}], {icon: pIcon}).addTo(map);
          L.marker([${drop.latitude}, ${drop.longitude}], {icon: dIcon}).addTo(map);

          window.updateDriverLocation = function(lat, lng) {
            if (driverMarker) driverMarker.setLatLng([lat, lng]);
            else driverMarker = L.marker([lat, lng], {icon: carIcon}).addTo(map);
            map.panTo([lat, lng]);
          };
        </script>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status) => {
    const map = { 
      'in-progress': '#2196F3', 
      'confirmed': '#4CAF50', 
      'cancelled': '#f44336',
      'pending': '#FF9800'
    };
    return map[status] || '#9E9E9E';
  };

  const StatusHeader = () => (
    <View style={styles.floatingHeader}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
        <Text style={styles.backArrow}>✕</Text>
      </TouchableOpacity>
      <View style={styles.statusPill}>
        <View style={[styles.dot, { backgroundColor: getStatusColor(booking.status) }]} />
        <Text style={styles.statusPillText}>{booking.status.toUpperCase()}</Text>
      </View>
      <TouchableOpacity onPress={refresh} style={styles.iconCircle} disabled={submitting}>
        {submitting ? <ActivityIndicator size="small" color="#000" /> : <Text>🔄</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.mapWrapper}>
        <WebView
          ref={mapRef}
          source={{ html: generateTrackingMapHTML() }}
          style={styles.map}
        />
        <StatusHeader />
      </View>

      <View style={styles.panel}>
        <View style={styles.handle} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainInfo}>
            <View>
              <Text style={styles.vehicleTitle}>{booking.vehicle?.name || 'Standard Vehicle'}</Text>
              <Text style={styles.plateNumber}>MH 12 AB 1234</Text>
            </View>
            <Text style={styles.priceTag}>₹{booking.totalPrice}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.addressContainer}>
            <View style={styles.timeline}>
              <View style={styles.dotStart} />
              <View style={styles.line} />
              <View style={styles.dotEnd} />
            </View>
            <View style={styles.addressTextWrapper}>
              <Text numberOfLines={1} style={styles.addressText}>{booking.pickupLocation}</Text>
              <View style={{ height: 28 }} />
              <Text numberOfLines={1} style={styles.addressText}>{booking.dropLocation}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DISTANCE</Text>
              <Text style={styles.statValue}>{booking.distanceKm} km</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{booking.durationMinutes} min</Text>
            </View>
          </View>

          {booking.driver && (
            <TouchableOpacity style={styles.driverCard}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{booking.driver.name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{booking.driver.name}</Text>
                <Text style={styles.driverSubtext}>Your professional driver</Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Conditional Cancel Button */}
          {['pending', 'confirmed'].includes(booking.status) && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancelPress}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#f44336" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Trip</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapWrapper: { flex: 1.2 },
  map: { flex: 1 },
  floatingHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  backArrow: { fontSize: 18, fontWeight: 'bold' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    elevation: 4,
  },
  statusPillText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 12,
  },
  scrollContent: { paddingBottom: 20 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  vehicleTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  plateNumber: { color: '#888', fontWeight: '600', fontSize: 13, marginTop: 2 },
  priceTag: { fontSize: 24, fontWeight: '800', color: '#2ECC71' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
  addressContainer: { flexDirection: 'row', height: 80 },
  timeline: { alignItems: 'center', width: 20, marginRight: 15 },
  dotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#000' },
  line: { width: 2, flex: 1, backgroundColor: '#EEE' },
  dotEnd: { width: 10, height: 10, backgroundColor: '#2ECC71' },
  addressTextWrapper: { flex: 1 },
  addressText: { fontSize: 15, color: '#444', fontWeight: '500' },
  statsRow: { flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginVertical: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#999', fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#333' },
  verticalDivider: { width: 1, backgroundColor: '#DDD' },
  driverCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 16, marginBottom: 15 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  driverName: { fontWeight: '700', fontSize: 15 },
  driverSubtext: { fontSize: 12, color: '#888' },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  callIcon: { fontSize: 16 },
  cancelButton: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#f44336',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default BookingDetailScreen;