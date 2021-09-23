const express = require('express');
const router = express.Router();
const Writing = require('../models/Writing');
const CheckAuth = require('../middleware/UserMiddleware');
const User = require('../models/User');

const getNumberOfSeeds = async(id)=>{
    const user = await User.findOne({_id:id});
    return user.numberOfSeedsWritten;
}
const getNumberOfCrawls = async(id)=>{
    const user = await User.findOne({_id:id});
    return user.numberOfCrawlsWritten;
}


//file uploading logic.
const multer = require('multer');

function fileFilter(req,file,cb){
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'){
        cb(null,true);
    }else{
        cb({
            success:false,
            error:"Invalid file type!"
        },false);
    }
}


const storage = multer.diskStorage({
    destination:function(req,file,cb){

        cb(null,'./uploads/bookImages/');
    },
    filename:function(req,file,cb){

        cb(null,file.originalname)
    }
})
const upload = multer({storage:storage,
    fileFilter : fileFilter

});
//adding a new crawler
router.post('/add-new-crawler',CheckAuth,async(req,res,next)=>{
    const id = req.userData.id;
    const parentWritingId= req.body.parentWritingId;
    let parentNumberOfNodes ;
    console.log(parentWritingId);
    try{
        parentNumberOfNodes= (await Writing.findOne({_id:parentWritingId})).nodes;
    }catch(e){
        console.log(e);
        console.log(parentWritingId);
        return res.status(401).json({
            success:false,
            message:"Not authenticated"
        })
    }
    //getting the parentId;
    //checking if the same body exists;
    const bodyCheck = await Writing.find({body:req.body.body});
    if (bodyCheck.length!==0){
        return res.status(401).json({
            success:false,
            body:"COPYCAT"
        })
    };


    Writing.findByIdAndUpdate({_id:parentWritingId},{nodes:parentNumberOfNodes+1,},{new:true}).then(async(parent)=>{
        console.log("Parent found!");
        //making the new crawler;
        //checking if seed and crawl have the same user;
        if (parent.authorID === id){
            console.log("Same user making a crawl!");
            return res.status(401).json({
                success:false,
                message:"Same user making a crawl not allowed!"
            })
        }
        try{
           Writing.create({
                title:parent.title,
                imageURL:parent.imageURL,
                authorID:id,
                body:req.body.body,
                origin:parent._id,
                description:(req.body.description ? req.body.description:parent.description)

            }).then(async(newCrawler)=>{
               //adding one to number of crawls written by the user;
               await User.findByIdAndUpdate({_id:id},{numberOfCrawlsWritten:(await getNumberOfCrawls(id))+1})


               //adding the current crawl id to the parent crawler list;
               Writing.findByIdAndUpdate({_id:parentWritingId},
                   {allCrawlers:[...parent.allCrawlers,newCrawler._id]},{new:true})
                   .then(newParent=>{
                       console.log("Parent updated!!");
                       return res.status(200).json({
                           success:true,
                           newCrawlerData:newCrawler
                       });
                   }).catch(err=>{
                   console.log("Error updating parent!");
                   return res.status(404).json({
                       success:false,
                       message:err.message
                   })
               })
           }).catch(err=>{
               console.log("Error making new crawl");
               return res.status(404).json({
                   success:false,
                   message:err.message
               })
           })




        }

        catch(e){
            console.log("Error making new crawler!");
            return res.status(401).json({
                success:false,
                message:e.message
            })
        }



    }).catch(e=>{
        console.log("Error finding parent!");
        return res.status(404).json({
            success:false,
            message : e.message,
        })
    })


})


//working
router.post('/add-new-seed',CheckAuth,upload.single('imageURL'),async(req,res,next)=>{
    const id = req.userData.id;
    const body = req.body.body;
    const title = req.body.title;
    const imageURL = req.file.path;
    const description = req.body.description;
    //checking for copy;
    console.log("Called!")
    const bodyCheck = await Writing.find({body:body});
    if  (bodyCheck.length !== 0){
        return res.status(401).json({
            success:false,
            message:'COPYCAT'
        })
    }

    //adding one to number of seeds written by the user;
    await User.findByIdAndUpdate({_id:id},{numberOfSeedsWritten:(await getNumberOfSeeds(id))+1});
    Writing.create({title:title,authorID:id,body:body,imageURL:imageURL,description:description}).then(result=>{
        console.log("New seed made!");
        return res.status(200).json({
            success:true,
        })
    }).catch(err=>{
        console.log("Error making new seed!");
        return res.status(404).json({
            success:false,
            message : err.message
        })
    })


})


router.get('/get-all-seeds',async(req,res,next)=>{
Writing.find({origin:null}).exec().then(async(allSeeds)=>{
    console.log("All seeds acquired!");
    const finalSeedResult= [];
    for (let seed of allSeeds){
        const userDetails = await User.findOne({_id:seed.authorID});

        finalSeedResult.push({
            title:seed.title,
            _id:seed._id,
            description:seed.description,
            imageURL:seed.imageURL,
            stars:seed.stars,
            userDetails:{username:userDetails.username,
                lastName:userDetails.lastName,
                firstName:userDetails.firstName}
        });
    }

    return res.status(200).json({
        success:true,
        allSeeds: finalSeedResult
    })
}).catch(err=>{
    console.log("Error!");
    console.log(err);
    return res.status(400).json({
        success:false,
        message : err.message
    })
})


});


