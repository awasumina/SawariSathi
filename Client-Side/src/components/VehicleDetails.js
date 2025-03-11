
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // Define the getVehicleIcon function
// const getVehicleIcon = (vehicleType) => {
//   switch (vehicleType) {
//     case 'bus':
//       return 'bus-outline';
//     case 'car':
//       return 'car-outline';
//     case 'bike':
//       return 'bicycle-outline';
//     default:
//       return 'help-outline';
//   }
// };

// const VehicleDetails = ({ route, navigation }) => {
//   const { transport } = route.params;
//   const stops = transport.stops?.length > 0
//   ? transport.stops // Use stops provided by backend
//   : ['Koteshwor', 'Tinkune', 'Baneshwor', 'Putalisadak'];

//   const RouteStop = ({ name, isLast }) => (
//     <View style={styles.stopContainer}>
//       <View style={styles.stopIndicator}>
//         <View style={styles.dot} />
//         {!isLast && <View style={styles.line} />}
//       </View>
//       <Text style={styles.stopText}>{name}</Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerContent}>
//             <View style={styles.routeInfo}>
//               <Ionicons 
//                 name={getVehicleIcon(transport.vehicle?.type)} 
//                 size={24} 
//                 color="#ff6b00" 
//               />
//               <Text style={styles.routeTitle}>
//                 {transport.vehicle?.name || 'Riddhi Siddhi Travels'}
//               </Text>
//             </View>
//             <Text style={styles.routePath}>{transport.from} ⟶ {transport.to}</Text>
//           </View>
//         </View>

//         {/* Info Card */}
//         <View style={styles.infoCard}>
//           <View style={styles.infoRow}>
//             <View style={styles.infoItem}>
//               <Ionicons name="cash-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>Rs. {transport.fare}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Ionicons name="map-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>{transport.distance} km</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Ionicons name="time-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>{transport.vehicle?.count} {transport.vehicle?.type}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Route Details */}
//         <View style={styles.routeDetails}>
//           <View style={styles.routeHeader}>
//             <Text style={styles.routeNumber}>Route No: 23</Text>
//             <Text style={styles.timing}>{transport.estimatedTime}</Text>
//           </View>

//           {/* Stops */}
//           <View style={styles.stopsContainer}>
//             {stops.map((stop, index) => (
//               <RouteStop 
//                 key={stop} 
//                 name={stop} 
//                 isLast={index === stops.length - 1} 
//               />
//             ))}
//           </View>

//           <Text style={styles.discountText}>
//             *Students with valid ID cards get a 45% discount on the fare.
//           </Text>

//           <TouchableOpacity style={styles.mapButton}>
//             <Ionicons name="map" size={20} color="#fff" />
//             <Text style={styles.mapButtonText}>View in Maps</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   header: {
//     backgroundColor: '#fff5ec',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   headerContent: {
//     gap: 8,
//   },
//   routeInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   routeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   routePath: {
//     color: '#666',
//   },
//   infoCard: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 8,
//     elevation: 2,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   infoItem: {
//     alignItems: 'center',
//     gap: 4,
//   },
//   infoText: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
//   routeDetails: {
//     padding: 16,
//   },
//   routeHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   routeNumber: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   timing: {
//     color: '#666',
//   },
//   stopsContainer: {
//     marginVertical: 20,
//   },
//   stopContainer: {
//     flexDirection: 'row',
//     marginBottom: 24,
//   },
//   stopIndicator: {
//     alignItems: 'center',
//     width: 20,
//     marginRight: 12,
//   },
//   dot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#ff6b00',
//   },
//   line: {
//     width: 2,
//     height: 40,
//     backgroundColor: '#ddd',
//     marginTop: 4,
//   },
//   stopText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   discountText: {
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//     marginVertical: 16,
//   },
//   mapButton: {
//     backgroundColor: '#ff6b00',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//     borderRadius: 8,
//     gap: 8,
//   },
//   mapButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
// });

// export default VehicleDetails;
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // Define the getVehicleIcon function
// const getVehicleIcon = (vehicleType) => {
//   switch (vehicleType) {
//     case 'bus':
//       return 'bus-outline';
//     case 'car':
//       return 'car-outline';
//     case 'bike':
//       return 'bicycle-outline';
//     default:
//       return 'help-outline';
//   }
// };

