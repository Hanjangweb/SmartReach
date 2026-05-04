const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('Password123', 12);
    
    await User.findOneAndUpdate(
      { email: 'success@agent.com' },
      { password: hashedPassword, role: 'admin', plan: 'pro' }
    );

    console.log('User success@agent.com reset to Password123, admin, pro');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPassword();
