const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const stream = require('stream');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const getOauth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/drive/callback'
  );
};

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// @route GET /api/drive/auth-url
// Generate Google OAuth URL
router.get('/auth-url', protect, (req, res) => {
  const oauth2Client = getOauth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: req.user.id // pass the user ID as state to link account in callback
  });
  res.json({ success: true, url: authUrl });
});

// @route GET /api/drive/callback
// Handle Google OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

  if (error) {
    return res.redirect(`${frontendUrl}/settings?drive_error=access_denied`);
  }

  try {
    const oauth2Client = getOauth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // state is the User ID passed earlier
    const user = await User.findById(state);
    if (!user) {
      return res.redirect(`${frontendUrl}/settings?drive_error=user_not_found`);
    }

    user.googleDriveRefreshToken = tokens.refresh_token || user.googleDriveRefreshToken; // keep existing if new one isn't provided
    user.googleDriveEmail = userInfo.data.email;
    await user.save();

    res.redirect(`${frontendUrl}/settings?drive_success=true`);
  } catch (err) {
    console.error('Google OAuth Error:', err);
    res.redirect(`${frontendUrl}/settings?drive_error=auth_failed`);
  }
});

// @route POST /api/drive/upload/:leadId
// Upload a document and attach to Lead
router.post('/upload/:leadId', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    let fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    let isCloud = false;

    // Check if user has Google Drive Connected
    const user = await User.findById(req.user.id);
    if (user && user.googleDriveRefreshToken && process.env.GOOGLE_CLIENT_ID) {
      try {
        const oauth2Client = getOauth2Client();
        oauth2Client.setCredentials({ refresh_token: user.googleDriveRefreshToken });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fs.readFileSync(req.file.path));

        const response = await drive.files.create({
          requestBody: {
            name: `${lead.name}_${req.file.originalname}`,
            mimeType: req.file.mimetype,
          },
          media: {
            mimeType: req.file.mimetype,
            body: bufferStream,
          },
          fields: 'id, webViewLink'
        });

        fileUrl = response.data.webViewLink;
        isCloud = true;

        // Clean up local file since it's uploaded to drive
        fs.unlinkSync(req.file.path);
      } catch (driveErr) {
        console.error('Google Drive Upload Error:', driveErr.message);
        // Fallback to local fileUrl
      }
    }

    const newDoc = {
      name: req.file.originalname,
      url: fileUrl, 
      uploadedAt: new Date()
    };

    lead.documents.push(newDoc);
    await lead.save();

    res.json({ 
      success: true, 
      document: newDoc, 
      message: isCloud ? 'Saved securely to Google Drive' : 'Saved to Local Storage' 
    });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/drive/document/:leadId/:docId
// Remove document
router.delete('/document/:leadId/:docId', protect, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    lead.documents = lead.documents.filter(doc => doc._id.toString() !== req.params.docId);
    await lead.save();

    res.json({ success: true, message: 'Document removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
