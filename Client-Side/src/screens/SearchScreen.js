
// import React, { useState, useEffect } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   ImageBackground,
//   StatusBar,
//   Modal,
//   ScrollView,
//   ActivityIndicator,
//   TextInput,
//   Alert,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';

// const { width, height } = Dimensions.get('window');
// const API_BASE_URL = 'http://192.168.2.103:3000/api';

// const SearchScreen = ({ navigation }) => {
//   const [fromLocation, setFromLocation] = useState('');
//   const [toLocation, setToLocation] = useState('');
//   const [showFromDropdown, setShowFromDropdown] = useState(false);
//   const [showToDropdown, setShowToDropdown] = useState(false);
//   const [locations, setLocations] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const res = await axios.get(`${API_BASE_URL}/stops`);
//         const uniqueLocations = res.data.data.reduce((acc, current) => {
//           if (!acc.find(item => item.name === current.stops_name)) {
//             acc.push({
//               id: current.id,
//               name: current.stops_name,
//               lat: current.stops_lat,
//               lon: current.stops_lon
//             });
//           }
//           return acc;
//         }, []);
//         setLocations(uniqueLocations);
//       } catch (error) {
//         console.error('Locations fetch error:', error);
//         Alert.alert('Error', 'Failed to load locations. Please try again.');
//       } finally {
//         setInitialLoading(false);
//       }
//     };

//     fetchLocations();
//   }, []);

//   const filteredLocations = locations.filter(location =>
//     location.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const transformRouteData = (apiData) => {
//     return {
//       id: apiData.fare?.route_yatayat_id || Math.random(),
//       vehicle: {
//         type: 'Bus', // Default value, update with actual API data
//         name: `Route ${apiData.fare?.route_yatayat_id || ''}`,
//         count: 5, // Default value
//       },
//       fare: apiData.fare?.fare || 0,
//       discountedFare: apiData.fare?.discounted_fare || 0,
//       stops: apiData.stops,
//       distance: calculateDistance(apiData.stops), // Implement your distance calculation
//       estimatedTime: '06:00 AM - 08:00 PM' // Update with actual timing data
//     };
//   };

//   const calculateDistance = (stops) => {
//     // Implement your distance calculation logic here
//     return '4.3'; // Sample distance
//   };

//   const handleSearch = async () => {
//     if (!fromLocation || !toLocation) {
//       Alert.alert('Error', 'Please select both locations');
//       return;
//     }
    
//     if (fromLocation === toLocation) {
//       Alert.alert('Error', 'Departure and arrival locations cannot be the same');
//       return;
//     }

//     setLoading(true);
//     try {
//       const fromStop = locations.find(stop => stop.name === fromLocation);
//       const toStop = locations.find(stop => stop.name === toLocation);

//       const response = await axios.get(
//         `${API_BASE_URL}/routes/stops?stop1=${fromStop.id}&stop2=${toStop.id}`
//       );
      
//       if (!response.data.data) {
//         Alert.alert('No Routes', 'No available routes found for selected stops');
//         return;
//       }

//       const transformedData = transformRouteData(response.data.data);

//       navigation.navigate('SearchResults', {
//         results: [transformedData],
//         fromLocation,
//         toLocation
//       });
//     } catch (error) {
//       console.error('Search error:', error);
//       Alert.alert('Error', 'Failed to fetch routes. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const LocationDropdown = ({ visible, onClose, onSelect, currentValue }) => (
//     <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
//       <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
//         <View style={styles.dropdownContainer}>
//           <View style={styles.dropdownHeader}>
//             <Text style={styles.dropdownTitle}>Select Location</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="close" size={24} color="#000" />
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.searchContainer}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search locations..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               autoFocus={true}
//             />
//           </View>

