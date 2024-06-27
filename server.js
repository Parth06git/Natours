const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Global handling of uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception 💥, Shutting down ...");
  console.log(err, err.name, err.message);
  process.exit(1); // shutdown the application
});

dotenv.config({
  path: "./config.env",
});

const dbUrl = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(dbUrl).then(() => {
  console.log("DB is connected successfully");
});

const app = require("./app");
// console.log(process.env);
let server = undefined;
// Starting the development server
if (process.env.NODE_ENV === "development") {
  const port = process.env.port;
  server = app.listen(port, () => {
    console.log(
      `Server is listening at http://127.0.0.1:${port} 😊`
    );
  });
}
// starting the production server
else {
  const port = 4000;
  server = app.listen(port, () => {
    console.log(
      `Server is listening at 127.0.0.1:${port} 😊`
    );
  });
}

// Global handling of unhandled Rejection
// It is like a safety net
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection 💥, Shutting down ...");
  console.log(err, err.name, err.message);
  server.close(() => {
    process.exit(1); // shutdown the application
  });
});
