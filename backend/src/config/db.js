import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  const options = {
    dbName: 'todo-list',
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority',
  };

  let retries = 5;

  while (retries > 0) {
    try {
      await mongoose.connect(uri, options);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      console.log(`Database: ${mongoose.connection.name}`);

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });

      return;
    } catch (err) {
      retries -= 1;
      console.error(`MongoDB connection failed. Retries left: ${retries}`);
      console.error('Error:', err.message);

      if (retries === 0) {
        console.error('All MongoDB connection attempts exhausted. Exiting...');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export default connectDB;
