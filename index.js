const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k53g2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const userCollection = client.db("carrierConnect").collection("users");
    const jobsCollection = client.db("carrierConnect").collection("jobs");
    const appliedJobsCollection = client
      .db("carrierConnect")
      .collection("appliedJobs");
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // post user if not exist
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // get one user by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const data = await userCollection.findOne(query);
      res.send(data);
    });
    // post a job
    app.post("/jobs", async (req, res) => {
      const data = req.body;
      const result = await jobsCollection.insertOne(data);
      res.send(result);
    });
    // jobs by email
    app.get("/jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { hrEmail: email };
      const data = await jobsCollection.find(query).toArray();
      res.send(data);
    });
    // delete job by id
    app.delete("/deleteJob/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });
    // update job
    app.patch("/updateJob/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = { $set: req.body };
      const result = await jobsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    // applied job application for hr
    app.get("/appliedJobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { hrEmail: email };
      const data = await appliedJobsCollection.find(query).toArray();
      res.send(data);
    });
    app.get("/hr-stats/:email", async (req, res) => {
      const email = req.params.email;

      const totalApplicants = await appliedJobsCollection.countDocuments({
        hrEmail: email,
      });

      const pendingApplicants = await appliedJobsCollection.countDocuments({
        hrEmail: email,
        status: "pending",
      });

      const acceptedApplicants = await appliedJobsCollection.countDocuments({
        hrEmail: email,
        status: "accepted",
      });

      const rejectedApplicants = await appliedJobsCollection.countDocuments({
        hrEmail: email,
        status: "rejected",
      });

      const totalPosts = await jobsCollection.countDocuments({
        hrEmail: email,
      });

      res.send({
        totalPosts,
        totalApplicants,
        pendingApplicants,
        acceptedApplicants,
        rejectedApplicants,
      });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job is falling from sky");
});
app.listen(port, () => {
  console.log(`carrierConnect running at ${port}`);
});
