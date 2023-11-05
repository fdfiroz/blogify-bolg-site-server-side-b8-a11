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
    origin: ["http://localhost:5173"],
    credentials: true,
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

//JWT Middleware
app.post("/api/v1/auth/access-token", async (req, res) => {
  const body = req.body;
  //   jwt.sign("payload", "secretKey", "expireInfo");
  // user: abc@gmail.com
  const token = jwt.sign(body, process.env.ACCESS_TOKEN, { expiresIn: "10h" });
  const expirationDate = new Date(); // Create a new Date object
  expirationDate.setDate(expirationDate.getDate() + 7); // Set the expiration date to 7 days from the current date
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      expires: expirationDate,
    })
    .send({ massage: "success" });
 
  //   res.send({ body, token });
});

const verify = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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
app.get("/api/v1/blog/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await blogCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

app.get("/api/v1/featured-blogs", async (_, res) => {
  try {
    // Add code to get featured blogs
    const projection = {
      title: 1,
      author: 1,
      authorEmail: 1,
      authorProfilePicture: 1,
    };
    const pipeline = [
      {
        $project: {
          title: 1,
          author: 1,
          authorEmail: 1,
          authorProfilePicture: 1,
          longDescription:1,
          word_count: { $size: { $split: ["$longDescription", " "] } }
        }
      },
      {
        $sort: {
          word_count: -1
        }
      },
      {
        $limit: 10
      }
    ];
    
    // Aggregate the blog collection and get the featured blogs
    const featuredBlogs = await blogCollection.aggregate(pipeline).toArray();
  
    // Return the featured blogs
    res.status(200).json(featuredBlogs);
  } catch (error) {
    // Add code to handle errors
    console.log(error);
    res.send(error);
  }

});

// Wishlist Routes

// Get wishlists by user email
app.get("/api/v1/wishlists", verify, async (req, res) => {
  try {
    // Add code to get wishlists by user email
    const queryEmail = req.query.email;
    const tokenEmail = req.user.email;
    let query = {}
  
    if(queryEmail !== tokenEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }
    if(queryEmail){
      query.email = queryEmail
    }
      const result = await wishlistCollection.find({query}).toArray();
      res.send(result);
 
  } catch (error) {
    // Add code to handle errors
    console.log(error);
    res.send(error);
  }
});

// Create a wishlist
app.post("/api/v1/create-wishlist", verify, async (req, res) => {
  try {
    // Add code to create a wishlist
    const wishlist = req.body;
    const result = await wishlistCollection.insertOne(wishlist);
    res.send(result);
  } catch (error) {
    // Add code to handle errors
    console.log(error);
    res.send(error);
  }
});

// Delete a wishlist
app.delete("/api/v1/delete-wishlist/:id", verify, async (req, res) => {
  try {
    // Add code to delete a wishlist
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await wishlistCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    // Add code to handle errors
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
