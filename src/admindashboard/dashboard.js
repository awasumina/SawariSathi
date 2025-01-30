document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#stop-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const stopName = document.querySelector('input[placeholder="Enter stop name"]').value;
        const latitude = document.querySelector('input[placeholder="Click on map"]:nth-of-type(1)').value;
        const longitude = document.querySelector('input[placeholder="Click on map"]:nth-of-type(2)').value;

        if (!stopName || !latitude || !longitude) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch('/admindashboard/addStop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stopName, latitude, longitude })
            });

            const result = await response.json();
            if (result.success) {
                alert('Stop added successfully!');
                event.target.reset(); // Clear form after submission
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Error adding stop: ' + error.message);
        }
    });
});
