const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const promoteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.findOneAndUpdate(
      { email: 'success@agent.com' },
      { role: 'admin', plan: 'pro' },
      { new: true }
    );

    if (result) {
      console.log('User promoted to Admin and Pro plan:');
      console.log(result);
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

promoteUser();
