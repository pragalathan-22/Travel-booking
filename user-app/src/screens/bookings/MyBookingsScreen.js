import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';

const MyBookingsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/bookings/my', {}, token);
      setBookings(data || []);
    } catch (e) {
      console.log('Error loading bookings', e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isFocused) {
      loadBookings();
    }
  }, [isFocused, loadBookings]);

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'in-progress': return { bg: '#E3F2FD', text: '#1565C0' };
      case 'cancelled': return { bg: '#FFEBEE', text: '#C62828' };
      default: return { bg: '#FFF3E0', text: '#EF6C00' };
    }
  };

  const renderItem = ({ item }) => {
    const statusTheme = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { 
              month: 'short', day: 'numeric', year: 'numeric' 
            })}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.timeline}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: '#2ECC71' }]} />
          </View>
          <View style={styles.locations}>
            <Text numberOfLines={1} style={styles.locationText}>{item.pickupLocation}</Text>
            <Text numberOfLines={1} style={styles.locationText}>{item.dropLocation}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.vehicleInfo}>
            {item.vehicle?.name || 'Standard Vehicle'}
          </Text>
          <Text style={styles.priceText}>
            {item.totalPrice != null ? `₹${item.totalPrice}` : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>Your booking history will appear here.</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeline: {
    alignItems: 'center',
    width: 12,
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  line: {
    width: 1,
    height: 20,
    backgroundColor: '#EEE',
    marginVertical: 2,
  },
  locations: {
    flex: 1,
    gap: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
});

export default MyBookingsScreen;