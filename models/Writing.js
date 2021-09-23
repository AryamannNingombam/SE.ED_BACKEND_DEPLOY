const mongoose = require('mongoose');
const Schema = mongoose.Schema;




const WritingSchema = new Schema({
    title : {
      type:String,
      required:true,
    },
    imageURL : {
        type:String,
        required:true,
    },
    description:{
      type:String,
      required:true,

    },
    authorID : {
        type : String,
        required:true,

    },
    allCrawlers : {
        type : [String],
        required:false,
        default:[]
    },
    body : {
        type : String,
        required:true,
    },
    origin : {
        type:String,
        required:false,
        default:null
    },
    archive : {
        type : Boolean,
        default:false,
        required:false,
    },
    nodes : {
        type: Number,
        default:0,
        required:false,
    },
    stars : {
        type:Number,
        default:0,
        required:false,
    },





})

module.exports = mongoose.model("Writing",WritingSchema);

