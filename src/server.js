import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDb = async (operations, res) => {
    try{
        console.log("INITIATING DB COMM");
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser : true});
        const db = client.db('my-travel-blog');
    
        await operations(db);
        
        client.close();
    }catch(error){
        res.status(500).json({message: 'Error Connecting to db', error})
    }
}

app.get('/api/articles/:name', async (req, res) =>{
        //temp removed
        withDb(async (db)=>{
            const articleName = req.params.name;
            console.log("Article name: "+articleName);
    
            const articleInfo = await db.collection('articles').findOne({name : articleName});
            console.log("200");
            res.status(200).json(articleInfo);
            console.log("success");
        },res);  

      // Temp
    //   res.status(200).json({
    //     "_id" : "5f98f7a8883a100e614f82fc",
    //     "name" : "my-thoughts-on-resumes",
    //     "upvotes" : 5,
    //     "comments" : [{username: "MadB055", text:"This is the BEst zBlog Ever!"},{username: "MadB055", text:"This is the BEst zBlog Ever!"}]
    // })  
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