const mongoose =require("mongoose");

const taskSchema=new mongoose.Schema({
    tittle:{
        type:String,
        required:true
    },
    completed:{
        type:Boolean,
        default:false
    },
    createdAt:{type:Date,default:Date.now},
});


const Task=mongoose.model("Task",taskSchema);

module.exports=Task;