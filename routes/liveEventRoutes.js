const express = require("express");
const router = express.Router();

const verifyFirebaseToken = require("../config/authMiddleware");
const requireAdmin = require("../config/adminMiddleware");
const { db, admin } = require("../config/firebase");

// Create live event (admin)
router.post(
    "/live-events",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {
        const { title, description, eventAt } = req.body;

        if (!title || !description || !eventAt) {
            return res.status(400).json({
                success: false,
                message: "title, description, and eventAt are required",
            });
        }

        try {
            const docRef = await db.collection("live_events").add({
                title,
                description,
                eventAt: admin.firestore.Timestamp.fromDate(
                    new Date(eventAt)
                ),
                status: "scheduled",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: req.user.uid,
            });

            res.status(201).json({
                success: true,
                eventId: docRef.id,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message,
            });
        }
    }
);

// Fetch upcoming events (admin)
router.get(
    "/live-events",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {
        try {
            const snapshot = await db
                .collection("live_events")
                .orderBy("eventAt", "asc")
                .limit(50)
                .get();

            const events = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            res.json({
                success: true,
                events,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message,
            });
        }
    }
);

module.exports = router;
