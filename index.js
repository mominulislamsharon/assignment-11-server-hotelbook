


const express = require('express'); 
const cors = require('cors'); 
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser'); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 
require('dotenv').config(); 
const app = express(); 
const port = process.env.PORT || 5000; 

// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a1brhlt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Custom Middleware 
const logger = async (req, res, next) => {
  console.log("called", req.host, req.originalUrl); 
  next(); 
}

//  middleware self
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token; 
  if (!token) {
    return res.status(401).send({ message: 'not authorized' }); 
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" }); 
    }
    req.user = decoded;  
    next(); 
  });
}

async function run() {
  try {
    const hotelCollection = client.db('hotelBook').collection('room'); 
    const bookingCollection = client.db('hotelBook').collection('bookings'); 

    // auth related api jwt
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); 
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
      }).send({ success: true });
    });

    // room related api 
    app.get('/room', logger, async (req, res) => {
      const { type, search } = req.query; 
      console.log('room typee:', type);
      console.log('serach room:', search)
      const query = {};
    
   
      if (type && type !== 'All') {
        query.name = type; 
      }
  if (search) {
    query.name = { $regex: search, $options: 'i' }; 
  }

  const cursor = hotelCollection.find(query); 
  const result = await cursor.toArray();
  res.send(result); 
});

    app.get('/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { name: 1, description: 1, pricePerNight: 1, availability: 1, roomImages: 1, roomSize: 1, specialOffers: 1 },
      };
      const result = await hotelCollection.findOne(query, options);
      res.send(result);
    });

    // BOOKING API
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking); // বুকিং ডেটাবেসে যোগ করা হচ্ছে
      res.send(result);
    });

    app.get('/booking/:email', async (req, res) => {
      let query = { email: req.params.email };
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray(); 
      res.send(result);
    });

    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(id), email }); 
      res.send(result);
    });

    app.patch('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const updatedBooking = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: updatedBooking,
      };
      const result = await bookingCollection.updateOne(query, updateDoc); 
      res.send(result);
    });

  } finally {
    // await client.close();
  }
}

run().catch(console.dir); 

app.get('/', (req, res) => {
  res.send('hotel book open'); 
});

app.listen(port, () => {
  console.log(`hotel book is running on port ${port}`);
});
