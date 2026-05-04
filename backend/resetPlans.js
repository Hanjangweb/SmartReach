const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  await mongoose.connection.db.collection('plans').drop();
  console.log('Plans collection dropped.');
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
