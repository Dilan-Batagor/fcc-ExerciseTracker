const { MongoClient } = require("mongodb");

const url =
  "mongodb+srv://tidaktau:KGytY5uvX7eXB5mE@cluster0.9shpezm.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(url);

async function main() {
  try {
    await client.connect();
  } catch (err) {
    console.error("Error connecting to database:", error);
    process.exit(1); // Exit process on connection error
  }
}

async function getCollection() {
  const db = client.db("user");
  const collection = db.collection("usersInfo");
  return collection;
}

module.exports = { main, getCollection };
