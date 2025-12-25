function requireAdmin(req, res, next) {
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
}

module.exports = requireAdmin;
