require('dotenv').config({path:__dirname+'/.env'});
const jwt = require('jsonwebtoken')



module.exports = (req,res,next)=>{
    try{
        console.log("Middleware called!")
        const token=req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token,process.env['JWT_KEY']);
        req.userData = decoded;
        let currentTime = Date.now().valueOf()/1000;
        console.log(currentTime-decoded.exp);
        if (decoded.exp  < currentTime){
            return res.json({
                success:false,
                message:"Token expired!"
            })
        }

        next();
    }catch (e){
            return res.status(401).json({
                success:false,
                message:"Not authenticated!"
            })
    }

}