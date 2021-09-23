const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const UserSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        match : /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    firstName : {
        type:String,
        required:true,
    },
    lastName : {
      type:String,
      required:true,
    },
    password:{
        type:String,
        required:true,

    },
    numberOfSeedsWritten:{
        type:Number,
        required:false,
        default:0
    },
    numberOfCrawlsWritten:{
        type:Number,
        required:false,
        default:0
    }
})



module.exports = mongoose.model("User",UserSchema);



