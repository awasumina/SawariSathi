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
    
    // Subquery: Get distinct route IDs where stops_id matches stop1 or stop2
    const { data: routeIds, error: routeError } = await supabase
      .from('route_stops')
      .select('route_id', { distinct: true })
      .or(`stops_id.eq.${stop1},stops_id.eq.${stop2}`); // Use `or` for multiple conditions

    if (routeError) {
      console.error('Error fetching route IDs:', routeError.message);
      throw routeError;
    }

    if (!routeIds || !routeIds.length) {
      console.log('No route IDs found.');
      return res.status(404).json({ error: 'No routes found for the provided stops.' });
    }

    const routeIdList = routeIds.map((route) => route.route_id);
    console.log(`Found route IDs: ${routeIdList.join(', ')}`);

    // Main query: Fetch stops for matching route IDs using table relationships
    const { data: stops, error: stopsError } = await supabase
      .from('stops')
      .select('*, route_stops(route_id, stops_id)') // Include related 'route_stops' data
      .in('route_stops.route_id', routeIdList); // Filter by the route IDs

    if (stopsError) {
      console.error('Error fetching stops:', stopsError.message);
      throw stopsError;
    }

    console.log('Fetched stops:', stops);
    res.json({ data: stops });
  } catch (err) {
    console.error('Error fetching stops for routes:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};