// const VehicleDetails = ({ route, navigation }) => {
//   const { transport } = route.params;
//   const stops = transport.stops?.length > 0
//     ? transport.stops // Use stops provided by backend
//     : ['Koteshwor', 'Tinkune', 'Baneshwor', 'Putalisadak'];

//   const handleViewMap = () => {
//     navigation.navigate('MapScreen', {
//       fromLocation: transport.from,
//       toLocation: transport.to,
//       stops: stops,
//       routeNumber: transport.routeNumber || '23',
//       vehicleType: transport.vehicle?.type,
//       vehicleName: transport.vehicle?.name
//     });
//   };

//   const RouteStop = ({ name, isLast }) => (
//     <View style={styles.stopContainer}>
//       <View style={styles.stopIndicator}>
//         <View style={styles.dot} />
//         {!isLast && <View style={styles.line} />}
//       </View>
//       <Text style={styles.stopText}>{name}</Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         {/* Header */}
//         <View style={styles.header}>
//           <View style={styles.headerContent}>
//             <TouchableOpacity 
//               style={styles.backButton}
//               onPress={() => navigation.goBack()}
//             >
//               <Ionicons name="arrow-back" size={24} color="#000" />
//             </TouchableOpacity>
//             <View style={styles.routeInfo}>
//               <Ionicons 
//                 name={getVehicleIcon(transport.vehicle?.type)} 
//                 size={24} 
//                 color="#ff6b00" 
//               />
//               <Text style={styles.routeTitle}>
//                 {transport.vehicle?.name || 'Riddhi Siddhi Travels'}
//               </Text>
//             </View>
//             <Text style={styles.routePath}>{transport.from} ⟶ {transport.to}</Text>
//           </View>
//         </View>

//         {/* Info Card */}
//         <View style={styles.infoCard}>
//           <View style={styles.infoRow}>
//             <View style={styles.infoItem}>
//               <Ionicons name="cash-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>Rs. {transport.fare}</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Ionicons name="map-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>{transport.distance} km</Text>
//             </View>
//             <View style={styles.infoItem}>
//               <Ionicons name="time-outline" size={20} color="#666" />
//               <Text style={styles.infoText}>{transport.vehicle?.count} {transport.vehicle?.type}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Route Details */}
//         <View style={styles.routeDetails}>
//           <View style={styles.routeHeader}>
//             <Text style={styles.routeNumber}>Route No: {transport.routeNumber || '23'}</Text>
//             <Text style={styles.timing}>{transport.estimatedTime}</Text>
//           </View>

//           {/* Stops */}
//           <View style={styles.stopsContainer}>
//             {stops.map((stop, index) => (
//               <RouteStop 
//                 key={stop} 
//                 name={stop} 
//                 isLast={index === stops.length - 1} 
//               />
//             ))}
//           </View>

//           <Text style={styles.discountText}>
//             *Students with valid ID cards get a 45% discount on the fare.
//           </Text>

//           <TouchableOpacity 
//             style={styles.mapButton}
//             onPress={handleViewMap}
//           >
//             <Ionicons name="map" size={20} color="#fff" />
//             <Text style={styles.mapButtonText}>View in Maps</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   header: {
//     backgroundColor: '#fff5ec',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   headerContent: {
//     gap: 8,
//   },
//   backButton: {
//     padding: 8,
//     marginLeft: -8,
//   },
//   routeInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   routeTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   routePath: {
//     color: '#666',
//   },
//   infoCard: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 8,
//     elevation: 2,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   infoItem: {
//     alignItems: 'center',
//     gap: 4,
//   },
//   infoText: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
//   routeDetails: {
//     padding: 16,
//   },
//   routeHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   routeNumber: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   timing: {
//     color: '#666',
//   },
//   stopsContainer: {
//     marginVertical: 20,
//   },
//   stopContainer: {
//     flexDirection: 'row',
//     marginBottom: 24,
//   },
//   stopIndicator: {
//     alignItems: 'center',
//     width: 20,
//     marginRight: 12,
//   },
//   dot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#ff6b00',
//   },
//   line: {
//     width: 2,
//     height: 40,
//     backgroundColor: '#ddd',
//     marginTop: 4,
//   },
//   stopText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   discountText: {
//     fontSize: 14,
//     color: '#666',
//     fontStyle: 'italic',
//     marginVertical: 16,
//   },
//   mapButton: {
//     backgroundColor: '#ff6b00',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 16,
//     borderRadius: 8,
//     gap: 8,
//   },
//   mapButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
// });

