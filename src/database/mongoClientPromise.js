import { MongoClient } from 'mongodb';


 var _mongomongoClientPromise;


const uri = process.env.MONGODB_CONNECTION_STRING;
const options = {};

let client;
let mongoClientPromise;

if (uri) {
  if (process.env.ENVIRONMENT === 'development') {
    if (!global._mongomongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongomongoClientPromise = client.connect();
    }
    mongoClientPromise = global._mongomongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    mongoClientPromise = client.connect();
  }
} else {
  mongoClientPromise = Promise.reject(new Error('Missing MONGODB_CONNECTION_STRING'));
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default mongoClientPromise;