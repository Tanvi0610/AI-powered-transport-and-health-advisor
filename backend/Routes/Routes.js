const express = require("express");
const router = express.Router();
const { getRoutes } = require("../Controllers/RouteController");

router.post("/getRoutes", getRoutes);

module.exports = router;
