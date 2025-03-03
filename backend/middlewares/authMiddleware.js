const jwt=require("jsonwebtoken");

const authMiddleware=(req,res,next)=>{
    const token=req.header("Authorization");
    if(!token){
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded; //add user info to request
        next();
    }catch(error){
        res.status(401).json({message:"Invalid Token"});
    }
};
module.exports=authMiddleware;