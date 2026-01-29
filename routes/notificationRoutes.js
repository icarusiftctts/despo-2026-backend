const express = require("express");
const router = express.Router();

const verifyFirebaseToken = require("../config/authMiddleware");
const requireAdmin = require("../config/adminMiddleware");

const { db, admin } = require("../config/firebase");

async function getAllFcmTokens() {
    const snapshot = await db.collection("users").get();
    const tokens = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.fcmTokens)) {
            tokens.push(...data.fcmTokens);
        }
    });

    return tokens;
}

async function sendPushNotification(tokens, title, body) {
    if (tokens.length === 0) return;

    const message = {
        notification: {
            title,
            body,
        },
    };

    const BATCH_SIZE = 500;

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);

        const response = await admin.messaging().sendEachForMulticast({
            ...message,
            tokens: batch,
        });

        // Cleanup invalid tokens
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const failedToken = batch[idx];
                removeInvalidToken(failedToken);
            }
        });
    }
}

async function removeInvalidToken(token) {
    const snapshot = await db.collection("users").get();

    const batch = db.batch();

    snapshot.forEach((doc) => {
        batch.update(doc.ref, {
            fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        });
    });

    await batch.commit();
}


// Admin-only: create notification (broadcast later)
router.post(
    "/notifications",
    verifyFirebaseToken,
    requireAdmin,
    async (req, res) => {
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: "title and body are required",
            });
        }

        try {
            // 1. Store notification
            const docRef = await db.collection("notifications").add({
                title,
                body,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 2. Fetch all tokens
            const tokens = await getAllFcmTokens();

            // 3. Send push
            await sendPushNotification(tokens, title, body);

            res.status(201).json({
                success: true,
                notificationId: docRef.id,
                pushSentTo: tokens.length,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message,
            });
        }

    }
);


// Public: fetch notifications for panel
router.get(
    "/notifications",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const snapshot = await db
                .collection("notifications")
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();

            const notifications = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            res.json({
                success: true,
                notifications,
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
