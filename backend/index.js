const express=require('express'); 
const mongoose=require('mongoose');

const app =express();

app.use(express.json()); // middleware to parse the Json data 

const mongoURI = "mongodb://127.0.0.1:27017/todoDB";



mongoose.connect(mongoURI,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

const db=mongoose.connection;

db.on("error",console.error.bind(console, "MongoDB connection error:"));
db.once("open",()=>console.log("Conneted the MongoDB"));

app.get('/',(req,res)=>{
    res.send("Conneted the MongoDB");
})

const PORT=5000;

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
    
})