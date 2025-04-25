import supabase from "../config/supabaseClient.js";


export const getStopsForRoutes = async (req, res) => {
 const { stop1, stop2 } = req.query;


 try {
   console.log(`Received query for stops: stop1=${stop1}, stop2=${stop2}`);


   // Validate input
   if (!stop1 || !stop2) {
     return res.status(400).json({ error: "Both stop1 and stop2 are required" });
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


   return {
     routeId,
     route_no: routeData.route_no,
     route_name: routeData.route_name,
     isSingleRoute: true,
     transferCount: 0,
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
