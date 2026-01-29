if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const fs = require("fs");
  const path = "/tmp/serviceAccount.json";

  fs.writeFileSync(
    path,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );

  process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
}

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const testRoute = require("./routes/testRoute");
app.use("/api", testRoute);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api", notificationRoutes);

const tokenRoutes = require("./routes/tokenRoutes");
app.use("/api", tokenRoutes);

const liveEventRoutes = require("./routes/liveEventRoutes");
app.use("/api", liveEventRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