//           {initialLoading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#007AFF" />
//             </View>
//           ) : (
//             <ScrollView style={styles.dropdownList}>
//               {filteredLocations.map((location) => (
//                 <TouchableOpacity
//                   key={location.id}
//                   style={[
//                     styles.dropdownItem,
//                     currentValue === location.name && styles.selectedItem
//                   ]}
//                   onPress={() => {
//                     onSelect(location.name);
//                     setSearchQuery('');
//                     onClose();
//                   }}
//                 >
//                   <View style={styles.locationInfo}>
//                     <Ionicons
//                       name="location-sharp"
//                       size={20}
//                       color={currentValue === location.name ? '#007AFF' : '#666'}
//                     />
//                     <Text style={styles.locationName}>{location.name}</Text>
//                   </View>
//                   {currentValue === location.name && (
//                     <Ionicons name="checkmark" size={24} color="#007AFF" />
//                   )}
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           )}
//         </View>
//       </TouchableOpacity>
//     </Modal>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       <ImageBackground
//         source={require('../../assets/cityy.png')}
//         style={styles.headerBackground}
//       >
//         <View style={styles.overlay}>
//           <Text style={styles.headerTitle}>SawariSathi</Text>
//           <Text style={styles.headerSubtitle}>Your smart travel companion</Text>
//         </View>
//       </ImageBackground>

//       <View style={styles.content}>
//         <Text style={styles.title}>Plan Your Journey</Text>

//         <View style={styles.inputsContainer}>
//           <TouchableOpacity
//             style={styles.locationInput}
//             onPress={() => {
//               setSearchQuery('');
//               setShowFromDropdown(true);
//             }}
//           >
//             <Ionicons name="location" size={20} color="#666" />
//             <Text style={[styles.inputText, !fromLocation && styles.placeholderText]}>
//               {fromLocation || 'Select departure point'}
//             </Text>
//             <Ionicons name="chevron-down" size={20} color="#666" />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.locationInput}
//             onPress={() => {
//               setSearchQuery('');
//               setShowToDropdown(true);
//             }}
//           >
//             <Ionicons name="location" size={20} color="#666" />
//             <Text style={[styles.inputText, !toLocation && styles.placeholderText]}>
//               {toLocation || 'Select destination'}
//             </Text>
//             <Ionicons name="chevron-down" size={20} color="#666" />
//           </TouchableOpacity>
//         </View>

//         <LocationDropdown
//           visible={showFromDropdown}
//           onClose={() => setShowFromDropdown(false)}
//           onSelect={setFromLocation}
//           currentValue={fromLocation}
//         />

//         <LocationDropdown
//           visible={showToDropdown}
//           onClose={() => setShowToDropdown(false)}
//           onSelect={setToLocation}
//           currentValue={toLocation}
//         />

