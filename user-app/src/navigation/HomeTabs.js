import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import AvailableVehiclesScreen from '../screens/vehicles/AvailableVehiclesScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import NewBookingScreen from '../screens/bookings/NewBookingScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const VehiclesStackNav = createNativeStackNavigator();
const BookingsStackNav = createNativeStackNavigator();


// -------- VEHICLES STACK --------
const VehiclesStack = () => (
  <VehiclesStackNav.Navigator
    screenOptions={{
      headerShown: true,
      headerTitleAlign: 'center',
    }}
  >
    <VehiclesStackNav.Screen
      name="AvailableVehicles"
      component={AvailableVehiclesScreen}
      options={{ title: 'Available Vehicles' }}
    />

    <VehiclesStackNav.Screen
      name="VehicleDetail"
      component={VehicleDetailScreen}
      options={{ title: 'Vehicle Details' }}
    />

    <VehiclesStackNav.Screen
      name="NewBooking"
      component={NewBookingScreen}
      options={{ title: 'Book Vehicle' }}
    />
  </VehiclesStackNav.Navigator>
);


// -------- BOOKINGS STACK --------
const BookingsStack = () => (
  <BookingsStackNav.Navigator screenOptions={{ headerShown: false }}>
    <BookingsStackNav.Screen name="MyBookings" component={MyBookingsScreen} />
    <BookingsStackNav.Screen name="BookingDetail" component={BookingDetailScreen} />
  </BookingsStackNav.Navigator>
);


// -------- TABS --------
const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#007bff',
      tabBarInactiveTintColor: 'gray',
      tabBarIcon: ({ color, size, focused }) => {
        let iconName;

        if (route.name === 'VehiclesTab') {
          iconName = focused ? 'car' : 'car-outline';
        } 
        else if (route.name === 'BookingsTab') {
          iconName = focused ? 'document-text' : 'document-text-outline';
        } 
        else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="VehiclesTab" component={VehiclesStack} options={{ tabBarLabel: 'Vehicles' }} />
    <Tab.Screen name="BookingsTab" component={BookingsStack} options={{ tabBarLabel: 'Bookings' }} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

export default HomeTabs;
