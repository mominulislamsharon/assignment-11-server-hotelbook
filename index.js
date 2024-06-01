const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a1brhlt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const hotelCollection = client.db('hotelBook').collection('room');
    const bookingCollection = client.db('hotelBook').collection('bookings');

    app.get('/room', async(req, res) => {
        const cursor = hotelCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/details/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};

        const options = {
            projection: {name: 1, description:  1, pricePerNight: 1, availability: 1,roomImages: 1, roomSize: 1, specialOffers: 1, },
          };

        const result = await hotelCollection.findOne(query, options);
        res.send(result);
    })

    // booking
    app.post('/booking', async(req, res) => {
        const booking = req.body;
        console.log(booking);
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
        
    });

    app.get('/booking', async(req, res) => {
      console.log(req.query.email);
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('hotel book open')
})

app.listen(port, () => {
    console.log(`hotel book is running on port ${port}`)
})