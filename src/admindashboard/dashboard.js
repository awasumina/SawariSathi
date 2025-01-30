// alert("dashboard.js loaded");
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

