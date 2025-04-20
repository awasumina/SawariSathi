import supabase from "../config/supabaseClient.js";

export const getStopsForRoutes = async (req, res) => {
  const { stop1, stop2 } = req.query;

  try {
    console.log(`Received query for stops: stop1=${stop1}, stop2=${stop2}`);

    const { data: routeIds, error: routeError } = await supabase
      .from("route_stops")
      .select("route_id, stops_id")
      .in("stops_id", [stop1, stop2]);

    if (routeError) {
      console.error("Error fetching route IDs:", routeError.message);
      throw routeError;
    }

    if (!routeIds || !routeIds.length) {
      return res.status(404).json({ error: "No routes found for the provided stops." });
    }

    const groupedRoutes = routeIds.reduce((acc, { route_id }) => {
      acc[route_id] = (acc[route_id] || 0) + 1;
      return acc;
    }, {});

    const matchingRouteIds = Object.entries(groupedRoutes)
      .filter(([_, count]) => count >= 2)
      .map(([routeId]) => routeId);

    // CASE: stop1 and stop2 are on the same route
    if (matchingRouteIds.length) {
      console.log(`Matching route IDs: ${matchingRouteIds}`);
    } else {
      console.log("No routes contain both stops. Checking route continuation...");

      // Get route_ids for each stop
      const routeIdsForStop1 = routeIds
        .filter((r) => String(r.stops_id) === String(stop1))
        .map((r) => r.route_id);
      const routeIdsForStop2 = routeIds
        .filter((r) => String(r.stops_id) === String(stop2))
        .map((r) => r.route_id);

      let connectingRoutes = [];

      for (const r1 of routeIdsForStop1) {
        // Get last stop of route1
        const { data: stopsR1, error: stopsErr1 } = await supabase
          .from("route_stops")
          .select("stops_id")
          .eq("route_id", r1)
          .order("sequence", { ascending: true });

        if (stopsErr1 || !stopsR1 || !stopsR1.length) continue;
        const lastStopR1 = stopsR1[stopsR1.length - 1].stops_id;

        for (const r2 of routeIdsForStop2) {
          const { data: stopsR2, error: stopsErr2 } = await supabase
            .from("route_stops")
            .select("stops_id")
            .eq("route_id", r2)
            .order("sequence", { ascending: true });

          if (stopsErr2 || !stopsR2 || !stopsR2.length) continue;

          const firstStopR2 = stopsR2[0].stops_id;

          if (String(lastStopR1) === String(firstStopR2)) {
            // Add both routes for final processing
            connectingRoutes.push(r1, r2);
          }
        }
      }

      if (!connectingRoutes.length) {
        return res.status(404).json({
          error: "No direct or linked routes found between the two stops.",
        });
      }

      matchingRouteIds.push(...new Set(connectingRoutes));
    }

    const allRouteDetails = await Promise.all(
      matchingRouteIds.map(async (selectedRouteId) => {
        const { data: routeData, error: routeDataError } = await supabase
          .from("route")
          .select("route_no, route_name")
          .eq("id", selectedRouteId)
          .single();

        if (routeDataError) {
          console.error("Error fetching route data:", routeDataError.message);
          throw routeDataError;
        }

        const { data: routeYatayat, error: routeYatayatError } = await supabase
          .from("route_yatayat")
          .select("yatayat_id")
          .eq("route_id", selectedRouteId);

        if (routeYatayatError || !routeYatayat?.length) return null;

        const yatayatIds = routeYatayat.map((item) => item.yatayat_id);

        const { data: yatayatData, error: yatayatError } = await supabase
          .from("yatayat")
          .select("id, yatayat_vehicle_image, vehicle_timing, yatayat_name")
          .in("id", yatayatIds);

        if (yatayatError) {
          console.error("Error fetching yatayat data:", yatayatError.message);
          throw yatayatError;
        }

        const yatayatMap = {};
        const yatayatTime = {};
        const yatayatName = {};
        yatayatData.forEach((curr) => {
          yatayatMap[curr.id] = curr.yatayat_vehicle_image;
          yatayatTime[curr.id] = curr.vehicle_timing;
          yatayatName[curr.id] = curr.yatayat_name;
        });

        const { data: allStops, error: stopsError } = await supabase
          .from("route_stops")
          .select("stops_id, sequence, stops(stops_name, stops_lon, stops_lat, id)")
          .eq("route_id", selectedRouteId)
          .order("sequence", { ascending: true });

        if (stopsError) throw stopsError;

        const stop1Index = allStops.findIndex((s) => String(s.stops_id) === String(stop1));
        const stop2Index = allStops.findIndex((s) => String(s.stops_id) === String(stop2));

        const [start, end] =
          stop1Index !== -1 && stop2Index !== -1
            ? [stop1Index, stop2Index].sort((a, b) => a - b)
            : [0, allStops.length - 1];

        const selectedStops = allStops.slice(start, end + 1);
        const formattedStops = selectedStops.map(({ stops }) => stops);

        const yatayatDetails = await Promise.all(
          yatayatIds.map(async (id) => {
            const { data: fareData, error: fareError } = await supabase
              .from("fare")
              .select("*")
              .in("stops_from_id", [stop1, stop2])
              .in("stops_to_id", [stop2, stop1])
              .single();

            if (fareError && fareError.code !== "PGRST116") {
              console.error(`Fare error for yatayat_id ${id}:`, fareError.message);
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

        return {
          routeId: selectedRouteId,
          route_no: routeData.route_no,
          route_name: routeData.route_name,
          details: yatayatDetails,
        };
      })
    );

    const filteredResults = allRouteDetails.filter((r) => r !== null);
    res.json({ data: filteredResults });
  } catch (err) {
    console.error("Error fetching stops for routes:", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
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
