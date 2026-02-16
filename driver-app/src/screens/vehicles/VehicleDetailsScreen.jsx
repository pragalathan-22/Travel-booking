import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";

const VehicleDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vehicle: passedVehicle, vehicleId } = route.params || {};
  
  const { token } = useAuth();
  const [vehicle, setVehicle] = useState(passedVehicle || null);
  const [loading, setLoading] = useState(!passedVehicle);
  const [deleting, setDeleting] = useState(false);

  // Fetch vehicle if only ID is passed
  React.useEffect(() => {
    if (vehicleId && !passedVehicle) {
      loadVehicle();
    }
  }, [vehicleId, passedVehicle]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/vehicles/my`, { method: "GET" }, token);
      const found = data.find(v => v._id === vehicleId);
      if (found) setVehicle(found);
    } catch (e) {
      console.log("Vehicle fetch error:", e.message);
      Alert.alert('Error', 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setDeleting(true);
              await apiRequest(`/vehicles/${vehicle._id}`, { method: 'DELETE' }, token);
              Alert.alert('Success', 'Vehicle deleted successfully');
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete vehicle');
            } finally {
              setDeleting(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Loading Vehicle Details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loader}>
          <Ionicons name="alert-circle-outline" size={60} color="#999" />
          <Text style={styles.notFoundText}>Vehicle not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Vehicle Image */}
        {vehicle.image && (
          <Image 
            source={{ uri: vehicle.image }} 
            style={styles.vehicleImage}
            resizeMode="cover"
          />
        )}

        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.titleSection}>
            <MaterialCommunityIcons
              name={vehicle.type?.toLowerCase() === "truck" ? "truck-outline" : "car-side"}
              size={50}
              color="#2196F3"
            />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleType}>{vehicle.type?.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(vehicle.status) }]}>
              {vehicle.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <DetailRow 
            icon="card-outline" 
            label="Number Plate" 
            value={vehicle.numberPlate}
          />
          <View style={styles.divider} />
          
          <DetailRow 
            icon="flash-outline" 
            label="Price Per Km" 
            value={`₹${vehicle.pricePerKm}`}
          />
          <View style={styles.divider} />
          
          <DetailRow 
            icon="people-outline" 
            label="Seats" 
            value={`${vehicle.seats || 1} seats`}
          />
          <View style={styles.divider} />
          
          <DetailRow 
            icon="calendar-outline" 
            label="Created On" 
            value={new Date(vehicle.createdAt).toDateString()}
          />
        </View>

        {/* Documents Section */}
        {(vehicle.licenceUrl || vehicle.image) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Documents</Text>
            
            {vehicle.licenceUrl && (
              <TouchableOpacity style={styles.documentButton}>
                <Ionicons name="document-attach-outline" size={20} color="#2196F3" />
                <Text style={styles.documentText}>Driver License</Text>
                <Ionicons name="download-outline" size={18} color="#999" />
              </TouchableOpacity>
            )}
            
            {vehicle.image && (
              <TouchableOpacity style={[styles.documentButton, vehicle.licenceUrl && styles.documentButtonSpacing]}>
                <Ionicons name="image-outline" size={20} color="#2196F3" />
                <Text style={styles.documentText}>Vehicle Photo</Text>
                <Ionicons name="download-outline" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle ID:</Text>
            <Text style={styles.infoValue}>{vehicle._id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Status:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(vehicle.status) }]}>
              {vehicle.status?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{new Date(vehicle.updatedAt).toLocaleString()}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity 
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFF" />
              <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={20} color="#2196F3" style={styles.rowIcon} />
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

export default VehicleDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  vehicleImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  vehicleType: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  rowIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentButtonSpacing: {
    marginBottom: 0,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FFBFBF',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
