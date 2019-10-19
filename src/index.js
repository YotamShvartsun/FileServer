/** TODO:
 * let user input number of views
 * tests
 * for pictures: display as an html inline
 * style (?)
 * babel config + npm start script
*/

import express from 'express'
import multer from 'multer';
import {exists, unlink} from 'fs';
import {join, resolve} from 'path';
import { randomBytes } from 'crypto';


let storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, join(__dirname, 'uploads'));
    },
    filename: (req, file, cb)=>{
        console.log(file.originalname);
        let originalTypeEnd = file.originalname.split('.').pop();
        cb(null, `${randomBytes(16).toString('base64')}.${originalTypeEnd}`);
    }
});

const filenameRegEx = /[^\\/]+\.[^\\/]+$/;
const __dirname = resolve();
const app = express();
app.use(express.static('static'));
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');
let upload = multer({storage: storage});

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/getfile', (req, res)=>{
    let fileName = req.query.filename;
    console.log(fileName);
    
    if(!fileName.match(filenameRegEx)){
        // error: invalid file name!
        res.render('error', {err: 'invalid name'});
        return;
    }
    let maybePath = join(__dirname, '/uploads', fileName);
    console.log(`path given: ${maybePath}`)
    exists(maybePath, (exists)=>{
        if(!exists){
            res.render('error', {err: 'not found'});
            return;
        }
        res.sendFile(maybePath).then((re, rj)=>{
            unlink(maybePath);
        });        
    });
});

app.post('/fileupload', upload.single('file'), (req, res)=>{
    console.log(req.file);
    res.render('upload', {url: `/getfile/${req.file.filename}`});
});

app.listen(8080, ()=>{
    console.log('on 8080!');
})