import 'dotenv/config';

import connectDB from "./db/index.js";
import app from "./app.js";   

// Connect to MongoDB
connectDB()
  .then(() => {
    app.on("error", (err) => console.error("Server error:", err));

    app.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => console.error("Error starting server:", error));
