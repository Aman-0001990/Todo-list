require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes=require('./routes/authRoutes');

const app = express();

app.use(express.json()); // middleware to parse the Json data 

app.use('/api/auth',authRoutes);

const mongoURI = "mongodb://127.0.0.1:27017/todoDB";



mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log(`😊Mongoose connected 😊`))
.catch((error) => console.log(`🤣Not Connected 🤣${error}`))

// const db = mongoose.connection;

// db.on("error", console.error.bind(console, "MongoDB connection error:"));
// db.once("open", () => console.log("Conneted the MongoDB"));

// app.get('/', (req, res) => {
//     res.send("Conneted the MongoDB");
// })

const PORT =process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

})