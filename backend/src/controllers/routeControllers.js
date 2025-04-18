import supabase from "../config/supabaseClient.js";

export const getStopsForRoutes = async (req, res) => {
  const { stop1, stop2 } = req.query; // Accept stops as query parameters

  try {
    console.log(`Received query for stops: stop1=${stop1}, stop2=${stop2}`);

    // Fetch route IDs where stops_id matches stop1 or stop2
    const { data: routeIds, error: routeError } = await supabase
      .from("route_stops")
      .select("route_id")
      .in("stops_id", [stop1, stop2]);

    if (routeError) {
      console.error("Error fetching route IDs:", routeError.message);
      throw routeError;
    }

    if (!routeIds || !routeIds.length) {
      console.log("No route IDs found.");
      return res
        .status(404)
        .json({ error: "No routes found for the provided stops." });
    }

    // Count occurrences of each route_id
    const groupedRoutes = routeIds.reduce((acc, { route_id }) => {
      acc[route_id] = (acc[route_id] || 0) + 1;
      return acc;
    }, {});

    // Find all route IDs that contain both stops
    const matchingRouteIds = Object.entries(groupedRoutes)
      .filter(([_, count]) => count >= 2)
      .map(([routeId, _]) => routeId);

    if (!matchingRouteIds.length) {
      console.log("No routes contain both stops.");
      return res
        .status(404)
        .json({ error: "No routes found containing both stops." });
    }

    console.log(`Matching route IDs: ${matchingRouteIds}`);

    const allRouteDetails = await Promise.all(
      matchingRouteIds.map(async (selectedRouteId) => {
        // Fetch the route_no and route_name from the route table
        const { data: routeData, error: routeDataError } = await supabase
          .from("route")
          .select("route_no, route_name")
          .eq("id", selectedRouteId)
          .single();

        if (routeDataError) {
          console.error("Error fetching route data:", routeDataError.message);
          throw routeDataError;
        }

        // Fetch the yatayat_id associated with the selected route
        const { data: routeYatayat, error: routeYatayatError } = await supabase
          .from("route_yatayat")
          .select("yatayat_id")
          .eq("route_id", selectedRouteId);

        console.log("routeYatayat", routeYatayat);

        if (routeYatayatError) {
          console.error(
            "Error fetching route_yatayat:",
            routeYatayatError.message
          );
          throw routeYatayatError;
        }

        if (!routeYatayat || routeYatayat.length === 0) {
          return null; // Skip this route
        }

        const yatayatIds = routeYatayat.map((item) => item.yatayat_id);
        // const yatayatTiming = routeYatayat.map((item) => item.vehicle_timing);
        // console.log("yatayat timing", yatayatTiming);

        // Fetch the vehicle image file path from yatayat table
        const { data: yatayatData, error: yatayatError } = await supabase
          .from("yatayat")
          .select("id, yatayat_vehicle_image, vehicle_timing,yatayat_name")
          .in("id", yatayatIds);

        console.log("yatayatData", yatayatData);

        const yatayatTiming = yatayatData.map((item) => item.vehicle_timing);
        console.log("yatayat timing", yatayatTiming);

        if (yatayatError) {
          console.error("Error fetching yatayat data:", yatayatError.message);
          throw yatayatError;
        }

        const yatayatMap = yatayatData.reduce((acc, curr) => {
          acc[curr.id] = curr.yatayat_vehicle_image;
          return acc;
        }, {});

        const yatayatTime = yatayatData.reduce((acc, curr) => {
          acc[curr.id] = curr.vehicle_timing;
          return acc;
        }, {});

        console.log("yatayatTime", yatayatTime);

        const yatayatName = yatayatData.reduce((acc, curr) => {
          acc[curr.id] = curr.yatayat_name;
          return acc;
        }, {});

        // Fetch all stops for the selected route ordered by sequence
        const { data: allStops, error: stopsError } = await supabase
          .from("route_stops")
          .select(
            "stops_id, sequence, stops(stops_name, stops_lon, stops_lat, id)"
          )
          .eq("route_id", selectedRouteId)
          .order("sequence", { ascending: true });

        if (stopsError) {
          console.error("Error fetching stops:", stopsError.message);
          throw stopsError;
        }

        const stop1Index = allStops.findIndex(
          (s) => String(s.stops_id) === String(stop1)
        );
        const stop2Index = allStops.findIndex(
          (s) => String(s.stops_id) === String(stop2)
        );

        if (stop1Index === -1 || stop2Index === -1) {
          return null; // Skip this route
        }

        const [start, end] = [stop1Index, stop2Index].sort((a, b) => a - b);
        const selectedStops = allStops.slice(start, end + 1);
        const formattedStops = selectedStops.map(({ stops }) => stops);

        // Get fare for each yatayat (can be expanded later to specific fare handling)
        const yatayatDetails = await Promise.all(
          yatayatIds.map(async (id) => {
            const { data: fareData, error: fareError } = await supabase
              .from("fare")
              .select("*")
              .in("stops_from_id", [stop1, stop2])
              .in("stops_to_id", [stop2, stop1])
              .single();

            if (fareError && fareError.code !== "PGRST116") {
              console.error(
                `Fare error for yatayat_id ${id}:`,
                fareError.message
              );
            }

            return {
              yatayat_id: id,
              vehicle_timing: yatayatTime[id],
              vehicleType: yatayatMap[id],
              yatayatName: yatayatName[id],
              fare: fareData || null,
              stops: formattedStops,
              route_no: routeData.route_no,
              route_name: routeData.route_name,
            };
          })
        );

        // Return the updated response with route_no and route_name at the top level
        return {
          routeId: selectedRouteId,
          route_no: routeData.route_no,
          route_name: routeData.route_name,
          details: yatayatDetails,
        };
      })
    );

    // Filter out null values (e.g., routes with missing data)
    const filteredResults = allRouteDetails.filter((r) => r !== null);

    res.json({ data: filteredResults });
  } catch (err) {
    console.error("Error fetching stops for routes:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
};

// Get all fare
export const getFare = async (req, res) => {
  try {
    const { data, error } = await supabase.from("fare").select("*"); // Fetch all fare

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
    const { data, error } = await supabase.from("stops").select("*"); // Fetch all fare

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching stops:", err.message);
    res.status(500).json({ error: "Error fetching stops" });
  }
};

// Get yatayat
export const getYatayatId = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("yatayat")
      .select("*")
      .eq("id", id) // Match by id
      .single(); // Expect a single record

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

// API to fetch image URL dynamically
export const getVehicleImage = async (req, res) => {
  try {
    // Get bucketName and filePath from query parameters
    const { bucketName, filePath } = req.query;

    if (!bucketName || !filePath) {
      return res
        .status(400)
        .json({ error: "Missing bucketName or filePath in query parameters" });
    }

    // Generate a public URL for the image
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

// // API to fetch image URL dynamically based on vehicle type
// export const getVehicleImage = async (req, res) => {
//   try {
//     // Extract the vehicle type (like Bus, Car, etc.) from the URL parameter
//     const { vehicleType } = req.query;

//     if (!vehicleType) {
//       return res.status(400).json({ error: 'Missing vehicleType in query parameters' });
//     }

//     // Assuming 'vehicles' is the Supabase bucket name, and image file paths are named after vehicle types
//     const bucketName = 'vehicles';
//     const filePath = `${vehicleType}.jpg`; // Assuming the images are stored as .jpg (you can change this to the format you're using)
//     console
//     // Generate a public URL for the image
//     const { data, error } = supabase.storage
//       .from(bucketName)
//       .getPublicUrl(filePath);

//     if (error) {
//       throw error;
//     }

//     // Respond with the public image URL
//     res.json({ imageUrl: data.publicUrl });
//   } catch (err) {
//     console.error('Error fetching image URL:', err.message);
//     res.status(500).json({ error: 'Error fetching image URL' });
//   }
// };
