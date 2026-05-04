const User = require('../models/User');

exports.protectApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Not authorized, API key missing' });
    }

    const user = await User.findOne({ apiKey });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid API key' });
    }

    // Only allow advanced users to use API
    if (user.plan !== 'advanced' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'API access requires the Advanced plan' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
