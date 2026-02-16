import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  StyleSheet, 
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const MyVehiclesScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/vehicles/my', { method: 'GET' }, token);
      setVehicles(data || []);
    } catch (e) {
      console.log('Error loading vehicles', e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isFocused) {
      loadVehicles();
    }
  }, [isFocused, loadVehicles]);

  const getStatusTheme = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return { color: '#10B981', bg: '#D1FAE5', icon: 'check-circle' };
      case 'pending': return { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-outline' };
      default: return { color: '#6B7280', bg: '#F3F4F6', icon: 'alert-circle-outline' };
    }
  };

  const renderItem = ({ item }) => {
    const theme = getStatusTheme(item.status);

    return (
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={styles.card}
        onPress={() => navigation.navigate('VehicleDetails', { vehicle: item })}
      >
        <View style={styles.cardTop}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons 
              name={item.type?.toLowerCase() === 'truck' ? 'truck-outline' : 'car-side'} 
              size={24} 
              color="#1A1A1A" 
            />
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.vehicleName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.vehicleType}>{item.type?.toUpperCase()}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons name={theme.icon} size={14} color={theme.color} />
            <Text style={[styles.statusText, { color: theme.color }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailChip}>
            <Ionicons name="card-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.numberPlate}</Text>
          </View>
          <View style={styles.detailChip}>
            <Ionicons name="flash-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>₹{item.pricePerKm}/km</Text>
          </View>
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>My Fleet</Text>
        <Text style={styles.screenSubtitle}>{vehicles.length} Vehicles Registered</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVehicles} color="#000" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="car-sport-outline" size={40} color="#999" />
              </View>
              <Text style={styles.emptyText}>No vehicles in your fleet</Text>
              <Text style={styles.emptySubText}>Add your vehicle to start receiving booking requests.</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.emptyButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddVehicle')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // High-end subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  vehicleType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FAFAFA',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 6,
  },
  arrowIcon: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#000', // Professional black FAB
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  }
});

export default MyVehiclesScreen;