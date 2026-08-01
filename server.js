const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'checkins.json');

// 确保 data 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}', 'utf-8');
}

app.use(express.json());

// ============ API ============

// 获取所有签到记录
app.get('/api/checkins', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: true, data: {} });
  }
});

// 签到
app.post('/api/checkin', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, error: '缺少 id' });

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const now = new Date();
    const h = ('0' + now.getHours()).slice(-2);
    const m = ('0' + now.getMinutes()).slice(-2);
    const s = ('0' + now.getSeconds()).slice(-2);
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    data[id] = {
      time: h + ':' + m + ':' + s,
      date: now.getFullYear() + '-' + month + '-' + day
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, data: data[id] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 撤销签到
app.delete('/api/checkin/:id', (req, res) => {
  const { id } = req.params;
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (data[id]) {
      delete data[id];
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true });
    } else {
      res.json({ success: true, message: '记录不存在' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 清空所有签到记录
app.post('/api/checkins/reset', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, '{}', 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ============ 静态文件（放在 API 之后）============
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
