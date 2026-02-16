import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import MyVehiclesScreen from '../screens/vehicles/MyVehiclesScreen';
import AddVehicleScreen from '../screens/vehicles/AddVehicleScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VehicleDetailsScreen from '../screens/vehicles/VehicleDetailsScreen';

const Tab = createBottomTabNavigator();
const VehiclesStackNav = createNativeStackNavigator();
const BookingsStackNav = createNativeStackNavigator();

const VehiclesStack = () => (
  <VehiclesStackNav.Navigator>
    <VehiclesStackNav.Screen
      name="MyVehicles"
      component={MyVehiclesScreen}
      options={{ title: 'My Vehicles' }}
    />
    <VehiclesStackNav.Screen
      name="AddVehicle"
      component={AddVehicleScreen}
      options={{ title: 'Add Vehicle' }}
    />
    <VehiclesStackNav.Screen
      name="VehicleDetails"
      component={VehicleDetailsScreen}
      options={{ title: 'Vehicle Details' }}
    />
  </VehiclesStackNav.Navigator>
);

const BookingsStack = () => (
  <BookingsStackNav.Navigator>
    <BookingsStackNav.Screen
      name="MyBookings"
      component={MyBookingsScreen}
      options={{ title: 'My Bookings' }}
    />
    <BookingsStackNav.Screen
      name="BookingDetail"
      component={BookingDetailScreen}
      options={{ title: 'Booking Detail' }}
    />
  </BookingsStackNav.Navigator>
);

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      // FIX: This hides the Tab header so only the Stack header shows
      headerShown: false, 
      tabBarIcon: ({ color, size, focused }) => {
        let iconName;
        if (route.name === 'VehiclesTab') {
          iconName = focused ? 'car' : 'car-outline';
        } 
        else if (route.name === 'BookingsTab') {
          iconName = focused ? 'receipt' : 'receipt-outline';
        } 
        else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen 
      name="VehiclesTab" 
      component={VehiclesStack} 
      options={{ title: 'Vehicles' }} 
    />
    <Tab.Screen 
      name="BookingsTab" 
      component={BookingsStack} 
      options={{ title: 'Bookings' }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ 
        headerShown: true, // Show header for Profile because it is not a Stack
        title: 'My Profile' 
      }} 
    />
  </Tab.Navigator>
);

export default HomeTabs;