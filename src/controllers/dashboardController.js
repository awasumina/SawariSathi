import supabase from "../config/supabaseClient.js";

export const addStopsdb = async (req, res) => {
    // Extract values from request body
    const { stopName, latitude, longitude } = req.body;

    try {
        const { error } = await supabase
            .from('stop')
            .insert([{
                stops_name: stopName,  // Match DB column name
                stops_lon: longitude,  // Match DB column name
                stops_lat: latitude    // Match DB column name
            }]);

        if (error) throw error;

        res.json({ success: true, message: 'Stop added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// async function editStop(id) {
//     const row = document.querySelector(`tr[data-stop-id="${id}"]`);
//     const isEditing = row.classList.contains('editing');

//     if (!isEditing) {
//         // Switch to edit mode
//         const name = row.querySelector('td:first-child').textContent;
//         const lat = row.querySelector('td:nth-child(2)').textContent;
//         const lng = row.querySelector('td:nth-child(3)').textContent;

//         row.querySelector('td:first-child').innerHTML = `<input type="text" class="form-control" value="${name}">`;
//         row.querySelector('td:nth-child(2)').innerHTML = `<input type="number" step="any" class="form-control" value="${lat}">`;
//         row.querySelector('td:nth-child(3)').innerHTML = `<input type="number" step="any" class="form-control" value="${lng}">`;
        
//         const editBtn = row.querySelector('.btn-warning');
//         editBtn.textContent = 'Save';
//         row.classList.add('editing');
//     } else {
//         // Save changes
//         const stopName = row.querySelector('td:first-child input').value;
//         const latitude = row.querySelector('td:nth-child(2) input').value;
//         const longitude = row.querySelector('td:nth-child(3) input').value;

//         try {
//             const { error } = await supabase
//                 .from('stops')
//                 .update({ name: stopName, latitude, longitude })
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Stop updated successfully!');
//             loadStops();
//         } catch (error) {
//             alert('Error updating stop: ' + error.message);
//         }
//     }
// }

// async function deleteStop(id) {
//     if (confirm('Are you sure you want to delete this stop?')) {
//         try {
//             const { error } = await supabase
//                 .from('stops')
//                 .delete()
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Stop deleted successfully!');
//             loadStops();
//         } catch (error) {
//             alert('Error deleting stop: ' + error.message);
//         }
//     }
// }

// // ============ ROUTES OPERATIONS ============
// async function addRoute(event) {
//     event.preventDefault();
//     const routeName = document.querySelector('#routes input[placeholder="Enter route name"]').value;
//     const routeNumber = document.querySelector('#routes input[placeholder="Enter route number"]').value;
//     const stopsSelect = document.querySelector('#routes select[multiple]');
//     const selectedStops = Array.from(stopsSelect.selectedOptions).map(option => option.value);

//     try {
//         const { data, error } = await supabase
//             .from('routes')
//             .insert([
//                 { name: routeName, number: routeNumber }
//             ])
//             .select();

//         if (error) throw error;

//         // Add route stops
//         const routeStops = selectedStops.map(stopId => ({
//             route_id: data[0].id,
//             stop_id: stopId
//         }));

//         const { error: stopError } = await supabase
//             .from('route_stops')
//             .insert(routeStops);

//         if (stopError) throw stopError;

//         alert('Route added successfully!');
//         loadRoutes();
//         event.target.closest('form').reset();
//     } catch (error) {
//         alert('Error adding route: ' + error.message);
//     }
// }

// async function editRoute(id) {
//     const row = document.querySelector(`tr[data-route-id="${id}"]`);
//     const isEditing = row.classList.contains('editing');

//     if (!isEditing) {
//         // Switch to edit mode
//         const name = row.querySelector('td:first-child').textContent;
//         const number = row.querySelector('td:nth-child(2)').textContent;

//         row.querySelector('td:first-child').innerHTML = `<input type="text" class="form-control" value="${name}">`;
//         row.querySelector('td:nth-child(2)').innerHTML = `<input type="text" class="form-control" value="${number}">`;
        
//         const editBtn = row.querySelector('.btn-warning');
//         editBtn.textContent = 'Save';
//         row.classList.add('editing');
//     } else {
//         // Save changes
//         const routeName = row.querySelector('td:first-child input').value;
//         const routeNumber = row.querySelector('td:nth-child(2) input').value;

//         try {
//             const { error } = await supabase
//                 .from('routes')
//                 .update({ name: routeName, number: routeNumber })
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Route updated successfully!');
//             loadRoutes();
//         } catch (error) {
//             alert('Error updating route: ' + error.message);
//         }
//     }
// }

// async function deleteRoute(id) {
//     if (confirm('Are you sure you want to delete this route?')) {
//         try {
//             // Delete route stops first
//             const { error: stopError } = await supabase
//                 .from('route_stops')
//                 .delete()
//                 .eq('route_id', id);

//             if (stopError) throw stopError;

//             // Delete route
//             const { error } = await supabase
//                 .from('routes')
//                 .delete()
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Route deleted successfully!');
//             loadRoutes();
//         } catch (error) {
//             alert('Error deleting route: ' + error.message);
//         }
//     }
// }

// // ============ FARES OPERATIONS ============
// async function addFare(event) {
//     event.preventDefault();
//     const fareType = document.querySelector('#fares input[placeholder="Enter fare type"]').value;
//     const amount = document.querySelector('#fares input[placeholder="Enter amount"]').value;
//     const routeSelect = document.querySelector('#fares select');
//     const routeId = routeSelect.value;

//     try {
//         const { data, error } = await supabase
//             .from('fares')
//             .insert([
//                 { type: fareType, amount, route_id: routeId || null }
//             ])
//             .select();

//         if (error) throw error;

//         alert('Fare added successfully!');
//         loadFares();
//         event.target.closest('form').reset();
//     } catch (error) {
//         alert('Error adding fare: ' + error.message);
//     }
// }

// async function editFare(id) {
//     const row = document.querySelector(`tr[data-fare-id="${id}"]`);
//     const isEditing = row.classList.contains('editing');

//     if (!isEditing) {
//         // Switch to edit mode
//         const type = row.querySelector('td:first-child').textContent;
//         const amount = row.querySelector('td:nth-child(2)').textContent.replace('$', '');
//         const route = row.querySelector('td:nth-child(3)').textContent;

//         row.querySelector('td:first-child').innerHTML = `<input type="text" class="form-control" value="${type}">`;
//         row.querySelector('td:nth-child(2)').innerHTML = `<input type="number" step="0.01" class="form-control" value="${amount}">`;
        
//         const editBtn = row.querySelector('.btn-warning');
//         editBtn.textContent = 'Save';
//         row.classList.add('editing');
//     } else {
//         // Save changes
//         const fareType = row.querySelector('td:first-child input').value;
//         const amount = row.querySelector('td:nth-child(2) input').value;

//         try {
//             const { error } = await supabase
//                 .from('fares')
//                 .update({ type: fareType, amount })
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Fare updated successfully!');
//             loadFares();
//         } catch (error) {
//             alert('Error updating fare: ' + error.message);
//         }
//     }
// }

// async function deleteFare(id) {
//     if (confirm('Are you sure you want to delete this fare?')) {
//         try {
//             const { error } = await supabase
//                 .from('fares')
//                 .delete()
//                 .eq('id', id);

//             if (error) throw error;

//             alert('Fare deleted successfully!');
//             loadFares();
//         } catch (error) {
//             alert('Error deleting fare: ' + error.message);
//         }
//     }
// }

// // ============ DATA LOADING FUNCTIONS ============
// async function loadStops() {
//     try {
//         const { data: stops, error } = await supabase
//             .from('stops')
//             .select('*')
//             .order('name');

//         if (error) throw error;

//         const tbody = document.querySelector('#stops table tbody');
//         tbody.innerHTML = stops.map(stop => `
//             <tr data-stop-id="${stop.id}">
//                 <td>${stop.name}</td>
//                 <td>${stop.latitude}</td>
//                 <td>${stop.longitude}</td>
//                 <td class="action-buttons">
//                     <button class="btn btn-sm btn-warning" onclick="editStop(${stop.id})">Edit</button>
//                     <button class="btn btn-sm btn-danger" onclick="deleteStop(${stop.id})">Delete</button>
//                 </td>
//             </tr>
//         `).join('');

//         // Update stops dropdown in routes tab
//         const stopsSelect = document.querySelector('#routes select[multiple]');
//         stopsSelect.innerHTML = stops.map(stop => 
//             `<option value="${stop.id}">${stop.name}</option>`
//         ).join('');
//     } catch (error) {
//         console.error('Error loading stops:', error);
//     }
// }

// async function loadRoutes() {
//     try {
//         const { data: routes, error } = await supabase
//             .from('routes')
//             .select(`
//                 *,
//                 route_stops (
//                     stops (
//                         id,
//                         name
//                     )
//                 )
//             `)
//             .order('name');

//         if (error) throw error;

//         const tbody = document.querySelector('#routes table tbody');
//         tbody.innerHTML = routes.map(route => `
//             <tr data-route-id="${route.id}">
//                 <td>${route.name}</td>
//                 <td>${route.number}</td>
//                 <td>${route.route_stops.length}</td>
//                 <td class="action-buttons">
//                     <button class="btn btn-sm btn-warning" onclick="editRoute(${route.id})">Edit</button>
//                     <button class="btn btn-sm btn-danger" onclick="deleteRoute(${route.id})">Delete</button>
//                 </td>
//             </tr>
//         `).join('');

//         // Update routes dropdown in fares tab
//         const routeSelect = document.querySelector('#fares select');
//         routeSelect.innerHTML = `
//             <option value="">All Routes</option>
//             ${routes.map(route => 
//                 `<option value="${route.id}">${route.name}</option>`
//             ).join('')}
//         `;
//     } catch (error) {
//         console.error('Error loading routes:', error);
//     }
// }

// async function loadFares() {
//     try {
//         const { data: fares, error } = await supabase
//             .from('fares')
//             .select(`
//                 *,
//                 routes (
//                     name
//                 )
//             `)
//             .order('type');

//         if (error) throw error;

//         const tbody = document.querySelector('#fares table tbody');
//         tbody.innerHTML = fares.map(fare => `
//             <tr data-fare-id="${fare.id}">
//                 <td>${fare.type}</td>
//                 <td>$${fare.amount.toFixed(2)}</td>
//                 <td>${fare.routes?.name || 'All Routes'}</td>
//                 <td class="action-buttons">
//                     <button class="btn btn-sm btn-warning" onclick="editFare(${fare.id})">Edit</button>
//                     <button class="btn btn-sm btn-danger" onclick="deleteFare(${fare.id})">Delete</button>
//                 </td>
//             </tr>
//         `).join('');
//     } catch (error) {
//         console.error('Error loading fares:', error);
//     }
// }

// // Add event listeners
// document.addEventListener('DOMContentLoaded', () => {
//     // Load initial data
//     loadStops();
//     loadRoutes();
//     loadFares();

//     // Add form submit handlers
//     document.querySelector('#stops .card-body form').addEventListener('submit', addStop);
//     document.querySelector('#routes .card-body form').addEventListener('submit', addRoute);
//     document.querySelector('#fares .card-body form').addEventListener('submit', addFare);

//     // Add button click handlers for non-form buttons
//     document.querySelector('#stops .btn-primary').addEventListener('click', addStop);
//     document.querySelector('#routes .btn-primary').addEventListener('click', addRoute);
//     document.querySelector('#fares .btn-primary').addEventListener('click', addFare);
// });






// // transitController.js
// import supabase from "../config/supabaseClient.js";

// import express from 'express';


// const router = express.Router();

// // Create Stop
// export const addStops=async (req, res) => {
//     try {
//         const { stopName, latitude, longitude } = req.body;
        
//         const { data, error } = await supabase
//             .from('stops')
//             .insert([
//                 { name: stopName, latitude, longitude }
//             ])
//             .select();
        
//         if (error) throw error;
        
//         res.json({ success: true, data: data[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Read Stops
// router.get('/stops', async (req, res) => {
//     try {
//         const { data, error } = await supabase
//             .from('stops')
//             .select('*');
            
//         if (error) throw error;
        
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Update Stop
// router.put('/stops/:id', async (req, res) => {
//     try {
//         const { stopName, latitude, longitude } = req.body;
        
//         const { data, error } = await supabase
//             .from('stops')
//             .update({ name: stopName, latitude, longitude })
//             .eq('id', req.params.id)
//             .select();
            
//         if (error) throw error;
        
//         res.json({ success: true, data: data[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Delete Stop
// router.delete('/stops/:id', async (req, res) => {
//     try {
//         const { error } = await supabase
//             .from('stops')
//             .delete()
//             .eq('id', req.params.id);
            
//         if (error) throw error;
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // ============ ROUTES CRUD ============

// // Create Route
// router.post('/routes/add', async (req, res) => {
//     try {
//         const { routeName, routeNumber, stops } = req.body;
        
//         // Insert route
//         const { data: routeData, error: routeError } = await supabase
//             .from('routes')
//             .insert([
//                 { name: routeName, number: routeNumber }
//             ])
//             .select();
            
//         if (routeError) throw routeError;
        
//         // Insert route stops
//         const routeStops = stops.map(stopId => ({
//             route_id: routeData[0].id,
//             stop_id: stopId
//         }));
        
//         const { error: stopError } = await supabase
//             .from('route_stops')
//             .insert(routeStops);
            
//         if (stopError) throw stopError;
        
//         res.json({ success: true, data: routeData[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Read Routes
// router.get('/routes', async (req, res) => {
//     try {
//         const { data: routes, error: routesError } = await supabase
//             .from('routes')
//             .select(`
//                 *,
//                 route_stops (
//                     stops (
//                         id,
//                         name
//                     )
//                 )
//             `);
            
//         if (routesError) throw routesError;
        
//         // Format the response to include stop names
//         const formattedRoutes = routes.map(route => ({
//             ...route,
//             stops: route.route_stops.map(rs => rs.stops)
//         }));
        
//         res.json(formattedRoutes);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Update Route
// router.put('/routes/:id', async (req, res) => {
//     try {
//         const { routeName, routeNumber, stops } = req.body;
        
//         // Update route details
//         const { data: routeData, error: routeError } = await supabase
//             .from('routes')
//             .update({ name: routeName, number: routeNumber })
//             .eq('id', req.params.id)
//             .select();
            
//         if (routeError) throw routeError;
        
//         // Delete existing route stops
//         const { error: deleteError } = await supabase
//             .from('route_stops')
//             .delete()
//             .eq('route_id', req.params.id);
            
//         if (deleteError) throw deleteError;
        
//         // Insert new route stops
//         const routeStops = stops.map(stopId => ({
//             route_id: req.params.id,
//             stop_id: stopId
//         }));
        
//         const { error: stopError } = await supabase
//             .from('route_stops')
//             .insert(routeStops);
            
//         if (stopError) throw stopError;
        
//         res.json({ success: true, data: routeData[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Delete Route
// router.delete('/routes/:id', async (req, res) => {
//     try {
//         // Delete route stops first (foreign key constraint)
//         const { error: stopError } = await supabase
//             .from('route_stops')
//             .delete()
//             .eq('route_id', req.params.id);
            
//         if (stopError) throw stopError;
        
//         // Delete route
//         const { error: routeError } = await supabase
//             .from('routes')
//             .delete()
//             .eq('id', req.params.id);
            
//         if (routeError) throw routeError;
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // ============ FARES CRUD ============

// // Create Fare
// router.post('/fares/add', async (req, res) => {
//     try {
//         const { fareType, amount, routeId } = req.body;
        
//         const { data, error } = await supabase
//             .from('fares')
//             .insert([
//                 { type: fareType, amount, route_id: routeId }
//             ])
//             .select();
            
//         if (error) throw error;
        
//         res.json({ success: true, data: data[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Read Fares
// router.get('/fares', async (req, res) => {
//     try {
//         const { data, error } = await supabase
//             .from('fares')
//             .select(`
//                 *,
//                 routes (
//                     name
//                 )
//             `);
            
//         if (error) throw error;
        
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Update Fare
// router.put('/fares/:id', async (req, res) => {
//     try {
//         const { fareType, amount, routeId } = req.body;
        
//         const { data, error } = await supabase
//             .from('fares')
//             .update({ type: fareType, amount, route_id: routeId })
//             .eq('id', req.params.id)
//             .select();
            
//         if (error) throw error;
        
//         res.json({ success: true, data: data[0] });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Delete Fare
// router.delete('/fares/:id', async (req, res) => {
//     try {
//         const { error } = await supabase
//             .from('fares')
//             .delete()
//             .eq('id', req.params.id);
            
//         if (error) throw error;
        
//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// export default router;