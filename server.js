const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "checkins.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}", "utf-8");
}

app.use(express.json());
app.use(express.static(__dirname));

// Get all checkins
app.get("/api/checkins", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Check in
app.post("/api/checkin", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: "缺少 id" });

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const now = new Date();
    const h = ("0" + now.getHours()).slice(-2);
    const m = ("0" + now.getMinutes()).slice(-2);
    const s = ("0" + now.getSeconds()).slice(-2);
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const day = ("0" + now.getDate()).slice(-2);
    data[id] = {
      time: h + ":" + m + ":" + s,
      date: now.getFullYear() + "-" + month + "-" + day
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    res.json({ success: true, data: data[id] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Mark as paid
app.post("/api/pay/:id", (req, res) => {
  const { id } = req.params;
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (!data[id]) {
      return res.status(404).json({ success: false, error: "未找到签到记录" });
    }
    const now = new Date();
    data[id].paid = true;
    data[id].paidTime = now.toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    res.json({ success: true, data: data[id] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Cancel payment
app.delete("/api/pay/:id", (req, res) => {
  const { id } = req.params;
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (!data[id]) {
      return res.status(404).json({ success: false, error: "未找到签到记录" });
    }
    delete data[id].paid;
    delete data[id].paidTime;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    res.json({ success: true, data: data[id] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Undo checkin
app.delete("/api/checkin/:id", (req, res) => {
  const { id } = req.params;
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (data[id]) {
      delete data[id];
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "未找到签到记录" });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Clear all checkins
app.post("/api/checkins/clear", (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, "{}", "utf-8");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
