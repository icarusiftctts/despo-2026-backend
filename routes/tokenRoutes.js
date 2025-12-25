const express = require("express");
const router = express.Router();

const verifyFirebaseToken = require("../config/authMiddleware");
const { db } = require("../config/firebase");
const admin = require("firebase-admin");

// Save / update FCM token
router.post("/fcm-token", verifyFirebaseToken, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "FCM token is required",
    });
  }

  const uid = req.user.uid;

  try {
    const userRef = db.collection("users").doc(uid);

    await userRef.set(
      {
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: "FCM token saved",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
