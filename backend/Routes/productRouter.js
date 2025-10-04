const router = require("express").Router();
const ensureAuthenticated = require("../Middlewares/Auth");

router.get("/", ensureAuthenticated, (req, res) => {
  res.status(200).json([
    {
      name: "mobile",
      price: 1000,
    },
    {
      name: "tv",
      price: 2000,
    },
  ]);
});

module.exports = router;
