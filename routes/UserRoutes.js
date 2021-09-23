require('dotenv').config({path:__dirname+'/.env'});
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const CheckAuth = require('../middleware/UserMiddleware');





//working
router.post('/test-request',CheckAuth,(req,res,next)=>{
    console.log(req.userData);
    return res.json({
        success:true,
    })
})






//working
router.post('/sign-up',async(req,res,next)=>{
    const email = req.body.email;
    const username = req.body.username;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    //checks
    const emailCheck = await User.find({email:email});
    if (emailCheck.length !==0){
        return res.status(500).json({
            success:false,
            message : "Email already exists!"
        })
    }
    const usernameCheck =await  User.find({username:username})
    if (usernameCheck.length !== 0){
        return res.status(401).json({
            success:false,
            message : "Username already exists!"
        })
    }
    bcrypt.hash(password,10,(err,hashed)=>{
        if (err){
            return res.status(401).json({
                success:false,
                message : err.message
            })
        }else{
            User.create({username:username,password:hashed,firstName:firstName,
                lastName:lastName,email:email
            }).then(result=>{
                if (!result){
                    return res.json({
                        success:false,
                        message:"Problems creating new user!"
                    })
                }
                const userDataPayload = {
                    email:email,
                    firstName:firstName,
                    lastname:lastName,
                    username:username,
                    id : result._id,
                    numberOfSeedsWritten:0,
                    numberOfCrawlsWritten:0
                };
                const token =   jwt.sign(userDataPayload,process.env['JWT_KEY'],
                    {
                        expiresIn : "3h",

                    },

                )
                console.log("User signed in!");
                return res.status(200).json({
                    success:true,
                    token : token,
                    userData : userDataPayload
                })

            }).catch(err=>{
                console.log(err);
                return res.status(404).json({
                    success:false,
                    message : err.message
                })
            })
        }
    })

})
//working
router.delete('/delete-user',CheckAuth,(req,res,next)=>{
    const id = req.body.id;
    User.remove({_id:id}).then(result=>{
        console.log("Deleted!");
        console.log(result);
        return res.status(200).json({
            success:true,
            message:"User successfully deleted!"
        })
    }).catch(err=>{
        console.log("Error!");
        return res.status(404).json({
            success:false,
            message : err.message
        })
    })
})


router.get('/check-user-validity',CheckAuth,(req,res,next)=>{
    const userData = req.userData;
    return res.json({
            success:true,
            userData:userData,
    })
})

//working
router.post('/sign-in',async(req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    console.log(email);
    console.log(password);
    const userInfo = await  User.findOne({email:email});
    if (!userInfo){
        return res.status(401).json({
            success:false,
            message: "Not authenticated!"
        })
    }else{
        bcrypt.compare(password,userInfo.password,(err,doesExist)=>{
            if (err){
                return res.status(404).json({
                    success:false,
                    message : "Internal server error!"
                })
            }else{
                if (doesExist){
                    const userDataPayload = {
                        email:email,
                        firstName:userInfo.firstName,
                        lastname:userInfo.lastName,
                        username:userInfo.username,
                        id : userInfo._id,
                        numberOfSeedsWritten:userInfo.numberOfSeedsWritten,
                        numberOfCrawlsWritten:userInfo.numberOfCrawlsWritten
                    };
                  const token =   jwt.sign(userDataPayload,process.env['JWT_KEY'],
                        {
                            expiresIn : "3h",

                        },

                        )
                        console.log("User signed in!");
                        return res.status(200).json({
                            success:true,
                            token : token,
                            userData : userDataPayload
                        })
                }else{
                    return res.status(401).json({
                        success:false,
                        message: "Not authenticated!"
                    })
                }
            }
        })
    }
});

router.get('/get-user-data/:id',(req,res,next)=>{
    const id = req.params.id;
    User.findOne({_id:id}).then(user=>{
        console.log("User found!");
        return res.status(200).json({
            success:true,
            userData:user
        })
    }).catch(err=>{
        console.log("Error getting user data!");
        return res.status(404).json({
            success:false,
            message:err.message
        })
    })
})





module.exports = router;