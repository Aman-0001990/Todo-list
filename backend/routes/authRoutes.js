const express = require("express");
const bcrypt = require('bcryptjs');
const jwt=require("jsonwebtoken");
const User = require('../models/User');

const router = express.Router();


router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;      //req.body is an object that contains data sent by the client (frontend or API request).
        
        // Check if user already exists
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "user already exists" });
            
        }
        
        // Hash Password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // create new User 
        user = new User({ name, email, password: hashedPassword });
        
        //Save user to database 
        await user.save();
        
        res.status(201).json({ message: "User Registered successfully" });
    }
    catch (error) {
        res.status(500).json({ message: " Server error" });
    }
});

// User Registration Route
//  User Login Route
router.post('/login',async (req,res) => {

    try{
        const {email,password}=req.body;

        const user=await User.findOne({email });
        // Check if user exists
        if(!user){
            return res.status(400).json({message:"Invalid Email or Password"});
        }
        // Compare entered password with hashed password in db
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid password"})
        }
        const token =jwt.sign({userId:user._id},process.env.JWT_SECRET,{
            expiresIn:"1h",
        });
        res.json({token, message:"login Successfull"});
        
    }catch(error){
        res.status(500).json({message: "Server error",error});
    }
    
});
module.exports = router;
