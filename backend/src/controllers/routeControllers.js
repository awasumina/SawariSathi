import supabase from "../config/supabaseClient.js";

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

    // Select the first route ID that contains both stops
    const selectedRouteId = Object.entries(groupedRoutes).find(
      ([_, count]) => count >= 2
    )?.[0];

    if (!selectedRouteId) {
      console.log("No single route contains both stops.");
      return res
        .status(404)
        .json({ error: "No single route found containing both stops." });
    }

    console.log(`Selected route ID: ${selectedRouteId}`);

    // // Fetch the yatayat_id associated with the selected route
    // const { data: routeYatayat, error: routeYatayatError } = await supabase
    //   .from('route_yatayat')
    //   .select('yatayat_id')
    //   .eq('route_id', selectedRouteId)
    //   // .single(); // Assuming a one-to-one relationship between route and yatayat
    // console.log(routeYatayat);
    // if (routeYatayatError) {
    //   console.error('Error fetching route_yatayat:', routeYatayatError.message);
    //   throw routeYatayatError;
    // }

    // if (!routeYatayat) {
    //   console.log('No yatayat found for the selected route.');
    //   return res.status(404).json({ error: 'No yatayat associated with the selected route.' });
    // }

    // const yatayatId = routeYatayat.id;
    // console.log(yatayatId);
    const yatayatId = 3;

    // Fetch the vehicle image file path from yatayat table
    const { data: yatayatData, error: yatayatError } = await supabase
      .from("yatayat")
      .select("yatayat_vehicle_image")
      .eq("id", yatayatId)
      .single(); // Expecting a single result for this query

    console.log(yatayatData);

    if (yatayatError) {
      console.error("Error fetching yatayat data:", yatayatError.message);
      throw yatayatError;
    }

    if (!yatayatData) {
      console.log("No yatayat data found for the selected yatayat_id.");
      return res
        .status(404)
        .json({ error: "No vehicle image found for the selected yatayat." });
    }

    // Clean the file path (removing leading/trailing slashes if present)
    // let vehicleImageFilePath = yatayatData.yatayat_vehicle_image.trim().replace(/^\/+|\/+$/g, '');

    let vehicleImageFilePath = yatayatData.yatayat_vehicle_image
      .trim()
      .replace(/^\/+|\/+$/g, "");

    // Ensure there's no double slash in the URL
    let vehicleImageUrl = `https://harjukgmkopkziyskpso.supabase.co/storage/v1/object/public/Vehicle/${vehicleImageFilePath.replace(
      /\/+/g,
      "/"
    )}`;

    // console.log('Vehicle Image URL:', vehicleImageUrl);

    // Generate the public URL for the vehicle image
    const { data: imageUrlData, error: urlError } = supabase.storage
      .from("Vehicle")
      .getPublicUrl(vehicleImageFilePath);

    if (urlError) {
      console.error("Error fetching vehicle image URL:", urlError.message);
      return res
        .status(500)
        .json({ error: "Error fetching vehicle image URL" });
    }

    // console.log('Vehicle Image URL:', imageUrlData.publicURL);

    // // Fetch stops for the selected route
    // const { data: stops, error: stopsError } = await supabase
    //   .from("route_stops")
    //   .select("stops_id, stops(stops_name, stops_lon, stops_lat)") // Fetch stops details
    //   .eq("route_id", selectedRouteId)
    //   .order("sequence", { ascending: true }); // Ensure correct stop order

    // if (stopsError) {
    //   console.error("Error fetching stops:", stopsError.message);
    //   throw stopsError;
    // }

    // // Format stops to return only the necessary details
    // const formattedStops = stops.map(({ stops }) => stops);

    // Fetch all stops for the selected route ordered by sequence
    const { data: allStops, error: stopsError } = await supabase
      .from("route_stops")
      .select("stops_id, sequence, stops(stops_name, stops_lon, stops_lat)")
      .eq("route_id", selectedRouteId)
      .order("sequence", { ascending: true });

    if (stopsError) {
      console.error("Error fetching stops:", stopsError.message);
      throw stopsError;
    }

    // Find the sequence numbers of stop1 and stop2
    const stop1Index = allStops.findIndex(
      (s) => String(s.stops_id) === String(stop1)
    );
    const stop2Index = allStops.findIndex(
      (s) => String(s.stops_id) === String(stop2)
    );
    console.log("All Stops:", allStops);

    console.log("Stop1 Index:", stop1Index);
    console.log("Stop2 Index:", stop2Index);

    if (stop1Index === -1 || stop2Index === -1) {
      return res.status(404).json({ error: "Stops not found in the route." });
    }

    // Determine the slice range (inclusive)
    const [start, end] = [stop1Index, stop2Index].sort((a, b) => a - b);
    const selectedStops = allStops.slice(start, end + 1);
    // console.log("Selected stops:", selectedStops);

    // Format the stops
    const formattedStops = selectedStops.map(({ stops }) => stops);

    // Fetch fare data
    const { data: fare, error: fareError } = await supabase
      .from("fare")
      .select("*")
      .in("stops_from_id", [stop1, stop2])
      .in("stops_to_id", [stop2, stop1])
      .single(); // Assuming only one fare exists per route

    if (fareError && fareError.code !== "PGRST116") {
      // Ignore "no rows found" error
      console.error("Error fetching fare:", fareError.message);
      throw fareError;
    }

    // Return the stops and fare data along with the vehicle image URL
    res.json({
      data: {
        stops: formattedStops,
        fare,
        vehicleImageUrl: imageUrlData.publicUrl,
      },
    });
  } catch (err) {
    console.error("Error fetching stops for routes:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
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
