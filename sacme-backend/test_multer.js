const express = require('express');
const request = require('supertest');
const { uploadAvatar } = require('./controllers/profileController');
const fs = require('fs');
const path = require('path');

const app = express();

// A test wrapper to catch Multer errors globally just like Express does
app.post('/test-upload', (req, res, next) => {
  // Try to upload
  const upload = uploadAvatar.single('avatar');
  upload(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    res.json({ success: true, filename: req.file.filename });
  });
});

// Setup upload dir
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}

// Create mock files
fs.writeFileSync('test-valid.png', Buffer.alloc(1024, 'a')); 
fs.writeFileSync('test-malicious.exe', Buffer.alloc(1024, 'a')); 
fs.writeFileSync('test-large.png', Buffer.alloc(3 * 1024 * 1024, 'a')); 

async function runTests() {
  console.log("\n--- RUNNING MULTER CONSTRAINTS TESTS ---");

  // TEST 1: Valid Image
  console.log("\nTest 1: Uploading valid 1KB PNG...");
  const res1 = await request(app).post('/test-upload').attach('avatar', 'test-valid.png', { contentType: 'image/png' });
  console.log("Status:", res1.status);
  console.log("Response:", res1.body);

  // TEST 2: Invalid Extension/Mimetype
  console.log("\nTest 2: Uploading malicious .exe file...");
  const res2 = await request(app).post('/test-upload').attach('avatar', 'test-malicious.exe', { contentType: 'application/x-msdownload' });
  console.log("Status:", res2.status);
  console.log("Response:", res2.body);

  // TEST 3: Size Limit
  console.log("\nTest 3: Uploading large 3MB PNG (Limit 2MB)...");
  const res3 = await request(app).post('/test-upload').attach('avatar', 'test-large.png', { contentType: 'image/png' });
  console.log("Status:", res3.status);
  console.log("Response:", res3.body);

  console.log("\n--- TESTS COMPLETE ---\n");
}

runTests().then(() => {
  fs.unlinkSync('test-valid.png');
  fs.unlinkSync('test-malicious.exe');
  fs.unlinkSync('test-large.png');
}).catch(e => console.error(e));
