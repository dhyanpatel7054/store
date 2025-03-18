const mongoose = require('mongoose');

const connectWithDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);  // Exit the process if the DB connection fails
  }
};

module.exports = connectWithDb;
