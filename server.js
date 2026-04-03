const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔴 SET THIS (important)
const TARGET_PLACE_ID = 70845479499574; // <-- replace with Bite by Nite placeId

let lastSeen = {};

app.post("/check-presence", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ success: false, error: "No userId provided" });
  }

  try {
    const response = await axios.post(
      "https://presence.roblox.com/v1/presence/users",
      {
        userIds: [userId],
      }
    );

    const user = response.data.userPresences[0];

    const isInGame = user.userPresenceType === 2;

    const isCorrectGame =
      user.placeId === TARGET_PLACE_ID ||
      (user.lastLocation &&
        user.lastLocation.toLowerCase().includes("bite"));

    const now = Date.now();

    if (isInGame && isCorrectGame) {
      lastSeen[userId] = now;
    }

    const wasRecentlyInGame =
      lastSeen[userId] && now - lastSeen[userId] <= 10 * 60 * 1000;

    res.json({
      success: true,
      isInGame,
      isCorrectGame,
      wasRecentlyInGame,
      valid: (isInGame && isCorrectGame) || wasRecentlyInGame,
      placeId: user.placeId,
      lastLocation: user.lastLocation,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});