import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView,
  Linking,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const BookingDetailScreen = ({ route, navigation }) => {
  const { booking: initialBooking } = route.params;
  const { token } = useAuth();
  
  const [booking, setBooking] = useState(initialBooking);
  const [submitting, setSubmitting] = useState(false);

  // Refresh data from server
  const refresh = async () => {
    try {
      const updated = await apiRequest(`/bookings/${booking._id}`, {}, token);
      setBooking(updated);
    } catch (e) {
      console.log('Error refreshing booking', e.message);
    }
  };

  // Logic to open Google/Apple Maps
  const openInMaps = (address) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open maps application');
      }
    });
  };

  // Professional Action Handler with Optimistic UI
  const callAction = async (path, successMsg, nextStatus) => {
    try {
      setSubmitting(true);
      
      // 1. Instant UI Update (Optimistic)
      // This changes the status on screen BEFORE the API responds
      setBooking(prev => ({ ...prev, status: nextStatus }));

      await apiRequest(path, { method: 'PUT' }, token);
      
      // 2. Sync with server to get final truth
      await refresh();
      Alert.alert('Success', successMsg);
    } catch (e) {
      // 3. Rollback if server fails
      await refresh(); 
      Alert.alert('Action Failed', e.message || 'Please check your internet connection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* FULL SCREEN LOADING OVERLAY */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Updating Trip Status...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER CARD */}
        <View style={styles.headerCard}>
          <Text style={styles.orderId}>ORDER #{booking._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.priceText}>₹{booking.totalPrice || '0'}</Text>
          <View style={styles.statusContainer}>
             <View style={styles.statusDot} />
             <Text style={styles.statusText}>
                {booking.status.replace('_', ' ').toUpperCase()}
             </Text>
          </View>
        </View>

        {/* TRIP ITINERARY */}
        <View style={styles.card}>
          <View style={styles.itineraryRow}>
            <View style={styles.timeline}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <View style={styles.line} />
              <Ionicons name="pin" size={24} color="#F44336" />
            </View>
            <View style={styles.addressContainer}>
              <View>
                <Text style={styles.label}>PICKUP LOCATION</Text>
                <Text style={styles.address}>{booking.pickupLocation}</Text>
                <TouchableOpacity 
                  onPress={() => openInMaps(booking.pickupLocation)}
                  style={styles.navLink}
                >
                  <Ionicons name="navigate-circle" size={18} color="#2196F3" />
                  <Text style={styles.navLinkText}>Navigate to Pickup</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 30 }}>
                <Text style={styles.label}>DROP LOCATION</Text>
                <Text style={styles.address}>{booking.dropLocation}</Text>
                <TouchableOpacity 
                  onPress={() => openInMaps(booking.dropLocation)}
                  style={styles.navLink}
                >
                  <Ionicons name="navigate-circle" size={18} color="#2196F3" />
                  <Text style={styles.navLinkText}>Navigate to Drop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* CUSTOMER CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
               <Ionicons name="person" size={20} color="#2196F3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{booking.user?.name || 'Customer'}</Text>
              <Text style={styles.customerSub}>{booking.user?.phone || 'No phone provided'}</Text>
            </View>
            {booking.user?.phone && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => Linking.openURL(`tel:${booking.user.phone}`)}
              >
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FIXED FOOTER BUTTONS */}
      <View style={styles.footer}>
        {booking.status === 'confirmed' && (
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => callAction(`/bookings/${booking._id}/confirm-driver`, 'Trip Accepted!', 'driver_assigned')}
          >
            <Text style={styles.buttonText}>Accept Trip</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'driver_assigned' && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]} 
            onPress={() => callAction(`/bookings/${booking._id}/start`, 'Trip Started!', 'trip_started')}
          >
            <Text style={styles.buttonText}>Start Trip</Text>
          </TouchableOpacity>
        )}

        {booking.status === 'trip_started' && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#FF9800' }]} 
            onPress={() => callAction(`/bookings/${booking._id}/complete`, 'Trip Completed!', 'completed')}
          >
            <Text style={styles.buttonText}>Complete Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  // Loading styles
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16, fontWeight: '600', color: '#2196F3' },
  
  scrollContent: { padding: 16, paddingBottom: 120 },
  headerCard: {
    backgroundColor: '#2196F3',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  orderId: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  priceText: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  statusContainer: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 8 },
  statusText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  itineraryRow: { flexDirection: 'row' },
  timeline: { alignItems: 'center', marginRight: 15, paddingTop: 5 },
  line: { width: 2, flex: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  addressContainer: { flex: 1 },
  label: { fontSize: 11, color: '#999', fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
  address: { fontSize: 15, color: '#333', fontWeight: '600', lineHeight: 20 },
  navLink: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  navLinkText: { color: '#2196F3', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  customerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  customerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  customerSub: { fontSize: 13, color: '#666', marginTop: 2 },
  callButton: { backgroundColor: '#4CAF50', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  footer: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    padding: 20, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20 
  },
  primaryButton: { 
    backgroundColor: '#2196F3', 
    height: 58, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default BookingDetailScreen;