import express from 'express';
const app = express();

// Function to find an available port
const findAvailablePort = (startPort, maxPort) => {
    return new Promise((resolve, reject) => {
        const checkPort = (port) => {
            const server = app.listen(port, () => {
                server.close(); // Close the server to free up the port
                resolve(port);  // Return the available port
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    // If the port is in use, try the next port
                    if (port < maxPort) {
                        checkPort(port + 1);
                    } else {
                        reject('No available ports found'); // If no ports are available, throw an error
                    }
                }
            });
        };

        checkPort(startPort); // Start checking from the initial port
    });
};


export default findAvailablePort;