//         <TouchableOpacity
//           style={[
//             styles.searchButton,
//             (!fromLocation || !toLocation) && styles.searchButtonDisabled
//           ]}
//           disabled={!fromLocation || !toLocation || loading}
//           onPress={handleSearch}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.searchButtonText}>Find Route</Text>
//           )}
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   headerBackground: {
//     height: height * 0.25,
//     width: width,
//   },
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#fff',
//     marginTop: 8,
//   },
//   content: {
//     flex: 1,
//     backgroundColor: '#fff',
//     marginTop: -20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 20,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '600',
//     marginBottom: 20,
//   },
//   inputsContainer: {
//     gap: 12,
//     marginBottom: 20,
//   },
//   locationInput: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     gap: 12,
//   },
//   inputText: {
//     flex: 1,
//     fontSize: 16,
//     color: '#000',
//   },
//   placeholderText: {
//     color: '#666',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   dropdownContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: height * 0.7,
//   },
//   dropdownHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   dropdownTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   dropdownList: {
//     padding: 16,
//   },
//   dropdownItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   selectedItem: {
//     backgroundColor: '#f8f9fa',
//   },
//   locationInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   locationName: {
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   searchButton: {
//     backgroundColor: '#ff6b00',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   searchButtonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   searchButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     padding: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   searchContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   searchInput: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//   },
// });

// export default SearchScreen;


import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ImageBackground,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.1.69:3000/api';

const SearchScreen = ({ navigation }) => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/stops`);
        const uniqueLocations = res.data.data.reduce((acc, current) => {
          if (!acc.find(item => item.name === current.stops_name)) {
            acc.push({
              id: current.id,
              name: current.stops_name,
              lat: current.stops_lat,
              lon: current.stops_lon
            });
          }
          return acc;
        }, []);
        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Locations fetch error:', error);
        Alert.alert('Error', 'Failed to load locations. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const transformRouteData = (apiData) => {
    return {
      id: apiData.fare?.route_yatayat_id || Math.random(),
      vehicle: {
        type: 'Bus',
        name: `Route ${apiData.fare?.route_yatayat_id || ''}`,
        count: 5,
      },
      fare: apiData.fare?.fare || 0,
      discountedFare: apiData.fare?.discounted_fare || 0,
      stops: apiData.stops,
      distance: calculateDistance(apiData.stops),
      estimatedTime: '06:00 AM - 08:00 PM'
    };
  };

  const calculateDistance = (stops) => {
    if (!stops || stops.length < 2) return '0';
    // Simple distance calculation (for demo)
    const latDiff = stops[stops.length-1].stops_lat - stops[0].stops_lat;
    const lonDiff = stops[stops.length-1].stops_lon - stops[0].stops_lon;
    return (Math.sqrt(latDiff*latDiff + lonDiff*lonDiff) * 111.32); // Convert to km
  };

  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please select both locations');
      return;
    }
    
    if (fromLocation === toLocation) {
      Alert.alert('Error', 'Departure and arrival locations cannot be the same');
      return;
    }

    setLoading(true);
    try {
      const fromStop = locations.find(stop => stop.name === fromLocation);
      const toStop = locations.find(stop => stop.name === toLocation);

      const response = await axios.get(
        `${API_BASE_URL}/routes/stops?stop1=${fromStop.id}&stop2=${toStop.id}`
      );
      
      if (!response.data.data) {
        Alert.alert('No Routes', 'No available routes found for selected stops');
        return;
      }

      const transformedData = transformRouteData(response.data.data);

      navigation.navigate('SearchResults', {
        results: [transformedData],
        fromLocation,
        toLocation
      });
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to fetch routes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const LocationDropdown = ({ visible, onClose, onSelect, currentValue }) => (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Select Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
          </View>

          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView style={styles.dropdownList}>
              {filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.dropdownItem,
                    currentValue === location.name && styles.selectedItem
                  ]}
                  onPress={() => {
                    onSelect(location.name);
                    setSearchQuery('');
                    onClose();
                  }}
                >
                  <View style={styles.locationInfo}>
                    <Ionicons
                      name="location-sharp"
                      size={20}
                      color={currentValue === location.name ? '#007AFF' : '#666'}
                    />
                    <Text style={styles.locationName}>{location.name}</Text>
                  </View>
                  {currentValue === location.name && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/cityy.png')}
        style={styles.headerBackground}
      >
        <View style={styles.overlay}>
          <Text style={styles.headerTitle}>SawariSathi</Text>
          <Text style={styles.headerSubtitle}>Your smart travel companion</Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>Plan Your Journey</Text>

        <View style={styles.inputsContainer}>
          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => {
              setSearchQuery('');
              setShowFromDropdown(true);
            }}
          >
            <Ionicons name="location" size={20} color="#666" />
            <Text style={[styles.inputText, !fromLocation && styles.placeholderText]}>
              {fromLocation || 'Select departure point'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationInput}
            onPress={() => {
              setSearchQuery('');
              setShowToDropdown(true);
            }}
          >
            <Ionicons name="location" size={20} color="#666" />
            <Text style={[styles.inputText, !toLocation && styles.placeholderText]}>
              {toLocation || 'Select destination'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <LocationDropdown
          visible={showFromDropdown}
          onClose={() => setShowFromDropdown(false)}
          onSelect={setFromLocation}
          currentValue={fromLocation}
        />

        <LocationDropdown
          visible={showToDropdown}
          onClose={() => setShowToDropdown(false)}
          onSelect={setToLocation}
          currentValue={toLocation}
        />

        <TouchableOpacity
          style={[
            styles.searchButton,
            (!fromLocation || !toLocation) && styles.searchButtonDisabled
          ]}
          disabled={!fromLocation || !toLocation || loading}
          onPress={handleSearch}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Find Route</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    height: height * 0.25,
    width: width,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownList: {
    padding: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f8f9fa',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#ff6b00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default SearchScreen;