// export default VehicleDetails;
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getVehicleIcon = (vehicleType) => {
  switch ((vehicleType || '').toLowerCase()) {
    case 'bus': return 'bus-outline';
    case 'microbus': return 'car-sport-outline';
    case 'tempo': return 'car-outline';
    default: return 'help-outline';
  }
};

const VehicleDetails = ({ route, navigation }) => {
  // Validate and normalize backend data
  const { transport } = route.params;
  const safeTransport = {
    ...transport,
    vehicle: {
      type: transport.vehicle?.type || 'bus',
      name: transport.vehicle?.name || 'Unknown Service',
      count: transport.vehicle?.count || 'N/A',
    },
    stops: transport.stops?.map(stop => ({
      name: stop.stops_name || 'Unknown Stop',
      lat: parseFloat(stop.stops_lat) || 0,
      lon: parseFloat(stop.stops_lon) || 0
    })) || [],
    fare: transport.fare ? `Rs. ${transport.fare}` : 'N/A',
    discountedFare: transport.discounted_fare ? `Rs. ${transport.discounted_fare}` : null,
    distance: transport.distance ? `${transport.distance} km` : 'Distance unavailable',
    routeNumber: transport.route_yatayat_id || 'N/A',
    timing: transport.estimated_time || '6:00am - 8:00pm'
  };

  const handleViewMap = () => {
    navigation.navigate('MapScreen', {
      stops: safeTransport.stops,
      routeInfo: {
        number: safeTransport.routeNumber,
        type: safeTransport.vehicle.type,
        name: safeTransport.vehicle.name,
        from: transport.fromLocation,
        to: transport.toLocation
      }
    });
  };

  const RouteStop = ({ stop, isLast }) => (
    <View style={styles.stopContainer}>
      <View style={styles.stopIndicator}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>
      <Text style={styles.stopText}>{stop.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.vehicleHeader}>
            <Ionicons 
              name={getVehicleIcon(safeTransport.vehicle.type)} 
              size={32} 
              color="#ff6b00" 
              style={styles.vehicleIcon}
            />
            <View>
              <Text style={styles.routeName}>{safeTransport.vehicle.name}</Text>
              <Text style={styles.vehicleType}>
                {safeTransport.vehicle.type.toUpperCase()} SERVICE
              </Text>
            </View>
          </View>
          
          <Text style={styles.routePath}>
            {transport.fromLocation} → {transport.toLocation}
          </Text>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="wallet-outline" size={22} color="#666" />
            <Text style={styles.statValue}>
              {safeTransport.fare}
              {safeTransport.discountedFare && (
                <Text style={styles.discountText}> ({safeTransport.discountedFare})</Text>
              )}
            </Text>
            <Text style={styles.statLabel}>Fare</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={22} color="#666" />
            <Text style={styles.statValue}>{safeTransport.distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={22} color="#666" />
            <Text style={styles.statValue}>{safeTransport.timing}</Text>
            <Text style={styles.statLabel}>Timing</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeNumberContainer}>
            <Text style={styles.routeNumber}>Route #{safeTransport.routeNumber}</Text>
            <Text style={styles.vehicleCount}>
              {safeTransport.vehicle.count} vehicles operating
            </Text>
          </View>

          {/* Stops List */}
          <View style={styles.stopsList}>
            {safeTransport.stops.map((stop, index) => (
              <RouteStop 
                key={`${stop.name}-${index}`}
                stop={stop}
                isLast={index === safeTransport.stops.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Map Button */}
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={handleViewMap}
        >
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>View Route Map</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          *Fares and schedules are subject to change without prior notice
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff5ec',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  vehicleIcon: {
    marginRight: 8,
  },
  routeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleType: {
    color: '#666',
    fontSize: 14,
  },
  routePath: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
  },
  discountText: {
    color: '#666',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routeNumberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routeNumber: {
    color: '#666',
  },
  vehicleCount: {
    color: '#666',
  },
  stopsList: {
    marginLeft: 8,
  },
  stopContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stopIndicator: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b00',
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginTop: 4,
  },
  stopText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b00',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
  },
});

export default VehicleDetails;