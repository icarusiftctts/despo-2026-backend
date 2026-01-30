const express = require("express");
const router = express.Router();

const verifyFirebaseToken = require("../config/authMiddleware");
const requireAdmin = require("../config/adminMiddleware");
const { db, admin } = require("../config/firebase");

/**
 * CREATE LIVE EVENT (ADMIN)
 */
router.post(
    "/live-events",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {
        const {
            sport,
            title,
            teamA,
            teamB,
            venue,
            startTime,
            endTime,
            isVisible = true,
        } = req.body;

        // ---- Validation ----
        if (
            !sport ||
            !title ||
            !teamA ||
            !teamB ||
            !venue ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "sport, title, teamA, teamB, venue, startTime, endTime are required",
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({
                success: false,
                message: "Invalid startTime or endTime",
            });
        }

        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: "startTime must be before endTime",
            });
        }

        try {
            const docRef = await db.collection("live_events").add({
                sport,
                title,
                teamA,
                teamB,
                venue,
                startTime: admin.firestore.Timestamp.fromDate(start),
                endTime: admin.firestore.Timestamp.fromDate(end),
                isVisible,

                // admin / metadata
                status: "upcoming", // optional, ignored by client
                createdBy: req.user.uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(201).json({
                success: true,
                eventId: docRef.id,
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
            });
        }
    }
);

/**
 * FETCH ALL EVENTS (ADMIN)
 */
router.get(
    "/live-events",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {
        try {
            const snapshot = await db
                .collection("live_events")
                .orderBy("startTime", "asc")
                .limit(100)
                .get();

            const events = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return res.json({
                success: true,
                events,
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                error: err.message,
            });
        }
    }
);

module.exports = router;
