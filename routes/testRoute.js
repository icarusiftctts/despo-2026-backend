const express = require("express");
const router = express.Router();

const { db } = require("../config/firebase");
const verifyFirebaseToken = require("../config/authMiddleware");
const requireAdmin = require("../config/adminMiddleware");

// POST /test
router.post("/test", (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: "title and body are required",
    });
  }

  res.status(200).json({
    success: true,
    received: {
      title,
      body,
    },
  });
});

// GET /test-firestore
router.get("/test-firestore", async (req, res) => {
  try {
    const snapshot = await db.collection("notifications").limit(1).get();
    res.json({
      success: true,
      docsFound: snapshot.size,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /protected
router.get("/protected", verifyFirebaseToken, (req, res) => {
  res.json({
    success: true,
    uid: req.user.uid,
    email: req.user.email,
  });
});

// POST /admin-test
router.post(
  "/admin-test",
  verifyFirebaseToken,
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access confirmed",
    });
  }
);




module.exports = router;
