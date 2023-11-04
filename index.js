const express = require("express");
const app = express();
const jwt = require("jsonwebtoken"); //npm i jsonwebtoken
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    // origin: ["http://localhost:5173"],
    // credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@blogify.ioy6vjf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const database = client.db("blogify");
const blogCollection = database.collection("blogs");
const wishlistCollection = database.collection("wishlist");

// Blog Routes

// Create a blog
app.post("/api/v1/create-blog", async (req, res) => {
  try {
    const {
      title,
      image,
      category,
      shortDescription,
      longDescription,
      author,
      authorEmail,
      authorProfilePicture,
    } = req.body;
    const blog = {
      title,
      image,
      category,
      shortDescription,
      longDescription,
      author,
      authorEmail,
      authorProfilePicture,
      dateCreated: new Date(),
    };

    const result = await blogCollection.insertOne(blog);
    console.log(result);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});



app.get("/", (req, res) => {
  res.send("Blogify Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
