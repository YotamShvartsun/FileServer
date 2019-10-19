import express from 'express'
import multer from 'multer';
import {exists, unlink} from 'fs';
import {join, resolve} from 'path';
import { randomBytes } from 'crypto';
import bodyParser from 'body-parser';

let sqlite = require('sqlite3');

let storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, join(__dirname, 'uploads'));
    },
    filename: (req, file, cb)=>{
        console.log(file.originalname);
        let originalTypeEnd = file.originalname.split('.').pop();
        cb(null, `${randomBytes(16).toString('hex')}.${originalTypeEnd}`);
    }
});

const filenameRegEx = /[^\\/]+\.[^\\/]+$/;
const __dirname = resolve();
let db = new sqlite.Database(join(__dirname, 'db.sqlite'));
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('static'));
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');
let upload = multer({storage: storage});

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/getfile', (req, res)=>{
    let fileName = req.query.file;
    
    if(!fileName.match(filenameRegEx)){
        // error: invalid file name!
        res.render('error', {err: 'invalid name'});
        return;
    }
    let maybePath = join(__dirname, '/uploads', fileName);
    exists(maybePath, (exists)=>{
        if(!exists){
            res.render('error', {err: 'not found'});
            return;
        }
        res.sendFile(maybePath, (err)=>{
            if(err) {
                next(err);
            }else{
                db.all('select * from files where filename=?',
                fileName,
                (err, rows)=>{
                    let fileRow = rows[0];
                    if(fileRow.maxViews == 1){
                        unlink(maybePath, ()=>{
                            db.run('delete from files where filename=?', fileName);
                        });
                    }
                    else{
                        db.run('update files set maxViews=? where filename=?', fileRow.maxViews - 1, fileName);
                    }
                });
            }
        });
});
});

app.post('/fileupload', upload.single('file'), (req, res)=>{
    let maxViews = 1;
    if(req.body.maxViews){
        maxViews = req.body.maxViews;
    }
    db.run('insert into files(filename, maxViews) values(?,?)', req.file.filename, maxViews);
    res.render('upload', {url: `/getfile?file=${req.file.filename}`});
});

let server = app.listen(8080, ()=>{
    db.run("create table if not exists files(filename text primery key, maxViews integer);")
    console.log('on 8080!');
});

let shutdown = () =>{
    console.log()
    console.group('Shutdown:');
    console.info('[INFO] begun shutdown');
    server.close(()=>{
        console.info('[INFO] http server closed');
        db.close();
        console.info('[INFO] db connection closed');
        console.info('[INFO] procces terminated');
        console.groupEnd();
        process.exit(0);
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);