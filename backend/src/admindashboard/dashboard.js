//add stops
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#stop-form').addEventListener('submit', async function (event) {
        event.preventDefault();
        const stopName = document.querySelector('input[name="stopName"]').value.trim();
        const latitude = document.querySelector('input[name="latitude"]').value.trim();
        const longitude = document.querySelector('input[name="longitude"]').value.trim();
        const routeId = document.querySelector('input[name="routeId"]').value.trim();

        if (!stopName || !latitude || !longitude || !routeId) {
            alert("Please fill in all fields.");
            return; 
        }
        try {
            const response = await fetch('/api/addStop', {  
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stopName, latitude, longitude,routeId })
            });

            const result = await response.json();
            if (result.success) {
                alert('Stop added successfully!');
                event.target.reset(); // Clear form after submission
            } else {
                alert('aaError: ' + result.message);
            }
        } catch (error) {
            alert('Error adding stop: ' + error.message);
        }
    }); 
});


// Function to fetch and display stops
async function fetchStops() {
    try {
        const response = await fetch('/api/getStops'); 
        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch stops");
        }
        const data = await response.json();

        const tableStops = document.querySelector("#tableStops");
        const tbody = tableStops.querySelector("tbody");
    

        // const tbody = document.querySelector(".tableStopstbody");
        tbody.innerHTML = ""; // Clear existing rows

        data.data.forEach((stop) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${stop.stops_name}</td>
                <td>${stop.stops_lat}</td>
                <td>${stop.stops_lon}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editStop('${stop.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStop('${stop.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        alert("xxError fetching stops: " + error.message);
    }
}
// Load stops when the page loads
document.addEventListener('DOMContentLoaded', async function () {
    await fetchStops();
});



// Function to delete a stop
async function deleteStop(id) {
    if (!confirm("Are you sure you want to delete this stop?")) return;
    console.log("Sending DELETE request to /api/deleteStop/" + id); // Debugging log
    try {
        const response = await fetch(`/api/deleteStop/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        console.log("Response status: " + response.status); // Debugging log
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Result: ", result); // Log the response data
        if (result.success) {
            alert("Stop deleted successfully!");
            fetchStops(); // Refresh stops list
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error deleting stop: ", error); // Log detailed error information
        alert("Error deleting stop: " + error.message);
    }
}


async function editStop(stopId) {
    try {
    // alert('dash');

        // Fetch the data for the specific stop
        const response = await fetch(`/api/getStopById/${stopId}`); 
        
        if (!response.ok) {
            throw new Error("Failed to fetch stop data");
        }

        const data = await response.json();
        const stop = data.data;

        // Populate the form with the existing data
        document.getElementById('stops_name').value = stop.stops_name;
        document.getElementById('stops_lat').value = stop.stops_lat;
        document.getElementById('stops_lon').value = stop.stops_lon;
        document.getElementById('stop_id').value = stop.id;

        // Show the form
        document.getElementById('editStopForm').style.display = 'block';
    } catch (error) {
        console.error(error);
        alert("Error fetching stop data: " + error.message);
    }
}

function closeForm() {
    // Hide the form
    document.getElementById('editStopForm').style.display = 'none';
}




document.getElementById('stopForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Get the form data
    const formData = new FormData(event.target);
    
    const stopId = formData.get('stop_id');
    const stopName = formData.get('stops_name');
    const stopLat = formData.get('stops_lat');
    const stopLon = formData.get('stops_lon');

    console.log("stopId:", stopId);
    console.log("stopName:", stopName);
    console.log("stopLat:", stopLat);
    console.log("stopLon:", stopLon);

    try {
        // Send the updated data to the server
        const response = await fetch(`/api/updateStopById/${stopId}`, {
            method: 'PUT',
            body: JSON.stringify({
                stops_name: stopName,
                stops_lat: stopLat,
                stops_lon: stopLon
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json(); // Parse the response body
        console.log("Response data:", data);  // Log the response data
        
        if (!response.ok) {
            throw new Error("Failed to update stop");
        } 
      
        // Close the form
        closeForm();

        // Optionally, refresh the table or perform other updates
        // fetchStops();
    } catch (error) {
        console.error(error);
        alert("Error updating stop: " + error.message);
    }
});

// document.addEventListener("DOMContentLoaded", fetchStops);

async function fetchStops() {
    try {
        // Send a GET request to the API to fetch the stops
        const response = await fetch('/api/getStops'); 
        
        // Check if the response is okay
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch stops");
        }

        // Parse the response JSON data
        const data = await response.json();

        // Get the tbody element to populate the table
        // const tbody = document.querySelector("tbody");
        const tableStops = document.querySelector("#tableStops");
        const tbody = tableStops.querySelector("tbody");

        tbody.innerHTML = ""; // Clear existing rows

        // Iterate through the stops data and append rows to the table
        data.data.forEach((stop) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${stop.stops_name}</td>
                <td>${stop.stops_lat}</td>
                <td>${stop.stops_lon}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editStop('${stop.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStop('${stop.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        // Log the error and display an alert to the user
        console.error(error);
        alert("Error fetching stops: " + error.message);
    }
}

// Load stops when the page loads
// document.addEventListener('DOMContentLoaded', async function () {
//     await fetchStops();
// });









//add route
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#route-form').addEventListener('submit', async function (event) {
        event.preventDefault();
        const routeName = document.querySelector('input[name="routeName"]').value.trim();
        const routeNumber = document.querySelector('input[name="routeNumber"]').value.trim();
  
        if (!routeName || !routeNumber) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            const response = await fetch('/api/addRoute', {  
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ routeName, routeNumber})
            });

            const result = await response.json();
            if (result.success) {
                alert('route added successfully!');
                event.target.reset(); // Clear form after submission
            } else {
                alert('aaError: ' + result.message);
            }
        } catch (error) {
            alert('Error adding route: ' + error.message);
        }
    }); 
});





// Function to fetch and display routes
async function fetchRoutes() {
    try {
        const response = await fetch('/api/getRoutes'); 
        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch routes");
        }
        const data = await response.json();
        const tableRoutes = document.querySelector("#tableRoutes");
        const tbody = tableRoutes.querySelector("tbody");
        tbody.innerHTML = ""; // Clear existing rows

        data.data.forEach((route) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${route.route_name}</td>
                <td>${route.route_no}</td>
    
                <td class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editRoute('${route.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRoute('${route.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error(error);
        alert("xxError fetching Route: " + error.message);
    }
}
// Load routes  when the page loads
document.addEventListener('DOMContentLoaded', async function () {
    await fetchRoutes();
});






// Function to delete a route
async function deleteRoute(id) {
    if (!confirm("Are you sure you want to delete this route?")) return;
    console.log("Sending DELETE request to /api/deleteRoute/" + id); // Debugging log
    try {
        const response = await fetch(`/api/deleteRoute/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        console.log("Response status: " + response.status); // Debugging log
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Result: ", result); // Log the response data
        if (result.success) {
            alert("Route deleted successfully!");
            fetchRoutes(); // Refresh route list
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error deleting route: ", error); // Log detailed error information
        alert("Error deleting route: " + error.message);
    }
}

//function to edit route
async function editRoute(routeId) {
    try {
        // Fetch the data for the specific stop
        const response = await fetch(`/api/getRouteById/${routeId}`); 
        
        if (!response.ok) {
            throw new Error("Failed to fetch Route data");
        }

        const data = await response.json();
        const route = data.data;

        // Populate the form with the existing data
        document.getElementById('routes_name').value = route.route_name;
        document.getElementById('routes_no').value = route.route_no;
        document.getElementById('route_id').value = route.id;

        // Show the form
        document.getElementById('editRouteForm').style.display = 'block';
    } catch (error) {
        console.error(error);
        alert("Error fetching route data: " + error.message);
    }
}

function closeForm() {
    // Hide the form
    document.getElementById('editRouteForm').style.display = 'none';
}




document.getElementById('routeForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Get the form data
    const formData = new FormData(event.target);
    
    const routeId = formData.get('route_id');
    const routeName = formData.get('route_name');
    const routeNumber = formData.get('route_no');

    console.log("routeId:", routeID);
    console.log("routeName:", routeName);
    console.log("routeLat:", routeNumber);

    try {
        // Send the updated data to the server
        const response = await fetch(`/api/updateRouteById/${routeId}`, {
            method: 'PUT',
            body: JSON.stringify({
                route_name: routeName,
                route_no: routeNumber,
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json(); // Parse the response body
        console.log("Response data:", data);  // Log the response data
        
        if (!response.ok) {
            throw new Error("Failed to update edit");
        } 
      
        // Close the form
        closeForm();

        // Optionally, refresh the table or perform other updates
        // fetchStops();
    } catch (error) {
        console.error(error);
        alert("Error updating route: " + error.message);
    }
});

// document.addEventListener("DOMContentLoaded", fetchStops);

async function fetchRoutes() {
    try {
        // Send a GET request to the API to fetch the stops
        const response = await fetch('/api/getRoutes'); 
        
        // Check if the response is okay
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch routes");
        }

        // Parse the response JSON data
        const data = await response.json();

        // Get the tbody element to populate the table
        const tableRoutes = document.querySelector("#tableRoutes");
        const tbody = tableRoutes.querySelector("tbody");


        // const tbody = document.querySelector(body");
        tbody.innerHTML = ""; // Clear existing row"ts

        // Iterate through the routes data and append rows to the table
        data.data.forEach((route) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${route.route_name}</td>
                <td>${route.route_no}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editStop('${route.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStop('${route.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        // Log the error and display an alert to the user
        console.error(error);
        alert("Error fetching routes: " + error.message);
    }
}


