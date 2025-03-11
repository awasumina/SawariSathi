
// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import LoginScreen from '../screens/LoginScreen';
// import RegisterScreen from '../screens/RegisterScreen';
// import HomeScreen from '../screens/HomeScreen';
// import SearchScreen from '../screens/SearchScreen';
// import SearchResults from '../components/SearchResults';
// import VehicleDetails from '../components/VehicleDetails';
// import ProfileScreen from '../screens/ProfileScreen';
// import MapScreen from '../screens/MapScreen';
// import { Entypo, AntDesign, Ionicons, FontAwesome } from '@expo/vector-icons';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// const BottomTabs = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor: '#008E97',
//         tabBarInactiveTintColor: 'black',
//       }}
//     >
//       <Tab.Screen
//         name="HomeTab"
//         component={HomeScreen}
//         options={{
//           tabBarLabel: 'Home',
//           headerShown: false,
//           tabBarIcon: ({ focused, color }) =>
//             focused ? <Entypo name="home" size={24} color={color} /> : <AntDesign name="home" size={24} color={color} />,
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileScreen}
//         options={{
//           tabBarLabel: 'Profile',
//           tabBarIcon: ({ focused, color }) =>
//             focused ? <Ionicons name="person" size={24} color={color} /> : <Ionicons name="person-outline" size={24} color={color} />,
//         }}
//       />
//       <Tab.Screen
//         name="Map"
//         component={MapScreen}
//         options={{
//           tabBarLabel: 'Map',
//           headerShown: false,
//           tabBarIcon: ({ focused, color }) =>
//             <FontAwesome name="map-marker" size={24} color={color} />,
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// const StackNavigator = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         <Stack.Screen 
//           name="Login" 
//           component={LoginScreen} 
//           options={{ headerShown: false }} 
//         />
//         <Stack.Screen 
//           name="Register" 
//           component={RegisterScreen} 
//           options={{ headerShown: false }} 
//         />
//         <Stack.Screen
//           name="Home"
//           component={BottomTabs}
//           options={{ headerShown: false }}
//         />
//         <Stack.Screen name="SearchScreen" component={SearchScreen} />
//         <Stack.Screen name="SearchResults" component={SearchResults} />
//         <Stack.Screen name="VehicleDetails" component={VehicleDetails} />
//         <Stack.Screen name="MapScreen" component={MapScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default StackNavigator;
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SearchResults from '../components/SearchResults';
import VehicleDetails from '../components/VehicleDetails';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';
import { Entypo, AntDesign, Ionicons, FontAwesome } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#008E97',
        tabBarInactiveTintColor: 'black',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            focused ? <Entypo name="home" size={24} color={color} /> : <AntDesign name="home" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) =>
            focused ? <Ionicons name="person" size={24} color={color} /> : <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          headerShown: false,
          tabBarIcon: ({ focused, color }) =>
            <FontAwesome name="map-marker" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const StackNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="SearchResults" component={SearchResults} />
        <Stack.Screen name="VehicleDetails" component={VehicleDetails} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;
