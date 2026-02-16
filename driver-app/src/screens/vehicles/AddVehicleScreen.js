import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';


const AddVehicleScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState('car'); 
  const [numberPlate, setNumberPlate] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [seats, setSeats] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const vehicleTypes = ['car', 'bike', 'van', 'truck'];

  const onSubmit = async () => {
    if (!name || !type || !numberPlate || !pricePerKm) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('name', name);
      form.append('type', type);
      form.append('numberPlate', numberPlate.toUpperCase());
      form.append('pricePerKm', Number(pricePerKm));
      if (seats) form.append('seats', Number(seats));

      console.log('=== VEHICLE SUBMISSION ===');
      console.log('Token exists:', !!token);
      console.log('Form data:', { name, type, numberPlate, pricePerKm, seats });

      await apiRequest('/vehicles', {
        method: 'POST',
        body: form,
      }, token);

      Alert.alert('Success', 'Vehicle submitted for approval.');
      navigation.goBack();
    } catch (err) {
      console.log('=== VEHICLE ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      Alert.alert('Error', err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          
          <InputField 
            label="Vehicle Name" 
            icon="car-sport-outline" 
            placeholder="e.g. Toyota Camry"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.typeSelector}>
            {vehicleTypes.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.typeButton, type === item && styles.typeButtonActive]}
                onPress={() => setType(item)}
              >
                <Text style={[styles.typeButtonText, type === item && styles.typeButtonTextActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField 
            label="Number Plate" 
            icon="card-outline" 
            placeholder="e.g. ABC-1234"
            value={numberPlate}
            onChangeText={setNumberPlate}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField 
                label="Price / km" 
                icon="pricetag-outline" 
                placeholder="0.00"
                keyboardType="numeric"
                value={pricePerKm}
                onChangeText={setPricePerKm}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField 
                label="Seats" 
                icon="people-outline" 
                placeholder="4"
                keyboardType="numeric"
                value={seats}
                onChangeText={setSeats}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Register Vehicle</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0D7F5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

const InputField = React.memo(({ label, icon, value, onChangeText, placeholder, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={label === 'Number Plate' ? 'characters' : 'sentences'}
      />
    </View>
  </View>
));

export default AddVehicleScreen;