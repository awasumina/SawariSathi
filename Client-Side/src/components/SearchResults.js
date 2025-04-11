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
//   ImageBackground,
//   Dimensions,
//   useWindowDimensions
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const getVehicleIcon = (vehicleType) => {
//   switch ((vehicleType || '').toLowerCase()) {
//     case 'bus': return 'bus-outline';
//     case 'microbus': return 'car-sport-outline';
//     case 'tempo': return 'car-outline';
//     default: return 'bus-outline';
//   }
// };

// const TransportCard = ({ route, navigation, fromLocation, toLocation }) => {
//   const { width } = useWindowDimensions();
//   const timing = route.estimatedTime || '6:00 AM - 8:00 PM';
  
//   return (
//     <TouchableOpacity 
//       style={[styles.cardContainer, { width: width * 0.9 }]}
//       onPress={() => navigation.navigate('VehicleDetails', { 
//         transport: route,
//         fromLocation,
//         toLocation 
//       })}
//     >
//       <View style={styles.transportCard}>
//         <View style={styles.transportIconContainer}>
//           <Ionicons 
//             name={getVehicleIcon(route.vehicle?.type)} 
//             size={width * 0.06} 
//             color="#ff6b00" 
//           />
//         </View>
        
//         <View style={styles.transportInfo}>
//           <View style={styles.transportHeader}>
//             <Text style={[styles.transportName, { fontSize: width * 0.04 }]}>
//               {route.vehicle?.name || 'Transport'}
//             </Text>
//             <Text style={[styles.transportCount, { fontSize: width * 0.035 }]}>
//               {route.vehicle?.count || '5'} vehicles
//             </Text>
//           </View>
          
//           <View style={styles.transportDetails}>
//             <Text style={[styles.fareText, { fontSize: width * 0.035 }]}>
//               <Text style={styles.rupeeText}>Rs. </Text>
//               {route.fare || '0'}
//             </Text>
//             <View style={styles.dotSeparator} />
//             <Text style={[styles.distanceText, { fontSize: width * 0.035 }]}>
//               {route.distance ? `${route.distance} km` : '4.3 km'}
//             </Text>
//             <View style={styles.dotSeparator} />
//             <Text style={[styles.timingText, { fontSize: width * 0.035 }]}>{timing}</Text>
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const SearchResults = ({ route, navigation }) => {
//   const { results, fromLocation, toLocation } = route.params;
//   const { width, height } = useWindowDimensions();

//   return (
//     <SafeAreaView style={styles.container}>
//       <ImageBackground
//         source={require('../../assets/city-background.jpg')}
//         style={[styles.headerBackground, { height: height * 0.25 }]}
//         resizeMode="cover"
//       >
//         <View style={styles.headerOverlay}>
//           <Text style={[styles.headerTitle, { fontSize: width * 0.08 }]}>Available Routes</Text>
//           <Text style={[styles.routePath, { fontSize: width * 0.04 }]}>
//             {fromLocation} → {toLocation}
//           </Text>
//         </View>
//       </ImageBackground>

//       <ScrollView 
//         contentContainerStyle={[styles.scrollContainer, { paddingBottom: height * 0.05 }]}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={[styles.resultsContainer, { width: width * 0.95 }]}>
//           <Text style={[styles.resultsCount, { fontSize: width * 0.045 }]}>
//             {results.length} route{results.length !== 1 ? 's' : ''} found
//           </Text>
          
//           {results.length > 0 ? (
//             results.map((route, index) => (
//               <TransportCard 
//                 key={`route-${index}`}
//                 route={route}
//                 navigation={navigation}
//                 fromLocation={fromLocation}
//                 toLocation={toLocation}
//               />
//             ))
//           ) : (
//             <View style={[styles.noResultsContainer, { marginTop: height * 0.2 }]}>
//               <Ionicons name="alert-circle-outline" size={width * 0.15} color="#ccc" />
//               <Text style={[styles.noResultsText, { fontSize: width * 0.05 }]}>No routes found</Text>
//               <Text style={[styles.noResultsSubtext, { fontSize: width * 0.035 }]}>
//                 Try different locations or check back later
//               </Text>
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       <TouchableOpacity 
//         style={[styles.backButton, { 
//           top: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
//           width: width * 0.1,
//           height: width * 0.1
//         }]}
//         onPress={() => navigation.goBack()}
//       >
//         <Ionicons name="arrow-back" size={width * 0.06} color="#fff" />
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   headerBackground: {
//     width: '100%',
//     justifyContent: 'flex-end',
//   },
//   headerOverlay: {
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 20,
//   },
//   headerTitle: {
//     fontWeight: 'bold',
//     color: '#fff',
//     textAlign: 'center',
//   },
//   routePath: {
//     color: '#fff',
//     textAlign: 'center',
//     marginTop: 5,
//   },
//   scrollContainer: {
//     alignItems: 'center',
//   },
//   resultsContainer: {
//     alignItems: 'center',
//   },
//   resultsCount: {
//     color: '#666',
//     marginBottom: 15,
//     alignSelf: 'flex-start',
//   },
//   cardContainer: {
//     marginBottom: 15,
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   transportCard: {
//     flexDirection: 'row',
//     padding: 15,
//     alignItems: 'center',
//   },
//   transportIconContainer: {
//     width: '12%',
//     aspectRatio: 1,
//     borderRadius: 25,
//     backgroundColor: '#fff5ec',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   transportInfo: {
//     flex: 1,
//   },
//   transportHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 5,
//   },
//   transportName: {
//     fontWeight: '600',
//     color: '#333',
//   },
//   transportCount: {
//     color: '#666',
//   },
//   transportDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   fareText: {
//     color: '#333',
//   },
//   rupeeText: {
//     color: '#ff6b00',
//     fontWeight: 'bold',
//   },
//   dotSeparator: {
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: '#ccc',
//     marginHorizontal: 8,
//   },
//   distanceText: {
//     color: '#666',
//   },
//   timingText: {
//     color: '#666',
//   },
//   noResultsContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   noResultsText: {
//     color: '#666',
//     marginTop: 15,
//   },
//   noResultsSubtext: {
//     color: '#999',
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   backButton: {
//     position: 'absolute',
//     left: 15,
//     borderRadius: 20,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default SearchResults;
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
  ImageBackground,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getVehicleIcon = (vehicleType) => {
  switch ((vehicleType || '').toLowerCase()) {
    case 'bus': return 'bus-outline';
    case 'microbus': return 'car-sport-outline';
    case 'tempo': return 'car-outline';
    default: return 'bus-outline';
  }
};

const TransportCard = ({ route, navigation, fromLocation, toLocation }) => {
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const cardWidth = Math.min(width * 0.92, 500); // Max width of 500 on tablets
  
  return (
    <TouchableOpacity 
      style={[
        styles.cardContainer, 
        { 
          width: cardWidth,
          marginBottom: height * 0.018,
          borderRadius: 12,
          padding: width * 0.04
        }
      ]}
      onPress={() => navigation.navigate('VehicleDetails', { 
        transport: route,
        fromLocation,
        toLocation 
      })}
    >
      <View style={styles.transportCard}>
        <View style={[
          styles.transportIconContainer,
          {
            width: width * 0.12,
            height: width * 0.12,
            borderRadius: width * 0.06,
            marginRight: width * 0.04
          }
        ]}>
          <Ionicons 
            name={getVehicleIcon(route.vehicle?.type)} 
            size={width * 0.06} 
            color="#ff6b00" 
          />
        </View>
        
        <View style={styles.transportInfo}>
          <View style={styles.transportHeader}>
            <Text 
              style={[
                styles.transportName, 
                { 
                  fontSize: width * 0.042,
                  maxWidth: cardWidth * 0.6
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {route.vehicle?.name || 'Transport'}
            </Text>
            <Text style={[styles.transportCount, { fontSize: width * 0.035 }]}>
              {route.vehicle?.count || '5'} vehicles
            </Text>
          </View>
          
          <View style={[
            styles.transportDetails,
            { marginTop: height * 0.008 }
          ]}>
            <View style={styles.detailItem}>
              <Text style={[styles.fareText, { fontSize: width * 0.035 }]}>
                <Text style={styles.rupeeText}>Rs. </Text>
                {route.fare || '0'}
              </Text>
            </View>
            
            <View style={styles.dotSeparator} />
            
            <View style={styles.detailItem}>
              <Text style={[styles.distanceText, { fontSize: width * 0.035 }]}>
                {route.distance ? `${route.distance} km` : '4.3 km'}
              </Text>
            </View>
            
            <View style={styles.dotSeparator} />
            
            <View style={styles.detailItem}>
              <Text 
                style={[styles.timingText, { fontSize: width * 0.035 }]}
                numberOfLines={1}
              >
                {route.estimatedTime || '6:00 AM - 8:00 PM'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SearchResults = ({ route, navigation }) => {
  const { results, fromLocation, toLocation } = route.params;
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375;
  const headerHeight = isSmallDevice ? height * 0.22 : height * 0.25;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/city-background.jpg')}
        style={[styles.headerBackground, { height: headerHeight }]}
        resizeMode="cover"
      >
        <View style={[
          styles.headerOverlay,
          { 
            paddingHorizontal: width * 0.05,
            paddingVertical: height * 0.03
          }
        ]}>
          <Text 
            style={[
              styles.headerTitle, 
              { 
                fontSize: width * 0.08,
                marginBottom: height * 0.01
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Available Routes
          </Text>
          <Text 
            style={[
              styles.routePath, 
              { 
                fontSize: width * 0.045,
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {fromLocation} → {toLocation}
          </Text>
        </View>
      </ImageBackground>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { 
            paddingTop: height * 0.025,
            paddingBottom: height * 0.07
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.resultsContainer, { width: width * 0.92 }]}>
          <Text 
            style={[
              styles.resultsCount, 
              { 
                fontSize: width * 0.045,
                marginBottom: height * 0.02
              }
            ]}
          >
            {results.length} route{results.length !== 1 ? 's' : ''} found
          </Text>
          
          {results.length > 0 ? (
            results.map((route, index) => (
              <TransportCard 
                key={`route-${index}`}
                route={route}
                navigation={navigation}
                fromLocation={fromLocation}
                toLocation={toLocation}
              />
            ))
          ) : (
            <View style={[
              styles.noResultsContainer, 
              { 
                padding: width * 0.1,
                marginTop: height * 0.1
              }
            ]}>
              <Ionicons 
                name="alert-circle-outline" 
                size={width * 0.2} 
                color="#ccc" 
              />
              <Text style={[
                styles.noResultsText, 
                { 
                  fontSize: width * 0.05,
                  marginTop: height * 0.03
                }
              ]}>
                No routes found
              </Text>
              <Text style={[
                styles.noResultsSubtext, 
                { 
                  fontSize: width * 0.038,
                  marginTop: height * 0.015
                }
              ]}>
                Try different locations or check back later
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.backButton, 
          { 
            top: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
            left: width * 0.05,
            width: width * 0.12,
            height: width * 0.12,
            borderRadius: width * 0.06
          }
        ]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons 
          name="arrow-back" 
          size={width * 0.06} 
          color="#fff" 
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  routePath: {
    color: '#fff',
    textAlign: 'center',
  },
  scrollContainer: {
    alignItems: 'center',
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsCount: {
    color: '#666',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  cardContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportIconContainer: {
    backgroundColor: '#fff5ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportInfo: {
    flex: 1,
  },
  transportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transportName: {
    fontWeight: '600',
    color: '#333',
  },
  transportCount: {
    color: '#666',
  },
  transportDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexShrink: 1,
  },
  fareText: {
    color: '#333',
  },
  rupeeText: {
    color: '#ff6b00',
    fontWeight: 'bold',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
  distanceText: {
    color: '#666',
  },
  timingText: {
    color: '#666',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: '#666',
    fontWeight: '600',
  },
  noResultsSubtext: {
    color: '#999',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchResults;