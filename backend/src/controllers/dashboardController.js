import supabase from "../config/supabaseClient.js";

// Add Stops and Associate with Route, Automatically Set Sequence to Last Position
export const addStopsdb = async (req, res) => {
    const { stopName, latitude, longitude, routeId } = req.body;

    try {
        // Step 1: Insert the new stop into the 'stops' table
        const { data: stopData, error: stopError } = await supabase
            .from('stops')
            .insert([{
                stops_name: stopName,  
                stops_lon: longitude,     
                stops_lat: latitude   
            }])
            .select('*')  // Ensure it returns the full row including ID
            .single();  // .single() ensures we get the inserted stop data

        if (stopError) throw stopError;

        // Step 2: Get the route details including 'route_no'
        const { data: routeData, error: routeError } = await supabase
            .from('route')
            .select('id')   // Fetch only the route_no from the route table
            .eq('id', routeId)  // Filter by the routeId
            .single();  // Expecting a single route result
        console.log(routeData);
        if (routeError) throw routeError;

        // Step 3: Get the last sequence number for the given route
        const { data: routeStops, error: routeStopsError } = await supabase
            .from('route_stops')
            .select('sequence')
            .eq('route_id', routeId)   // Filter by the specific route
            .order('sequence', { ascending: false })   // Order by sequence in descending order to get the last stop
            .limit(1);   // Limit to 1 to get the last sequence only
            console.log(routeStops);
        if (routeStopsError) throw routeStopsError;

        // Step 4: Set the sequence for the new stop (next sequence after the last one)
        const newSequence = routeStops && routeStops.length > 0 ? routeStops[0].sequence + 1 : 1;
            console.log(newSequence);

        // Step 5: Insert the relation between the stop and route in 'route_stops'
        const { error: routeStopError } = await supabase
            .from('route_stops')
            .insert([{
                route_id: routeId,        // The route to associate with the stop
                stops_id: stopData.id, // The ID of the newly added stop
                sequence: newSequence      // The sequence/order of the stop in the route
            }]);
            console.log("Inserting into route_stops:", {
                route_id: routeId,
                stops_id: stopData?.id,
                sequence: newSequence
            });

            
            
        if (routeStopError) throw routeStopError;

        // Step 6: Respond with success and include the route number (optional)
        res.json({ 
            success: true, 
            message: 'Stop added and associated with route successfully',
            route_no: routeData.route_no  // Including route_no in the response
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// //add Stops
// export const addStopsdb = async (req, res) => {
//     const { stopName, latitude, longitude } = req.body;

//     try {
//         const { error } = await supabase
//             .from('stops')
//            .insert([{
//                 stops_name: stopName,  
//                 stops_lon: longitude,     
//                 stops_lat: latitude   
//             }]); 

//         if (error) throw error;

//         res.json({ success: true, message: 'Stop added successfully' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


// Function to fetch stops from the database
export const getStopdb =  async (req,res)=>{
    try{
    const { data, error } = await supabase.from("stops").select("*");
    
    if (error) {
        console.error("Error fetching stops:", error);
        return null;
    }
    res.json({data});
}
catch(err){
    console.error("Error fetching stops:", err.message);
    res.status(500).json({ error: "Error fetching stops" });
}};


// Function to delete a stop from the database
export const deleteStopById = async (id) => {
    try {
        const { error } = await supabase.from("stops").delete().match({ id });
        
        if (error) {
            console.error("Error deleting stop:", error);
            return false;
        }
        return true;  // Return true if deletion is successful
    } catch (err) {
        console.error("Error in deleteStopById:", err.message);
        throw new Error("Database error during stop deletion");
    }
};

export const getStopId = async (req, res) => {
    try {
        const { id } = req.params; // assuming the id is passed as a URL parameter
        const { data, error } = await supabase.from("stops").select("*").eq("id", id);
        
        if (error) {
            console.error("Error fetching stop:", error);
            return res.status(500).json({ error: "Error fetching stop" });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "Stop not found" });
        }

        res.json({ data: data[0] }); // returning the first stop since the id should be unique
    } catch (err) {
        console.error("Error fetching stop:", err.message);
        res.status(500).json({ error: "Error fetching stop" });
    }
};


// Function to update a stop by its ID in the database
export const updateStopId = async (req, res) => {
    const { id } = req.params; // Fetching the ID from the URL parameter
    const { stops_name, stops_lat, stops_lon } =req.body; 
    console.log("Updating stop with ID:", id);
    console.log("New values:", stops_name, stops_lat, stops_lon);

    try {
        // Check if the stop exists
        const { data: existingStop, error: fetchError } = await supabase
            .from("stops")
            .select("*")
            .eq("id", id)
            .single(); // Fetching a single stop by ID

        if (fetchError || !existingStop) {
            return res.status(404).json({ success: false, message: "Stop not found" });
        }

        // Update the stop in the database
        const { error } = await supabase
            .from("stops")
            .update({
                stops_name: stops_name,
                stops_lat: stops_lat,
                stops_lon: stops_lon,
            })
            .eq("id", id); // Matching by ID to update the correct stop

        if (error) throw error;

        res.json({ success: true, message: "Stop updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



export const addRoutesdb = async (req, res) => {
    const { routeName, routeNumber } = req.body;

    try {
        // Step 1: Insert the new route into the 'route' table
        const { data: routeData, error: routeError } = await supabase
            .from('route')
            .insert([{ route_name: routeName, route_no: routeNumber }])
            .select('id')  // Ensure we get the inserted ID
            .single();

        if (routeError) throw routeError;

        const routeId = routeData.route_id;

        // Step 2: Insert three rows into 'route_yatayat' table with yatayat_id as 1, 2, and 3
        const yatayatEntries = [
            { route_id: routeId, yatayat_id: 1, vehicle_timing: '08:00 AM' },
            { route_id: routeId, yatayat_id: 2, vehicle_timing: '12:00 PM' },
            { route_id: routeId, yatayat_id: 3, vehicle_timing: '05:00 PM' }
        ];

        const { error: routeYatayatError } = await supabase
            .from('route_yatayat')
            .insert(yatayatEntries);

        if (routeYatayatError) throw routeYatayatError;

        res.json({ success: true, message: 'Route and associated yatayat added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// Function to fetch stops from the database
export const getRoutedb =  async (req,res)=>{
    try{
    const { data, error } = await supabase.from("route").select("*");
    
    if (error) {
        console.error("Error fetching routes:", error);
        return null;
    }
    res.json({data});
}
catch(err){
    console.error("Error fetching routes:", err.message);
    res.status(500).json({ error: "Error fetching routes" });
}};






// Function to delete a stop from the database
export const deleteRouteById = async (id) => {
    try {
        const { error } = await supabase.from("route").delete().match({ id });
        
        if (error) {
            console.error("Error deleting route:", error);
            return false;
        }
        return true;  // Return true if deletion is successful
    } catch (err) {
        console.error("Error in deleteRouteById:", err.message);
        throw new Error("Database error during route deletion");
    }
};

export const getRouteId = async (req, res) => {
    try {
        const { id } = req.params; // assuming the id is passed as a URL parameter
        const { data, error } = await supabase.from("route").select("*").eq("id", id);
        
        if (error) {
            console.error("Error fetching route:", error);
            return res.status(500).json({ error: "Error fetching route" });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "route not found" });
        }

        res.json({ data: data[0] }); // returning the first stop since the id should be unique
    } catch (err) {
        console.error("Error fetching route:", err.message);
        res.status(500).json({ error: "Error fetching route" });
    }
};


// Function to update a stop by its ID in the database
export const updateRouteId = async (req, res) => {
    const { id } = req.params; // Fetching the ID from the URL parameter
    const {route_name , route_no} =req.body; 
    console.log("Updating route with ID:", id);
    console.log("New values:", routes_name, routes_no);

    try {
        // Check if the stop exists
        const { data: existingRoute, error: fetchError } = await supabase
            .from("route")
            .select("*")
            .eq("id", id)
            .single(); // Fetching a single stop by ID

        if (fetchError || !existingRoute) {
            return res.status(404).json({ success: false, message: "Route not found" });
        }

        // Update the route in the database
        const { error } = await supabase
            .from("route")
            .update({
                route_name: route_name,
                route_no: route_no,
            })
            .eq("id", id); // Matching by ID to update the correct stop

        if (error) throw error;

        res.json({ success: true, message: "Route updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};







//function to add fare
export const addFaredb = async (req, res) => {
    const { stops_from, stops_to, fare } = req.body;
    const discountedFare = fare * 0.55; // 55% of the fare amount
    console.log("Adding fare:", { stops_from, stops_to, fare, discountedFare });
    try {
        const { data: routeData, error: routeError } = await supabase
            .from('fare')
            .insert([{ 
                stops_from_id: stops_from, 
                stops_to_id : stops_to, 
                fare : fare,
                discounted_fare : discountedFare
            }])
            .select('id')  // Ensure we get the inserted ID
            .single();

        if (routeError) throw routeError;

        res.json({ success: true, message: 'fare added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




// Function to fetch stops from the database
export const getFaredb =  async (req,res)=>{
    try{
    const { data, error } = await supabase.from("fare").select("*");
    
    if (error) {
        console.error("Error fetching fare:", error);
        return null;
    }
    res.json({data});
}
catch(err){
    console.error("Error fetching fare:", err.message);
    res.status(500).json({ error: "Error fetching fare" });
}};
