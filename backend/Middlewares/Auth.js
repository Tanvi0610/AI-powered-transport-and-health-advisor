const jwt = require("jsonwebtoken");

const ensureAuthenticated = (req, res, next) => {
  const auth = req.headers["authorization"];
  if (!auth) {
    return res
      .status(403)
      .json({ message: "Unauthorised,JWT token is required" });
  }
  try {
    const decoded = jwt.verify(auth, process.env.JWT_SEC);
    req.user = decoded;
    console.log("-----logged in users details-----", req.user);

    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Unauthorised,JWT token is wrong or expired" });
  }
};
module.exports = ensureAuthenticated;
