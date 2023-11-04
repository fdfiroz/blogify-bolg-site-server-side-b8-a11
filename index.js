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

// Get all blogs

// Filtering API Format
//http://Localhost:5000/api/v1/blogs  situation 1
//http://localhost:5000/api/v1/blogs?category=home-services  situation2
//http:///Localhost:5000/ap1/v1/blogs?sortField=dateCreated&sortOrder=desc
//http://localhost:5000/api/v1/blogsservice?search=home  Search API Format
app.get("/api/v1/blogs", async (req, res) => {
  try {
    // Add code to get all blogs
    let queryObj = {};
    let sortObj = {};
    // let searchObj = {};
    const category = req.query.category;
    const search = req.query.search;
    const sortField = req.query.sortField;
    const sortOrder = req.query.sortOrder;

    if (category) {
      queryObj.category = category;
    }
    if (search) {
      queryObj.title = { $regex: search, $options: "i" };
    }
    if (sortField && sortOrder) {
      sortObj[sortField] = sortOrder;
    }
    const cursor = blogCollection.find(queryObj).sort(sortObj);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    // Add code to handle errors
    onsole.log(error);
    res.send(error);
  }
});

// Add comment to a blog
app.patch("/api/v1/blogs/:blog_id/comments", async (req, res) => {
  try {
    // Add code to add comment to a blog
    const blog_id = req.params.blog_id;
    const { commenterName, commenterProfilePicture, comment_text } = req.body;
    const query = { _id: new ObjectId(blog_id) };
    const comment = {
      blog_id,
      commenterName,
      commenterProfilePicture,
      comment_text,
      date_commented: new Date(),
    };

    const result = await blogCollection.updateOne(query, {
      $push: { comments: comment },
    });
    res.send(result);
  } catch (error) {
    // Add code to handle errors
    console.log(error);
    res.send(error);
  }
});

// Get a single blog with details and comments
app.get("/api/v1/blog/:id" async (req, res)=>{
  try{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await blogCollection.findOne(query);
    res.send(result);
  }catch(error){
    console.log(error);
    res.send(error);
  }
})



app.get("/", (req, res) => {
  res.send("Blogify Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
