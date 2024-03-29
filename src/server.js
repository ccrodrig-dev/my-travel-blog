import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();


//Firebase Intitializer
let admin = require("firebase-admin");

let serviceAccount = require("../dosoutdoors-firebase-adminsdk.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dosoutdoors-5f6f0.firebaseio.com"
});

app.use(require('prerender-node').set('prerenderToken', 'DB9UBIkt4MgxZNj1nfll'));
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDb = async (operations, res) => {
    let articleData = admin.database().ref('articles/');
    articleData.on('value', (snapshot) =>{
        const data = snapshot.val();
        operations(data);
        console.log(data);
    });

    
    // try{

    //     console.log("INITIATING DB COMM");
    //     const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser : true});
    //     const db = client.db('my-travel-blog');
    


    //     await operations(db);
        
    //     client.close();
    // }catch(error){
    //     res.status(500).json({message: 'Error Connecting to db', error})
    // }
}

app.get('/api/articles/:name', async (req, res) =>{
        withDb(async (db)=>{
            const articleName = req.params.name;
            console.log("Article name: "+articleName);
            const articles = await db

            let articleInfo = articles.filter(obj => {
                return obj.name === articleName;
            })
            console.log("The retrieved Object: "+JSON.stringify(articleInfo));
            console.log("200");
            res.status(200).json(articleInfo[0]);
            console.log("success");
        },res);  
})

app.post('/api/articles/:name/upvote', async(req,res)=> {

        const articleName = req.params.name;
       
        withDb(async (db)=>{
        const articelInfo = await db.collection('articles').findOne({name: articleName});
        console.log("orig upvote collected"+articelInfo);
        await db.collection('articles').updateOne({name: articleName},{
            '$set':{
                upvotes: articelInfo.upvotes+1
            }
        });
        console.log("upvote updated");
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
        },res);
       
})

app.post('/api/articles/:name/add-comment', (req,res) => {
   const {username, text} =  req.body;

   const articleName = req.params.name;
    withDb(async (db) => {
            const articleInfo = await db.collection('articles').findOne({name: articleName});
            await db.collection('articles').updateOne({name: articleName}, {
                '$set' : {
                    comments: articleInfo.comments.concat({username, text}),

                }
            });

            const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
            res.status(200).json(updatedArticleInfo);
    },res)
});

app.get('*',(req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
})
app.listen(8000, () => console.log("Listening on port 8000!"));