import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import logger from "./logger/winston.logger.js";
import cluster from "cluster";
import os from "os";

dotenv.config({
	path: "./.env",
});

const numCPUs = os.cpus().length;

// Function to start the server for a worker
const startServer = (port) => {
	app.listen(port, () => {
		console.log(`\x1b[32mWorker ${process.pid} is running on port: ${port}\x1b[0m ✅`);
	});

	// Add a basic route for debugging
	app.get("/debug", (req, res) => {
		console.log(`Request received at /debug by worker ${process.pid}`);
		res.status(200).json({ message: "Debug route working", worker: process.pid });
	});
};

if (cluster.isPrimary) {
	console.log(`Primary process ${process.pid} is running ✅`);

	// Connect to the database in the primary process
	connectDB()
		.then(() => {
			console.log("\x1b[32mDatabase connected successfully in primary process\x1b[0m");

			// Fork workers after DB connection is established
			for (let i = 0; i < numCPUs; i++) {
				cluster.fork();
			}

			cluster.on("exit", (worker, code, signal) => {
				console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
				console.log("Starting a new worker...");
				cluster.fork();
			});
		})
		.catch((err) => {
			console.log("\x1b[31mError connecting to MongoDB in primary process !!!!!: " + err + "\x1b[0m");
			throw err;
		});
} else {
	// Worker process: Wait for the database connection before starting the server
	connectDB()
		.then(() => {
			console.log(`\x1b[32mWorker ${process.pid} confirmed database connection\x1b[0m`);
			const PORT = process.env.PORT || 3000;
			startServer(PORT);
		})
		.catch((err) => {
			console.log(`\x1b[31mWorker ${process.pid} failed to confirm database connection: ${err}\x1b[0m`);
			process.exit(1); // Exit the worker if DB connection fails
		});
}