router.put('/update-writing-stars/:writingID',CheckAuth,(req,res,next)=>{
    const writingID = req.params.writingID;
    const newNumberOfStars =req.body.newNumberOfStars;
    console.log(writingID);
    console.log(newNumberOfStars);
    Writing.findByIdAndUpdate({_id:writingID},
        {stars:newNumberOfStars},
        {new:true}).then(updatedWriting=>{
            console.log("Writing updated!");
            return res.status(200).json({
                success:true,
                writingDetails:updatedWriting
            })
    }).catch(err=>{
        console.log("Error updating writing stars!!");
        return res.status(404).json({
            success:false,
            message:err.message
        })
    })
})

router.get('/get-seed-body-and-stars/:id',(req,res,next)=>{
    const id = req.params.id;
    Writing.findOne({_id:id}).then(writing=>{
        if (!writing){
            return res.status(401).json({
                success:false,
                message:"Id not given"
            })
        }
        return res.json({
            success:true,
            body:writing.body,
            stars:writing.stars
        })
    }).catch(err=>{
        console.log(err);
        return res.status(404).json({
            success:false,
            message:err,
        })
    })
})


router.delete('/delete-seed',CheckAuth,async(req,res,next)=>{
    const id = req.userData.id;
    //check;
    const writingTest = await Writing.findOne({_id:req.body.id});
    if (writingTest.authorID !== id){
        //user trying to delete seed that does not belong to him.
        return res.status(401).json({
            success:false,
            message:"Not authorized!"
        })
    }else{
        //removing one from number of seeds written by the user;
        await User.findByIdAndUpdate({_id:id},{numberOfSeedsWritten:(await getNumberOfSeeds(id))-1})

        Writing.remove({_id:writingTest._id}).then(writing=>{
            console.log("Deleted!");
            return res.status(200).json({
                success:true
            })
        }).catch(err=>{
            console.log("Error deleting the seed!");
            return res.status(404).json({
                success:false,
                message:err.message
            })
        })
    }


})




router.delete('/delete-seed-and-crawlers',CheckAuth,async(req,res,next)=>{
    const id = req.userData.id;
    //check;
    const writingTest = await Writing.findOne({_id:req.body.id});
    if (writingTest.authorID !== id){
        //user trying to delete seed that does not belong to him.
        return res.status(401).json({
            success:false,
            message:"Not authorized!"
        })
    }else{
        Writing.remove({_id:writingTest._id}).then(writing=>{
            console.log("Deleted main seed!");
            //deleting all the crawlers;
            Writing.deleteMany({origin:writingTest._id}).then(async(allCrawlers)=>{

                await User.findByIdAndUpdate({_id:id},{
                    numberOfCrawlsWritten:(await getNumberOfCrawls(id))-allCrawlers.length,
                    numberOfSeedsWritten:(await getNumberOfSeeds(id))-1})


                console.log("All crawlers deleted!!");
                return res.status(200).json({
                    success:true,

                })
            }).catch(err=>{
                console.log("Crawlers not deleted!");
                return res.status(404).json({
                    success:false,
                    message:err.message
                })
            })


        }).catch(err=>{
            console.log("Error deleting the seed!");
            return res.status(404).json({
                success:false,
                message:err.message
            })
        })
    }

})


router.delete('/delete-crawler',CheckAuth,async(req,res,next)=>{
    const id = req.userData.id;
    const crawlerId = req.body.crawlerId;
    //checking if the crawler author is the same as the logged in user;
    const writingCheck = await Writing.findOne({_id:crawlerId});
    if (id !== writingCheck.authorID){
        console.log("Deletion not allowed!");
        return res.status(401).json({
            success:false,
            message:"Not authenticated!"
        })
    }else{
        //adding one to number of crawls written by the user;
        await User.findByIdAndUpdate({_id:id},{numberOfCrawlsWritten:(await getNumberOfCrawls(id))-1})
        //check passed;
        Writing.remove({_id:crawlerId}).then(result=>{
            console.log("Crawler deleted!");
            return res.status(200).json({
                success:true,
                writing:result
            })
        }).catch(err=>{
            console.log("Error deleting crawler!");
            return res.status(404).json({
                success:false,
                message:err.message
            })
        })

        ;
    }
})



router.get('/get-crawlers-for-seed/:parent',(req,res,next)=>{
    const parent = req.params.parent;
    console.log("Called!")
    if (!parent){
        return res.status(401).json({
            success:false,
            message:"Parent ID not given!"
        })
    }
    Writing.find({origin:parent}).then(async allCrawlers=>{
        console.log(`All crawlers found for ${parent}!`);
        const finalCrawlerResult= [];
        for (let crawler of allCrawlers){
            const userDetails = await User.findOne({_id:crawler.authorID});

            finalCrawlerResult.push({
                title:crawler.title,
                _id:crawler._id,
                description:crawler.description,
                imageURL:crawler.imageURL,
                stars:crawler.stars,
                body:crawler.body,
                userDetails:{username:userDetails.username,
                    lastName:userDetails.lastName,
                    firstName:userDetails.firstName}
            });
        }
        return res.status(200).json({
            success:true,
            allCrawlers : finalCrawlerResult ? finalCrawlerResult:[]
        })
    }).catch(err=>{
        console.log(`Error finding crawlers for ${parent}!`);
        return res.status(400).json({
            success:false,
            message:err
        })
    })
});

router.get('/get-seed/:id',(req,res,next)=>{
    const seedId = req.params.id;
    if (!seedId){
        return res.status(401).json({
            success:false,
            message:"ID not provided!"
        })
    }
    Writing.findOne({_id:seedId}).then(seed=>{
        if (!seed){
            return res.status(401).json({
                success:false,
                message:"Seed not found!"
            })
        }else{
            return res.status(200).json({
                success:true,
                seedData : seed
            })
        }
    }).catch(err=>{
        console.log('Error!');
        return res.status(404).json({
            success:false,
            message:err.message
        })
    })

})



module.exports = router;