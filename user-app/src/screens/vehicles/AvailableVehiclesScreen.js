import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { apiRequest } from '../../api/client';

const AvailableVehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const isFocused = useIsFocused();

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      let path = '/vehicles/available';
      if (typeFilter) {
        path += `?type=${encodeURIComponent(typeFilter.toLowerCase().trim())}`;
      }
      const data = await apiRequest(path);
      setVehicles(data || []);
    } catch (e) {
      console.log('Error loading vehicles', e.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    if (isFocused) {
      loadVehicles();
    }
  }, [isFocused, loadVehicles]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.vehicleName}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.label}>Driver: <Text style={styles.value}>{item.driver?.name || 'N/A'}</Text></Text>
        <Text style={styles.priceText}>${item.pricePerKm}<Text style={styles.unit}>/km</Text></Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.searchContainer}>
          <TextInput
            value={typeFilter}
            onChangeText={setTypeFilter}
            placeholder="Search by type (e.g. car, van)"
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.applyButton} onPress={loadVehicles}>
            <Text style={styles.applyButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={vehicles}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVehicles} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No vehicles found in this category.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Android Shadow
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#007AFF',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    color: '#636E72',
  },
  value: {
    fontWeight: '600',
    color: '#2D3436',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2ECC71',
  },
  unit: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '400',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#B2BEC3',
    fontSize: 16,
  },
});

export default AvailableVehiclesScreen;