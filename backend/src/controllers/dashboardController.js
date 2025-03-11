import supabase from "../config/supabaseClient.js";

//add Stops
export const addStopsdb = async (req, res) => {
    const { stopName, latitude, longitude } = req.body;

    try {
        const { error } = await supabase
            .from('stop')
           .insert([{
                stops_name: stopName,  
                stops_lon: longitude,     
                stops_lat: latitude   
            }]); 

        if (error) throw error;

        res.json({ success: true, message: 'Stop added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// Function to fetch stops from the database
export const getStopdb =  async (req,res)=>{
    try{
    const { data, error } = await supabase.from("stop").select("*");
    
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
        const { error } = await supabase.from("stop").delete().match({ id });
        
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
        const { data, error } = await supabase.from("stop").select("*").eq("id", id);
        
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
            .from("stop")
            .select("*")
            .eq("id", id)
            .single(); // Fetching a single stop by ID

        if (fetchError || !existingStop) {
            return res.status(404).json({ success: false, message: "Stop not found" });
        }

        // Update the stop in the database
        const { error } = await supabase
            .from("stop")
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



//addRoutes
export const addRoutesdb = async (req, res) => {
    const { routeName, routeNumber} = req.body;

    try {
        const { error } = await supabase
            .from('route')
           .insert([{
                route_name: routeName,  
                route_no: routeNumber,     
            }]); 

        if (error) throw error;

        res.json({ success: true, message: 'Route added successfully' });
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

