import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView 
} from 'react-native';

const VehicleDetailScreen = ({ route, navigation }) => {
  const { vehicle } = route.params;

  const onBook = () => {
    navigation.navigate('NewBooking', { vehicle });
  };

  // Helper to render info rows
  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Hero Section */}
        <View style={styles.headerCard}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{vehicle.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.priceText}>
            ${vehicle.pricePerKm}<Text style={styles.unit}> / km</Text>
          </Text>
        </View>

        {/* Specifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Specifications</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Capacity</Text>
              <Text style={styles.gridValue}>{vehicle.seats} Seats</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Fuel Type</Text>
              <Text style={styles.gridValue}>Electric</Text> 
            </View>
          </View>
        </View>

        {/* Driver Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.avatarText}>
                {vehicle.driver?.name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View>
              <Text style={styles.driverName}>{vehicle.driver?.name || 'Assigned Driver'}</Text>
              <Text style={styles.driverRating}>⭐ 4.9 (120+ trips)</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={onBook}>
          <Text style={styles.bookButtonText}>Book this Vehicle</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    marginBottom: 24,
  },
  typeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  typeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2ECC71',
  },
  unit: {
    fontSize: 16,
    color: '#636E72',
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 0.48,
    backgroundColor: '#F1F3F5',
    padding: 16,
    borderRadius: 16,
  },
  gridLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 16,
    borderRadius: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  driverRating: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    backgroundColor: '#1A1A1A', // Dark professional theme
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default VehicleDetailScreen;