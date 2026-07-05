const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    } else {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }

  next();
};

const hospitalOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "hospital") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Hospitals only.",
    });
  }

  next();
};

const ambulanceOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ambulance") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Ambulance drivers only.",
    });
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
  hospitalOnly,
  ambulanceOnly,
};