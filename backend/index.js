const express=require('express'); 


const app =express();


app.get('/',(req,res)=>{
    res.send("hello World");
})

const PORT=5000;

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
    
})