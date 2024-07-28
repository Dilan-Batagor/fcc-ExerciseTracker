const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { main, getCollection } = require("./database");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: true }));

app.post("/api/users", async (req, res) => {
  try {
    await main();

    const username = req.body.username;
    const id = Math.floor(Math.random() * 10000);
    const idtoStr = id.toString();

    const collection = await getCollection();
    const insertResult = await collection.insertOne({
      _id: idtoStr,
      username: username,
      log: [],
    });

    res.json({ username, _id: idtoStr });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});


app.get('/api/users', async (req, res) => {

  const collection = await getCollection();
  try {
    const getAllCollection = await collection.find({}).toArray();
    res.json(getAllCollection);
  } catch (err) {
    res.status(500).json(err.message)
  }

})


app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let id = req.params._id;
    let { description, duration, date } = req.body;
    const collection = await getCollection();

    // Parse Duration to Int
    const parsedDuration = parseInt(duration);

    // Parse Date 
    const dateObject = new Date(date);
    const formattedDate = dateObject.toDateString();

    // Find id
    const findId = await collection.findOne({ _id: id });

    if (findId) {
      const log = findId.log;
      const strId = id.toString();

      // Date format empty
      if (!date) {
        const newDate = new Date();
        const newStr = newDate.toDateString();

        const filter = { _id: id };
        const updateDoc = {
          $push: {
            log: {
              description: description,
              duration: parsedDuration,
              date: newStr,
            },
          },
        };

        const result = await collection.updateOne(filter, updateDoc);

        res.json({
          _id: strId,
          username: findId.username,
          date: newStr,
          duration: newStr,
          description: description,
        });

        return;
      }

      // Update data
      const filter = { _id: id };
      const updateDoc = {
        $push: {
          log: {
            description: description,
            duration: parsedDuration,
            date: formattedDate,
          },
        },
      };

      const result = await collection.updateOne(filter, updateDoc);

      res.json({
        _id: strId,
        username: findId.username,
        date: formattedDate,
        duration: parsedDuration,
        description: description,
      });
    } else {
      res.status(404).json({ message: "Data tidak ditemukan" });
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});


app.get('/api/users/:_id/logs', async (req, res) => {
  let id = req.params._id;
  const {from, to, limit} = req.query;
  const collection = await getCollection();

  // Find Id
  try {
    const findId = await collection.findOne({_id: id});
    
    if (!findId) {
      return res.status(404).json({ message: 'Id not found' });
    }

    let logs = findId.log;

    // Filter berdasarkan rentang tanggal
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      logs = logs.filter(log => {
        const logDate = new Date(log.date)
        return logDate >= fromDate && logDate <= toDate;
      });
    }

    // Sort logs by date descending
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Apply limit if provided
    if (limit) {
      logs = logs.slice(0, parseInt(limit));
    }

    // Convert date to toDateString() format
    logs = logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString()
    }))

    res.json({
      _id: findId._id,
      username: findId.username,
      count: logs.length,
      log: logs
    });
  } catch (err) {
    res.status(500).json({message: 'Server internal error'})
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
