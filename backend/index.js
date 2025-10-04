const express = require("express");
const app = express();
const cors = require("cors");

const AuthRouter = require("./Routes/AuthRouter");
const productRouter = require("./Routes/productRouter");

require("dotenv").config();
require("./Models/db");

// Middleware
app.use(express.json()); // instead of bodyParser.json()
app.use(
  cors({
    origin: "http://localhost:3000", // allow frontend React app
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/auth", AuthRouter);
app.use("/products", productRouter);

app.get("/ping", (req, res) => {
  res.send("PING");
});

// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
