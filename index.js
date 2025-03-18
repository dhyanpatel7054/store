require('dotenv').config();
const cloudinary = require('cloudinary');
const connectWithDb = require('./config/db');
const app = require('./app');

console.log('MONGO_URI:', process.env.MONGO_URI);

// Connect to DB
connectWithDb();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running at port: ${process.env.PORT}`);
});
