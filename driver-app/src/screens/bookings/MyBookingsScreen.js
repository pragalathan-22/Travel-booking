import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  StyleSheet, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
      const data = await apiRequest('/bookings/driver', {}, token);
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

  // Helper to color-code the status
  const getStatusTheme = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return { color: '#4CAF50', bg: '#E8F5E9' };
      case 'pending': return { color: '#FF9800', bg: '#FFF3E0' };
      case 'cancelled': return { color: '#F44336', bg: '#FFEBEE' };
      case 'ongoing': return { color: '#2196F3', bg: '#E3F2FD' };
      default: return { color: '#757575', bg: '#F5F5F5' };
    }
  };

  const renderItem = ({ item }) => {
    const theme = getStatusTheme(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>ID: {item._id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
            <Text style={[styles.statusText, { color: theme.color }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.timeline}>
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          </View>
          
          <View style={styles.addressList}>
            <Text style={styles.addressText} numberOfLines={1}>{item.pickupLocation}</Text>
            <Text style={styles.addressText} numberOfLines={1}>{item.dropLocation}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Ionicons name="wallet-outline" size={18} color="#666" />
            <Text style={styles.priceLabel}>Total Fare</Text>
          </View>
          <Text style={styles.priceAmount}>
            {item.totalPrice != null ? `₹${item.totalPrice}` : 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor="#2196F3" />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color="#DDD" />
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubText}>New ride requests will appear here.</Text>
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  locationContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 1,
    height: 25,
    backgroundColor: '#EEE',
    marginVertical: 4,
  },
  addressList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default MyBookingsScreen;