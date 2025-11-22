import supabase from "../config/supabaseClient.js";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS || '';

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Find nearby bus stops within a specified radius from user's location
export const getNearbyStops = async (req, res) => {
  const { latitude, longitude, radius = 2 } = req.query; // radius in kilometers, default 2km

  try {
    console.log(`Finding nearby stops for location: lat=${latitude}, lng=${longitude}, radius=${radius}km`);

    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    // Validate coordinates
    if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius)) {
      return res.status(400).json({ error: "Invalid coordinates or radius provided" });
    }

    // Get all bus stops
    const { data: allStops, error: stopsError } = await supabase
      .from("stops")
      .select("id, stops_name, stops_lat, stops_lon");

    if (stopsError) {
      console.error("Error fetching stops:", stopsError.message);
      throw stopsError;
    }

    // Filter stops within the specified radius
    const nearbyStops = allStops
      .map(stop => {
        const stopLat = parseFloat(stop.stops_lat);
        const stopLon = parseFloat(stop.stops_lon);
        
        // Skip stops with invalid coordinates
        if (isNaN(stopLat) || isNaN(stopLon)) {
          return null;
        }

        const distance = calculateDistance(userLat, userLon, stopLat, stopLon);
        
        return {
          ...stop,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        };
      })
      .filter(stop => stop !== null && stop.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    console.log(`Found ${nearbyStops.length} stops within ${searchRadius}km radius`);

    res.json({ 
      data: nearbyStops,
      userLocation: { latitude: userLat, longitude: userLon },
      searchRadius: searchRadius
    });

  } catch (err) {
    console.error("Error finding nearby stops:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

// Find routes between two geographical locations (both as coordinates)
export const getRoutesBetweenLocations = async (req, res) => {
  const { fromLat, fromLng, toLat, toLng, radius = 2 } = req.query;

  try {
    console.log(`Finding routes between locations: from (${fromLat}, ${fromLng}) to (${toLat}, ${toLng})`);

    // Validate input
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ 
        error: "fromLat, fromLng, toLat, and toLng are required" 
      });
    }

    const searchRadius = parseFloat(radius);
    
    // Get all bus stops
    const { data: allStops, error: stopsError } = await supabase
      .from("stops")
      .select("id, stops_name, stops_lat, stops_lon");

    if (stopsError) {
      console.error("Error fetching stops:", stopsError.message);
      throw stopsError;
    }

    // Find nearby stops for source location
    const sourceStops = allStops
      .map(stop => {
        const stopLat = parseFloat(stop.stops_lat);
        const stopLon = parseFloat(stop.stops_lon);
        
        if (isNaN(stopLat) || isNaN(stopLon)) return null;

        const distance = calculateDistance(parseFloat(fromLat), parseFloat(fromLng), stopLat, stopLon);
        
        return {
          ...stop,
          distance: Math.round(distance * 100) / 100,
          type: 'source'
        };
      })
      .filter(stop => stop !== null && stop.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Limit to closest 3 source stops

    // Find nearby stops for destination location
    const destinationStops = allStops
      .map(stop => {
        const stopLat = parseFloat(stop.stops_lat);
        const stopLon = parseFloat(stop.stops_lon);
        
        if (isNaN(stopLat) || isNaN(stopLon)) return null;

        const distance = calculateDistance(parseFloat(toLat), parseFloat(toLng), stopLat, stopLon);
        
        return {
          ...stop,
          distance: Math.round(distance * 100) / 100,
          type: 'destination'
        };
      })
      .filter(stop => stop !== null && stop.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Limit to closest 3 destination stops

    if (sourceStops.length === 0 || destinationStops.length === 0) {
      return res.json({
        data: [],
        message: `No bus stops found within ${searchRadius}km of source or destination location`,
        sourceStops,
        destinationStops
      });
    }

    console.log(`Found ${sourceStops.length} source stops and ${destinationStops.length} destination stops`);

    // Find routes between each combination of source and destination stops
    const allRouteOptions = [];

    for (const sourceStop of sourceStops) {
      for (const destStop of destinationStops) {
        try {
          const routeData = await findRoutesBetweenStops(sourceStop.id, destStop.id);
          
          if (routeData && routeData.length > 0) {
            routeData.forEach(route => {
              route.walkingInfo = {
                toSourceStop: {
                  stopName: sourceStop.stops_name,
                  distance: sourceStop.distance,
                  estimatedTime: Math.round(sourceStop.distance * 12),
                  stopId: sourceStop.id,
                  coordinates: {
                    latitude: parseFloat(sourceStop.stops_lat),
                    longitude: parseFloat(sourceStop.stops_lon)
                  }
                },
                fromDestStop: {
                  stopName: destStop.stops_name,
                  distance: destStop.distance,
                  estimatedTime: Math.round(destStop.distance * 12),
                  stopId: destStop.id,
                  coordinates: {
                    latitude: parseFloat(destStop.stops_lat),
                    longitude: parseFloat(destStop.stops_lon)
                  }
                }
              };
              // Add origin and destination coordinates for map display
              route.fromLocation = { latitude: parseFloat(fromLat), longitude: parseFloat(fromLng) };
              route.toLocation = { latitude: parseFloat(toLat), longitude: parseFloat(toLng) };
              route.totalJourneyTime =
                route.walkingInfo.toSourceStop.estimatedTime +
                (route.estimatedTime || 30) +
                route.walkingInfo.fromDestStop.estimatedTime;
            });
            
            allRouteOptions.push(...routeData);
          }
        } catch (error) {
          console.error(`Error finding routes between stops ${sourceStop.id} and ${destStop.id}:`, error.message);
        }
      }
    }

    // Sort by total journey time
    allRouteOptions.sort((a, b) => {
      const timeA = a.totalJourneyTime || 999;
      const timeB = b.totalJourneyTime || 999;
      return timeA - timeB;
    });

    console.log(`Found ${allRouteOptions.length} total route options between locations`);

    res.json({
      data: allRouteOptions,
      sourceLocation: { latitude: parseFloat(fromLat), longitude: parseFloat(fromLng) },
      destinationLocation: { latitude: parseFloat(toLat), longitude: parseFloat(toLng) },
      sourceStops,
      destinationStops,
      searchRadius
    });

  } catch (err) {
    console.error("Error finding routes between locations:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

// Find routes from user's current location to a destination stop
export const getRoutesFromLocation = async (req, res) => {
  const { latitude, longitude, destinationStopId, radius = 2 } = req.query;

  try {
    console.log(`Finding routes from location: lat=${latitude}, lng=${longitude} to stop: ${destinationStopId}`);

    // Validate input
    if (!latitude || !longitude || !destinationStopId) {
      return res.status(400).json({ 
        error: "Latitude, longitude, and destinationStopId are required" 
      });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    // Validate coordinates
    if (isNaN(userLat) || isNaN(userLon) || isNaN(searchRadius)) {
      return res.status(400).json({ error: "Invalid coordinates or radius provided" });
    }

    // First, find nearby stops
    const { data: allStops, error: stopsError } = await supabase
      .from("stops")
      .select("id, stops_name, stops_lat, stops_lon");

    if (stopsError) {
      console.error("Error fetching stops:", stopsError.message);
      throw stopsError;
    }

    // Filter nearby stops
    const nearbyStops = allStops
      .map(stop => {
        const stopLat = parseFloat(stop.stops_lat);
        const stopLon = parseFloat(stop.stops_lon);
        
        if (isNaN(stopLat) || isNaN(stopLon)) {
          return null;
        }

        const distance = calculateDistance(userLat, userLon, stopLat, stopLon);
        
        return {
          ...stop,
          distance: Math.round(distance * 100) / 100
        };
      })
      .filter(stop => stop !== null && stop.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyStops.length === 0) {
      return res.json({
        data: [],
        message: `No bus stops found within ${searchRadius}km of your location`,
        userLocation: { latitude: userLat, longitude: userLon },
        nearbyStops: []
      });
    }

    console.log(`Found ${nearbyStops.length} nearby stops, searching for routes...`);

    // Now find routes from each nearby stop to the destination
    const allRouteOptions = [];

    for (const nearbyStop of nearbyStops.slice(0, 5)) { // Limit to closest 5 stops to avoid too many requests
      try {
        // Use existing logic to find routes between stops
        const routeData = await findRoutesBetweenStops(nearbyStop.id, destinationStopId);
        
        if (routeData && routeData.length > 0) {
          // Add walking distance/time information to each route option
          routeData.forEach(route => {
            route.walkingToStop = {
              stopName: nearbyStop.stops_name,
              distance: nearbyStop.distance,
              estimatedTime: Math.round(nearbyStop.distance * 12), // Assume 5km/h walking speed = 12 minutes per km
              stopId: nearbyStop.id,
              coordinates: {
                latitude: parseFloat(nearbyStop.stops_lat),
                longitude: parseFloat(nearbyStop.stops_lon)
              }
            };
            // Add origin coordinates for map display
            route.fromLocation = { latitude: userLat, longitude: userLon };
            route.totalJourneyTime = route.walkingToStop.estimatedTime + (route.estimatedTime || 30);
          });
          
          allRouteOptions.push(...routeData);
        }
      } catch (error) {
        console.error(`Error finding routes from stop ${nearbyStop.id}:`, error.message);
        // Continue with other stops even if one fails
      }
    }

    // Sort routes by total journey time (walking + transit)
    allRouteOptions.sort((a, b) => {
      const timeA = a.totalJourneyTime || 999;
      const timeB = b.totalJourneyTime || 999;
      return timeA - timeB;
    });

    console.log(`Found ${allRouteOptions.length} total route options`);

    res.json({
      data: allRouteOptions,
      userLocation: { latitude: userLat, longitude: userLon },
      nearbyStops: nearbyStops.slice(0, 5),
      searchRadius: searchRadius
    });

  } catch (err) {
    console.error("Error finding routes from location:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

// Helper function to find routes between two stops (extracted from existing logic)
async function findRoutesBetweenStops(stop1, stop2) {
  try {
    // STEP 1: Check for direct routes (both stops on the same route)
    const { data: directRouteData, error: directRouteError } = await supabase
      .from("route_stops")
      .select("route_id, stops_id, sequence")
      .in("stops_id", [stop1, stop2]);

    if (directRouteError) {
      console.error("Error fetching direct routes:", directRouteError.message);
      throw directRouteError;
    }

    // Process direct routes
    const directRoutesMap = {};
    directRouteData.forEach(item => {
      const routeId = item.route_id;
      const stopId = String(item.stops_id);
     
      if (!directRoutesMap[routeId]) {
        directRoutesMap[routeId] = { stops: new Set(), sequences: {} };
      }
     
      directRoutesMap[routeId].stops.add(stopId);
      directRoutesMap[routeId].sequences[stopId] = item.sequence;
    });

    // Find routes that contain both stops
    const directRoutes = Object.keys(directRoutesMap).filter(
      routeId =>
        directRoutesMap[routeId].stops.has(String(stop1)) &&
        directRoutesMap[routeId].stops.has(String(stop2))
    );

    if (directRoutes.length > 0) {
      console.log(`Found ${directRoutes.length} direct routes between stops ${stop1} and ${stop2}`);
      const directRouteDetails = await Promise.all(
        directRoutes.map(async (routeId) => {
          return await getDirectRouteDetails(routeId, stop1, stop2, directRoutesMap[routeId]);
        })
      );
      return directRouteDetails.filter(route => route !== null);
    }

    // STEP 2: Find transfer routes (similar to existing logic but simplified)
    console.log("No direct routes found, searching for transfers...");
    
    // Get all routes with their stops for transfer route calculation
    const { data: allRouteStops, error: allRouteStopsError } = await supabase
      .from("route_stops")
      .select("route_id, stops_id, sequence")
      .order("sequence", { ascending: true });

    if (allRouteStopsError) {
      console.error("Error fetching all route stops:", allRouteStopsError.message);
      throw allRouteStopsError;
    }

    // Create mappings
    const routeToStops = {};
    const stopToRoutes = {};

    allRouteStops.forEach(item => {
      const routeId = String(item.route_id);
      const stopId = String(item.stops_id);
      const sequence = item.sequence;
     
      if (!routeToStops[routeId]) {
        routeToStops[routeId] = [];
      }
      routeToStops[routeId].push({ stopId, sequence });
     
      if (!stopToRoutes[stopId]) {
        stopToRoutes[stopId] = [];
      }
      stopToRoutes[stopId].push({ routeId, sequence });
    });

    // Sort stops by sequence for each route
    Object.keys(routeToStops).forEach(routeId => {
      routeToStops[routeId].sort((a, b) => a.sequence - b.sequence);
    });

    // Find routes that have stop1 and stop2
    const routesWithStop1 = stopToRoutes[String(stop1)] || [];
    const routesWithStop2 = stopToRoutes[String(stop2)] || [];

    // Find transfer routes
    const transferRoutes = [];

    for (const route1 of routesWithStop1) {
      for (const route2 of routesWithStop2) {
        if (route1.routeId === route2.routeId) continue;
       
        const stops1 = routeToStops[route1.routeId].map(s => s.stopId);
        const stops2 = routeToStops[route2.routeId].map(s => s.stopId);
       
        const commonStops = stops1.filter(stop => stops2.includes(stop));
       
        if (commonStops.length > 0) {
          for (const transferStop of commonStops) {
            if (transferStop === String(stop1) || transferStop === String(stop2)) continue;
           
            transferRoutes.push({
              fromRoute: route1.routeId,
              toRoute: route2.routeId,
              transferStop
            });
          }
        }
      }
    }

    if (transferRoutes.length === 0) {
      return [];
    }

    // Process transfer routes
    const transferRouteDetails = await Promise.all(
      transferRoutes.slice(0, 3).map(async (transfer) => { // Limit to 3 transfer options
        return await getTransferRouteDetails(
          transfer.fromRoute,
          transfer.toRoute,
          transfer.transferStop,
          stop1,
          stop2,
          routeToStops
        );
      })
    );

    return transferRouteDetails.filter(route => route !== null);

  } catch (err) {
    console.error(`Error in findRoutesBetweenStops for stops ${stop1} to ${stop2}:`, err.message);
    throw err;
  }
}


export const getStopsForRoutes = async (req, res) => {
 const { stop1, stop2, latitude, longitude, radius = 2 } = req.query;

 try {
   // Check if this is a location-based query (from user's current location)
   if (latitude && longitude && stop2 && !stop1) {
     console.log(`Location-based query: lat=${latitude}, lng=${longitude} to stop=${stop2}`);
     
     // Use the new location-based function
     req.query.destinationStopId = stop2;
     return getRoutesFromLocation(req, res);
   }

   console.log(`Received query for stops: stop1=${stop1}, stop2=${stop2}`);

   // Validate input for traditional stop-to-stop search
   if (!stop1 || !stop2) {
     return res.status(400).json({ error: "Both stop1 and stop2 are required, or provide latitude/longitude with stop2 for location-based search" });
   }


   // STEP 1: Check for direct routes (both stops on the same route)
   const { data: directRouteData, error: directRouteError } = await supabase
     .from("route_stops")
     .select("route_id, stops_id, sequence")
     .in("stops_id", [stop1, stop2]);


   if (directRouteError) {
     console.error("Error fetching direct routes:", directRouteError.message);
     throw directRouteError;
   }


   // Process direct routes
   const directRoutesMap = {};
   directRouteData.forEach(item => {
     const routeId = item.route_id;
     const stopId = String(item.stops_id);
    
     if (!directRoutesMap[routeId]) {
       directRoutesMap[routeId] = { stops: new Set(), sequences: {} };
     }
    
     directRoutesMap[routeId].stops.add(stopId);
     directRoutesMap[routeId].sequences[stopId] = item.sequence;
   });


   // Find routes that contain both stops
   const directRoutes = Object.keys(directRoutesMap).filter(
     routeId =>
       directRoutesMap[routeId].stops.has(String(stop1)) &&
       directRoutesMap[routeId].stops.has(String(stop2))
   );


   if (directRoutes.length > 0) {
     console.log(`Found ${directRoutes.length} direct routes`);
     const directRouteDetails = await Promise.all(
       directRoutes.map(async (routeId) => {
         return await getDirectRouteDetails(routeId, stop1, stop2, directRoutesMap[routeId]);
       })
     );


     return res.json({ data: directRouteDetails });
   }


   // STEP 2: If no direct routes, find all routes and their connecting stops
   console.log("No direct routes found, searching for transfers...");
  
   // Get all routes with their stops
   const { data: allRoutesData, error: allRoutesError } = await supabase
     .from("route")
     .select("id, route_no, route_name");


   if (allRoutesError) {
     console.error("Error fetching all routes:", allRoutesError.message);
     throw allRoutesError;
   }


   // Create a mapping of all routes for quick lookup
   const allRoutes = {};
   allRoutesData.forEach(route => {
     allRoutes[route.id] = {
       id: route.id,
       route_no: route.route_no,
       route_name: route.route_name
     };
   });


   // Get all stops for each route
   const { data: allRouteStops, error: allRouteStopsError } = await supabase
     .from("route_stops")
     .select("route_id, stops_id, sequence")
     .order("sequence", { ascending: true });


   if (allRouteStopsError) {
     console.error("Error fetching all route stops:", allRouteStopsError.message);
     throw allRouteStopsError;
   }


   // Create mappings of routes to their stops and stops to their routes
   const routeToStops = {};
   const stopToRoutes = {};


   allRouteStops.forEach(item => {
     const routeId = String(item.route_id);
     const stopId = String(item.stops_id);
     const sequence = item.sequence;
    
     // Add to route-to-stops mapping
     if (!routeToStops[routeId]) {
       routeToStops[routeId] = [];
     }
     routeToStops[routeId].push({ stopId, sequence });
    
     // Add to stop-to-routes mapping
     if (!stopToRoutes[stopId]) {
       stopToRoutes[stopId] = [];
     }
     stopToRoutes[stopId].push({ routeId, sequence });
   });


   // Sort stops by sequence for each route
   Object.keys(routeToStops).forEach(routeId => {
     routeToStops[routeId].sort((a, b) => a.sequence - b.sequence);
   });


   // Find routes that have stop1
   const routesWithStop1 = stopToRoutes[String(stop1)] || [];
   // Find routes that have stop2
   const routesWithStop2 = stopToRoutes[String(stop2)] || [];


   console.log(`Routes with stop1 (${stop1}):`, routesWithStop1.map(r => r.routeId));
   console.log(`Routes with stop2 (${stop2}):`, routesWithStop2.map(r => r.routeId));


   // Find one-transfer routes (stop1 route to stop2 route)
   const transferRoutes = [];


   // Check each route that has stop1 against each route that has stop2
   for (const route1 of routesWithStop1) {
     for (const route2 of routesWithStop2) {
       // Skip if it's the same route (direct route - already checked above)
       if (route1.routeId === route2.routeId) continue;
      
       // Find common stops between the two routes for transfer
       const stops1 = routeToStops[route1.routeId].map(s => s.stopId);
       const stops2 = routeToStops[route2.routeId].map(s => s.stopId);
      
       const commonStops = stops1.filter(stop => stops2.includes(stop));
      
       if (commonStops.length > 0) {
         // For each common stop, this is a potential transfer point
         for (const transferStop of commonStops) {
           // Skip if the transfer stop is the start or end stop
           if (transferStop === String(stop1) || transferStop === String(stop2)) continue;
          
           transferRoutes.push({
             fromRoute: route1.routeId,
             toRoute: route2.routeId,
             transferStop
           });
         }
       }
     }
   }


   console.log(`Found ${transferRoutes.length} potential transfer routes`);


   if (transferRoutes.length === 0) {
     return res.status(404).json({
       error: "No direct routes or transfer connections found between the stops."
     });
   }


   // Process transfer routes to get full details
   const transferRouteDetails = await Promise.all(
     transferRoutes.map(async (transfer) => {
       return await getTransferRouteDetails(
         transfer.fromRoute,
         transfer.toRoute,
         transfer.transferStop,
         stop1,
         stop2,
         routeToStops
       );
     })
   );


   // Filter out any null results and sort by number of transfers
   const validTransferRoutes = transferRouteDetails
     .filter(route => route !== null)
     .sort((a, b) => a.transferCount - b.transferCount);


   if (validTransferRoutes.length === 0) {
     return res.status(404).json({
       error: "No valid routes found between the stops after filtering."
     });
   }


   res.json({ data: validTransferRoutes });


 } catch (err) {
   console.error("Error finding routes between stops:", err.message);
   res.status(500).json({ error: "Internal server error", message: err.message });
 }
};


// Helper function to get full details for a direct route
async function getDirectRouteDetails(routeId, stop1, stop2, routeInfo) {
 try {
   // Get all stops for this route in order
   const { data: routeStopsData, error: routeStopsError } = await supabase
     .from("route_stops")
     .select("stops_id, sequence, stops(id, stops_name, stops_lon, stops_lat)")
     .eq("route_id", routeId)
     .order("sequence", { ascending: true });


   if (routeStopsError) {
     console.error("Error fetching route stops:", routeStopsError.message);
     throw routeStopsError;
   }


   // Find indices of our stops
   const stop1Seq = routeInfo.sequences[String(stop1)];
   const stop2Seq = routeInfo.sequences[String(stop2)];
  
   // Determine the start and end sequence numbers
   const [startSeq, endSeq] = stop1Seq < stop2Seq
     ? [stop1Seq, stop2Seq]
     : [stop2Seq, stop1Seq];
  
   // Filter stops to only include those in our journey
   const journeyStops = routeStopsData
     .filter(item => item.sequence >= startSeq && item.sequence <= endSeq)
     .map(item => item.stops);


   // All stops for the route (for context of the full route)
   const allRouteStops = routeStopsData.map(item => item.stops);


   // Get route information
   const { data: routeData, error: routeError } = await supabase
     .from("route")
     .select("route_no, route_name")
     .eq("id", routeId)
     .single();


   if (routeError) {
     console.error("Error fetching route info:", routeError.message);
     throw routeError;
   }


   // Get vehicles for this route
   const { data: routeYatayat, error: yatayatError } = await supabase
     .from("route_yatayat")
     .select("yatayat_id")
     .eq("route_id", routeId);


   if (yatayatError) {
     console.error("Error fetching route yatayat:", yatayatError.message);
     throw yatayatError;
   }


   const yatayatIds = routeYatayat?.map(item => item.yatayat_id) || [];


   // Get vehicle details
   const { data: vehicles, error: vehiclesError } = await supabase
     .from("yatayat")
     .select("id, yatayat_vehicle_image, vehicle_timing, yatayat_name")
     .in("id", yatayatIds);


   if (vehiclesError && yatayatIds.length > 0) {
     console.error("Error fetching vehicles:", vehiclesError.message);
     throw vehiclesError;
   }


   // Get fare information
   const { data: fareData, error: fareError } = await supabase
     .from("fare")
     .select("*")
     .or(`stops_from_id.eq.${stop1},stops_from_id.eq.${stop2}`)
     .or(`stops_to_id.eq.${stop1},stops_to_id.eq.${stop2}`)
     .maybeSingle();


   if (fareError && fareError.code !== "PGRST116") {
     console.error("Error fetching fare:", fareError.message);
   }


   // Format vehicle details
   const vehicleDetails = vehicles?.map(vehicle => ({
     yatayat_id: vehicle.id,
     vehicle_timing: vehicle.vehicle_timing,
     vehicleType: vehicle.yatayat_vehicle_image,
     yatayatName: vehicle.yatayat_name,
     fare: fareData || null
   })) || [];


   // Use the first vehicle for the main route display (frontend expects this format)
   const primaryVehicle = vehicleDetails[0] || {
     yatayat_id: null,
     vehicle_timing: 'N/A',
     vehicleType: 'bus',
     yatayatName: 'Unknown Operator',
     fare: null
   };

   return {
     routeId,
     route_no: routeData.route_no,
     route_name: routeData.route_name,
     isSingleRoute: true,
     transferCount: 0,
     // Add flattened properties for frontend compatibility
     yatayat_id: primaryVehicle.yatayat_id,
     vehicle_timing: primaryVehicle.vehicle_timing,
     vehicleType: primaryVehicle.vehicleType,
     yatayatName: primaryVehicle.yatayatName,
     fare: primaryVehicle.fare,
     stops: journeyStops,
     segments: [{
       routeId,
       route_no: routeData.route_no,
       route_name: routeData.route_name,
       vehicles: vehicleDetails,
       stops: journeyStops,
       allRouteStops: allRouteStops // All stops for context
     }],
     transfers: []
   };
 } catch (err) {
   console.error(`Error in getDirectRouteDetails for route ${routeId}:`, err.message);
   return null;
 }
}


// Helper function to get full details for a transfer route
async function getTransferRouteDetails(route1Id, route2Id, transferStopId, startStopId, endStopId, routeToStops) {
 try {
   // Get stops for the first route
   const stopsRoute1 = routeToStops[route1Id] || [];
  
   // Get stops for the second route
   const stopsRoute2 = routeToStops[route2Id] || [];
  
   // Find the positions of our stops in each route
   const startStopIndex = stopsRoute1.findIndex(s => s.stopId === String(startStopId));
   const transferStopIndexRoute1 = stopsRoute1.findIndex(s => s.stopId === String(transferStopId));
   const transferStopIndexRoute2 = stopsRoute2.findIndex(s => s.stopId === String(transferStopId));
   const endStopIndex = stopsRoute2.findIndex(s => s.stopId === String(endStopId));
  
   // Verify all stops are found
   if (startStopIndex === -1 || transferStopIndexRoute1 === -1 ||
       transferStopIndexRoute2 === -1 || endStopIndex === -1) {
     console.log("Invalid transfer route, missing stops:", {
       route1Id, route2Id, transferStopId, startStopId, endStopId,
       startStopIndex, transferStopIndexRoute1, transferStopIndexRoute2, endStopIndex
     });
     return null;
   }
  
   // Determine the direction of travel on each route
   const direction1 = startStopIndex < transferStopIndexRoute1 ? 1 : -1;
   const direction2 = transferStopIndexRoute2 < endStopIndex ? 1 : -1;
  
   // Get the stops for segment 1 (start -> transfer)
   let segment1Stops;
   if (direction1 > 0) {
     segment1Stops = stopsRoute1
       .slice(startStopIndex, transferStopIndexRoute1 + 1)
       .map(s => s.stopId);
   } else {
     segment1Stops = stopsRoute1
       .slice(transferStopIndexRoute1, startStopIndex + 1)
       .reverse()
       .map(s => s.stopId);
   }
  
   // Get the stops for segment 2 (transfer -> end)
   let segment2Stops;
   if (direction2 > 0) {
     segment2Stops = stopsRoute2
       .slice(transferStopIndexRoute2, endStopIndex + 1)
       .map(s => s.stopId);
   } else {
     segment2Stops = stopsRoute2
       .slice(endStopIndex, transferStopIndexRoute2 + 1)
       .reverse()
       .map(s => s.stopId);
   }
  
   // Get route details for both routes
   const [route1Details, route2Details] = await Promise.all([
     getRouteDetails(route1Id, segment1Stops),
     getRouteDetails(route2Id, segment2Stops)
   ]);
  
   // Get transfer stop details
   const { data: transferStopData, error: transferStopError } = await supabase
     .from("stops")
     .select("id, stops_name, stops_lon, stops_lat")
     .eq("id", transferStopId)
     .single();
  
   if (transferStopError) {
     console.error("Error fetching transfer stop:", transferStopError.message);
     throw transferStopError;
   }
  
   // Format transfer information
   const transferDetails = {
     transferStop: transferStopData,
     fromRoute: {
       id: route1Id,
       route_no: route1Details.routeInfo.route_no,
       route_name: route1Details.routeInfo.route_name
     },
     toRoute: {
       id: route2Id,
       route_no: route2Details.routeInfo.route_no,
       route_name: route2Details.routeInfo.route_name
     }
   };
  
   return {
     routeId: `${route1Id}-${route2Id}`,
     route_no: `${route1Details.routeInfo.route_no} → ${route2Details.routeInfo.route_no}`,
     route_name: `${route1Details.routeInfo.route_name} → ${route2Details.routeInfo.route_name}`,
     isSingleRoute: false,
     transferCount: 1,
     segments: [
       {
         routeId: route1Id,
         route_no: route1Details.routeInfo.route_no,
         route_name: route1Details.routeInfo.route_name,
         vehicles: route1Details.vehicles,
         stops: route1Details.stops,
         allRouteStops: route1Details.allRouteStops // All stops for context
       },
       {
         routeId: route2Id,
         route_no: route2Details.routeInfo.route_no,
         route_name: route2Details.routeInfo.route_name,
         vehicles: route2Details.vehicles,
         stops: route2Details.stops,
         allRouteStops: route2Details.allRouteStops // All stops for context
       }
     ],
     transfers: [transferDetails],
     totalFare: calculateTotalFare(route1Details.vehicles, route2Details.vehicles)
   };
 } catch (err) {
   console.error(`Error in getTransferRouteDetails:`, err.message);
   return null;
 }
}


// Helper function to get route details
async function getRouteDetails(routeId, stopIds) {
 try {
   // Get route information
   const { data: routeInfo, error: routeError } = await supabase
     .from("route")
     .select("id, route_no, route_name")
     .eq("id", routeId)
     .single();
  
   if (routeError) {
     console.error(`Error fetching route info for ${routeId}:`, routeError.message);
     throw routeError;
   }
  
   // Get all stops for this route in order (for context)
   const { data: allRouteStopsData, error: allRouteStopsError } = await supabase
     .from("route_stops")
     .select("stops_id, sequence, stops(id, stops_name, stops_lon, stops_lat)")
     .eq("route_id", routeId)
     .order("sequence", { ascending: true });
  
   if (allRouteStopsError) {
     console.error(`Error fetching all route stops for ${routeId}:`, allRouteStopsError.message);
     throw allRouteStopsError;
   }
  
   // All stops for the complete route
   const allRouteStops = allRouteStopsData.map(item => item.stops);
  
   // Get stop details for the segment
   const { data: stopDetails, error: stopError } = await supabase
     .from("stops")
     .select("id, stops_name, stops_lon, stops_lat")
     .in("id", stopIds);
  
   if (stopError) {
     console.error(`Error fetching stops for ${routeId}:`, stopError.message);
     throw stopError;
   }
  
   // Sort stops in the order they appear in stopIds
   const orderedStops = stopIds.map(id =>
     stopDetails.find(stop => String(stop.id) === id)
   ).filter(stop => stop !== undefined);
  
   // Get vehicles for this route
   const { data: routeYatayat, error: yatayatError } = await supabase
     .from("route_yatayat")
     .select("yatayat_id")
     .eq("route_id", routeId);
  
   if (yatayatError) {
     console.error(`Error fetching yatayat for ${routeId}:`, yatayatError.message);
     throw yatayatError;
   }
  
   const yatayatIds = routeYatayat?.map(item => item.yatayat_id) || [];
  
   // Get vehicle details
   const { data: vehicles, error: vehiclesError } = await supabase
     .from("yatayat")
     .select("id, yatayat_vehicle_image, vehicle_timing, yatayat_name")
     .in("id", yatayatIds);
  
   if (vehiclesError && yatayatIds.length > 0) {
     console.error(`Error fetching vehicles for ${routeId}:`, vehiclesError.message);
     throw vehiclesError;
   }
  
   // Get fare information for this segment
   const startStop = stopIds[0];
   const endStop = stopIds[stopIds.length - 1];
  
   const { data: fareData, error: fareError } = await supabase
     .from("fare")
     .select("*")
     .or(`stops_from_id.eq.${startStop},stops_from_id.eq.${endStop}`)
     .or(`stops_to_id.eq.${startStop},stops_to_id.eq.${endStop}`)
     .maybeSingle();
  
   if (fareError && fareError.code !== "PGRST116") {
     console.error(`Error fetching fare for ${routeId}:`, fareError.message);
   }
  
   // Format vehicle details
   const vehicleDetails = vehicles?.map(vehicle => ({
     yatayat_id: vehicle.id,
     vehicle_timing: vehicle.vehicle_timing,
     vehicleType: vehicle.yatayat_vehicle_image,
     yatayatName: vehicle.yatayat_name,
     fare: fareData || null
   })) || [];
  
   return {
     routeInfo,
     stops: orderedStops,
     allRouteStops: allRouteStops, // All stops for context
     vehicles: vehicleDetails
   };
 } catch (err) {
   console.error(`Error in getRouteDetails for ${routeId}:`, err.message);
   throw err;
 }
}


// Helper function to calculate total fare
function calculateTotalFare(vehicles1, vehicles2) {
 const fare1 = vehicles1[0]?.fare;
 const fare2 = vehicles2[0]?.fare;
  if (!fare1 && !fare2) return null;
  const amount1 = fare1?.fare || 0;
 const amount2 = fare2?.fare || 0;
  return {
   fare_amount: parseFloat(amount1) + parseFloat(amount2),
   segments: [
     { segment: 1, fare: fare1 },
     { segment: 2, fare: fare2 }
   ]
 };
}


// The remaining functions stay the same
export const getFare = async (req, res) => {
 try {
   const { data, error } = await supabase.from("fare").select("*");


   if (error) {
     throw error;
   }


   res.json({ data });
 } catch (err) {
   console.error("Error fetching fare:", err.message);
   res.status(500).json({ error: "Error fetching fare" });
 }
};


export const getAllStops = async (req, res) => {
 try {
   const { data, error } = await supabase.from("stops").select("*");


   if (error) {
     throw error;
   }


   res.json({ data });
 } catch (err) {
   console.error("Error fetching stops:", err.message);
   res.status(500).json({ error: "Error fetching stops" });
 }
};


export const getYatayatId = async (req, res) => {
 const { id } = req.params;


 try {
   const { data, error } = await supabase
     .from("yatayat")
     .select("*")
     .eq("id", id)
     .single();


   if (error) {
     throw error;
   }


   if (!data) {
     return res.status(404).json({ error: "yatayat not found" });
   }


   res.json({ data });
 } catch (err) {
   console.error("Error fetching yatayat:", err.message);
   res.status(500).json({ error: "Error fetching yatayat" });
 }
};


export const getVehicleImage = async (req, res) => {
 try {
   const { bucketName, filePath } = req.query;


   if (!bucketName || !filePath) {
     return res
       .status(400)
       .json({ error: "Missing bucketName or filePath in query parameters" });
   }


   const { data, error } = supabase.storage
     .from(bucketName)
     .getPublicUrl(filePath);


   if (error) {
     throw error;
   }


   res.json({ imageUrl: data.publicUrl });
 } catch (err) {
   console.error("Error fetching image URL:", err.message);
   res.status(500).json({ error: "Error fetching image URL" });
 }
};

// Get walking directions between two points using Google Directions API
export const getWalkingDirections = async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;

  try {
    // Validate input
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({
        error: "fromLat, fromLng, toLat, and toLng are required"
      });
    }

    const origin = `${fromLat},${fromLng}`;
    const destination = `${toLat},${toLng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;

    console.log(`Fetching walking directions from ${origin} to ${destination}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data.status, data.error_message);
      return res.status(400).json({
        error: 'Failed to fetch directions',
        status: data.status,
        message: data.error_message
      });
    }

    if (!data.routes || data.routes.length === 0) {
      return res.json({
        polyline: null,
        distance: null,
        duration: null,
        message: 'No walking route found'
      });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    res.json({
      polyline: route.overview_polyline.points,
      distance: leg.distance,
      duration: leg.duration,
      startAddress: leg.start_address,
      endAddress: leg.end_address
    });

  } catch (err) {
    console.error("Error fetching walking directions:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

// Get driving directions between multiple points using Google Directions API
export const getDrivingDirections = async (req, res) => {
  const { origin, destination, waypoints } = req.query;

  try {
    // Validate input
    if (!origin || !destination) {
      return res.status(400).json({
        error: "origin and destination are required"
      });
    }

    // Build URL with waypoints if provided
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }

    console.log(`Fetching driving directions from ${origin} to ${destination}${waypoints ? ' with waypoints' : ''}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data.status, data.error_message);
      return res.status(400).json({
        error: 'Failed to fetch directions',
        status: data.status,
        message: data.error_message
      });
    }

    if (!data.routes || data.routes.length === 0) {
      return res.json({
        polyline: null,
        distance: null,
        duration: null,
        message: 'No driving route found'
      });
    }

    const route = data.routes[0];

    res.json({
      polyline: route.overview_polyline.points,
      bounds: route.bounds,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration
      }))
    });
  } catch (err) {
    console.error("Error fetching driving directions:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  }
};
