// alert("dashboard.js loaded");

// import { getStops, deleteStopById } from "../controllers/dashboardController.js";

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#stop-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const stopName = document.querySelector('input[name="stopName"]').value.trim();
        const latitude = document.querySelector('input[name="latitude"]').value.trim();
        const longitude = document.querySelector('input[name="longitude"]').value.trim();

        if (!stopName || !latitude || !longitude) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch('/api/addStop', {  
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stopName, latitude, longitude })
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




// // Function to load stops and populate the table
// async function fetchStops() {
//     alert("dashboard.js loaded");
    
//     const data = await getStops();
//     if (!data) return;

//     const tbody = document.querySelector("tbody");
//     tbody.innerHTML = ""; // Clear existing rows

//     data.forEach((stop) => {
//         const row = document.createElement("tr");
//         row.innerHTML = `
//             <td>${stop.name}</td>
//             <td>${stop.latitude}</td>
//             <td>${stop.longitude}</td>
//             <td class="action-buttons">
//                 <button class="btn btn-sm btn-warning" onclick="editStop(${stop.id})">Edit</button>
//                 <button class="btn btn-sm btn-danger" onclick="deleteStop(${stop.id})">Delete</button>
//             </td>
//         `;
//         tbody.appendChild(row);
//     });
// }

// // Load stops when the page loads
// // document.addEventListener("DOMContentLoaded", fetchStops);
// document.addEventListener("DOMContentLoaded", async () => {
//     const { getStops, deleteStopById } = await import("../controllers/dashboardController.js");
//     fetchStops();
// });


// // Placeholder function for editing stops
// function editStop(id) {
//     alert(`Edit stop with ID: ${id}`);
//     // Implement edit functionality here
// }

// // Function to delete a stop
// async function deleteStop(id) {
//     const success = await deleteStopById(id);
//     if (success) {
//         fetchStops(); // Refresh the table after deletion
//     }
// }




// Function to fetch and display stops
async function fetchStops() {
    try {
        // alert('dash');
        
        const response = await fetch('/api/getStops'); // Adjust the endpoint accordingly
        console.log(response);
        // alert(response);
        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch stops");
        }
        const data = await response.json();

        // alert('dash');
        console.log(data);
        console.log(data.data);

        const tbody = document.querySelector("tbody");
        tbody.innerHTML = ""; // Clear existing rows
        // alert('dash');

        data.data.forEach((stop) => {
            // alert('dashboard');
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

// Function to delete a stop
async function deleteStop(id) {
    if (!confirm("Are you sure you want to delete this stop?")) return;

    try {
        const response = await fetch(`/api/deleteStop/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        if (result.success) {
            alert("Stop deleted successfully!");
            fetchStops(); // Refresh stops list
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        alert("Error deleting stop: " + error.message);
    }
}

// Function to edit a stop (To be implemented)
function editStop(id) {
    alert(`Edit functionality for stop ID: ${id} not implemented yet.`);
    // Implement form population and update request logic here
}

// Load stops when the page loads
document.addEventListener('DOMContentLoaded', async function () {
    await fetchStops();
});

// document.addEventListener("DOMContentLoaded", fetchStops);


// async function fetchStops() {
//     const { data, error } = await supabase.from("stop").select("*");
// alert("dashboard.js loaded");

//     if (error) {
//         console.error("Error fetching stops:", error);
//         return;
//     }

//     const tbody = document.querySelector("tbody");
//     tbody.innerHTML = ""; // Clear existing rows

//     data.forEach((stop) => {
//         const row = document.createElement("tr");
//         row.innerHTML = `
//             <td>${stop.name}</td>
//             <td>${stop.latitude}</td>
//             <td>${stop.longitude}</td>
//             <td class="action-buttons">
//                 <button class="btn btn-sm btn-warning" onclick="editStop(${stop.id})">Edit</button>
//                 <button class="btn btn-sm btn-danger" onclick="deleteStop(${stop.id})">Delete</button>
//             </td>
//         `;
//         tbody.appendChild(row);
//     });
// }

// // Load stops when the page loads
// document.addEventListener("DOMContentLoaded", fetchStops);

// // Placeholder functions for edit and delete actions
// function editStop(id) {
//     alert(`Edit stop with ID: ${id}`);
//     // Implement edit functionality here
// }

// async function deleteStop(id) {
//     const { error } = await supabase.from("stops").delete().match({ id });

//     if (error) {
//         console.error("Error deleting stop:", error);
//     } else {
//         fetchStops(); // Refresh the table after deletion
//     }
// }
