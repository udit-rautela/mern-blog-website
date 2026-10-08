import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config'
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import admin from 'firebase-admin';
import serviceAccountKey from './serviceAccountKey.json' with { type: "json" };
import { getAuth } from 'firebase-admin/auth';
import aws from "aws-sdk";

//schema import
import User from './Schema/User.js';
import Blog from './Schema/Blog.js';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
});

const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json())
server.use(cors())

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})
.then(() => {
    console.log('MongoDB connected successfully')
})
.catch((err) => {
    console.log('MongoDB connection error:', err.message)
})

// AWS connection of S3 bucket

const s3 = new aws.S3({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY

})

const generateUploadURL = async (contentType) => {

    const date = new Date();
    const imageName = `${nanoid()} - ${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'bucket-mern-blogging-website',
        Key: imageName,
        Expires: 1000,
        ContentType: contentType
    })

}

// Verify JWT middleware
const verifyJWT = (req, res, next) => {
    const authHeader = req.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Assuming, token is in the format "Bearer <token

    if (token == null) {
        return res.status(401).json({ error: "Access denied. No access token ." });
    }

    jwt.verify(token,  process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err){
            return res.status(403).json({ error: "Invalid token." });
        }

        req.user = user.id;
        next();
    })
}


// to get data from the DB
const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id}, process.env.SECRET_ACCESS_KEY)

    return{
        access_token,  // to validate the user login
        profile_img : user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    }
}

const generateUsername = async(email) => {
    let username = email.split("@")[0];
    let isUsernameNotUnique = await User.exists({"personal_info.username": username}).then((result) => result)

    isUsernameNotUnique ? username += nanoid().substring(0,5) :  "";    // bcz, auto generated nanoid is too long, toh subString le li.

    return username
}

//upload imageURL root to the S3 bucket 
server.get('/get-upload-url', (req,res) => {
    const contentType = req.query.contentType || "image/jpeg";

    if(!["image/jpeg", "image/png"].includes(contentType)){
        return res.status(400).json({ error: "Only JPEG and PNG images are supported" });
    }

    generateUploadURL(contentType).then(url => res.status(200).json({uploadURL : url}))
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })
})


// isme hum callback de rahe hai , jis se hum frontend ka data leke 
// wapas frontend me send kar de rahe hai.
server.post("/signup",(req, res) => {      // this is our login/signup for our google auth.

    let authorId = req.user;
    let {fullname, email, password} = req.body;       // if not this, then we have to write req.body.fullname

    if(!title.length){
        return res.status(403).json({"error": "You must provide a Blog title "});
    }

    if(!draft){
            // validating data from signup page
        if(fullname.length < 3){
            return res.status(403).json({"error": "Fullname must be three letters long"}); // invalid status code = 403
        }
        // checking email
        if(!email.length){
            return res.status(403).json({"error":"Enter the email"})
        }
        if(!emailRegex.test(email)){
            return res.status(403).json({"error":"Enter the email in correct way"})
        }
        if(!passwordRegex.test(password)){
            return res.status(403).json({"error":"Password should be 6 to 20 characters long with a numeric , 1 lowercase and 1 uppercase letter."})
        }
    }



    bcrypt.hash(password, 10, async (err, hashed_password) => {

        let username = await generateUsername(email);   // return front part ahead of @

        let user = new User({
            personal_info: {fullname, email, password: hashed_password, username}
        })

        user.save().then((u) => {     // when the promise .save() will execute after that what we have to do

            return res.status(200).json(formatDatatoSend(u))

        })
        .catch(err => { 

            if(err.code == 11000){ // duplication ka error nahi dikhana, only message.
                return res.status(500).json({"error":"Email already exists, Try other email."})
            }

            return res.status(500).json({"error": err.message})
        })
    })

})

server.post("/signin", (req, res) => {
    
    let {email,password} = req.body

    User.findOne({"personal_info.email": email})
    .then((user) => {
        if(!user){
            return res.status(403).json({"error": "Email not found"});
        }
        
        if(!user.google_auth)
        {
            bcrypt.compare(password, user.personal_info.password, (err, result) =>{

                if(err){
                    return res.status(403).json({"error": "Error occured while login please try again"});
            
                }
                
                if(!result){
                    return res.status(403).json({"error": "Incorrect password"})
                }
                else{
                    return res.status(200).json(formatDatatoSend(user))
                }
            })

        }
        else{
            return res.status(403).json({"error": "Account was created using google , Please try logging in google. "})
        }

    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({"error": err.message})
    })

})

server.post("/google-auth", async (req, res) => {

    let {access_token} = req.body;
    // verify the access token with Firebase Admin SDK
    getAuth().verifyIdToken(access_token)
    .then(async (decodedUser) => {

        let {email, name, picture} = decodedUser;

        picture = picture.replace("s96c", "s384-c");         // to get the high resolution image

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch((err) => {
            return res.status(500).json({"error": err.message})
        })

        if(user){
            if(!user.google_auth){
                return res.status(403).json({"error": "User not registered with Google"});
            }
        }
        else{ // sign up

            let username = await generateUsername(email);

            user = new User({
                personal_info: {fullname: name, email, username},
                google_auth: true
            })

            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({"error": err.message})
            })
        }
        
        return res.status(200).json(formatDatatoSend(user))

    })
    .catch(err =>{
        return res.status(503).json({"error": "Failed to authenticate you with google. Try with some other google account" })
    })


})


//only for logged in user, to create a blog. for that we will use the access_token to verify the user , which is stored in the session of the user.
server.post('/create-blog',verifyJWT, (req, res) => {

    let authorId = req.user;

    let {title, content, banner, des, tags, draft} = req.body;
    // validating the data from the frontend
    
    if(!title.length){
        return res.status(403).json({"error": "Blog title required to publish the blog"});
    }

    if(!draft){
        if(!des.length || des.length > 200){
            return res.status(403).json({"error": "Blog description required to publish the blog and it should be less than 200 characters"});
        }
        if(!banner.length){
            return res.status(403).json({"error": "Blog banner image required to publish the blog"});
        }
        if(!content || !content.blocks || !content.blocks.length){
            return res.status(403).json({"error": "Blog content required to publish the blog"});
        }
        if(!tags.length || tags.length > 10){
            return res.status(403).json({"error": "Blog tags required to publish the blog and it should be less than 10 tags"});
        }
    }

    // looping through the tags to check if they are valid or not
    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();

    let blog = new Blog({
        title, content, banner, des, tags, draft: Boolean(draft), author: authorId, blog_id
    })
    
    blog.save().then(blog => {

        let incrementVal = draft ? 0 : 1;

        User.findOneAndUpdate({_id: authorId}, {$inc: {"account_info.total_posts" :  incrementVal}, $push : {"blogs": blog._id} })
        .then(user => {
            return res.status(200).json({ id: blog.blog_id});
        })
        .catch(err => {
            return res.status(500).json({error: "failed to update the user data after creating the blog"});
        })

    })
    .catch(err => {
        return res.status(500).json({error: err.message});
    })

});

server.listen(PORT, () => {
    console.log('listening on port -> ' + PORT); 
})