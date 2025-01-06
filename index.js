require('dotenv').config();
const express = require('express');
const cors = require('cors');
const shortid = require('shortid')
const mongoose = require('mongoose')
const dns = require('dns')
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//mongoDB connection
mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

//Schema formation
const urlschema = new mongoose.Schema({
  fullUrl: {
      type: String,
      required: true,
  },
  shortUrl: {
      type: String,
      required: true,
      default: shortid.generate,
  }
});
const Url = mongoose.model('Url', urlschema);
//-----------------------end-----------------------------------------------------------

//-------------------Your first API endpoint-------------------------------------------

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//-----------------------end-----------------------------------------------------------


//---------------Feat: URL shortener end point reference ------------------------------


app.post('/api/shorturl', async (req,res) => {
  
  const fullUrl = req.body.url

  if (!/^https?:\/\//i.test(fullUrl)) {
    return res.json({ error: 'invalid url' });
  }
  else {
    const host = new URL(fullUrl)
   await dns.lookup(host.hostname, (err) => {
    if (err){
      return res.json({error: 'invalid url'})
    }
    })
  };

  let url = await Url.findOne({ fullUrl: fullUrl });
  if (url) {
        return res.json({ original_url: url.fullUrl, short_url: url.shortUrl });
    }
  else{
        url = new Url({ fullUrl: fullUrl , shortUrl: shortid.generate() });
        await url.save();
        res.json({ original_url: url.fullUrl, short_url: url.shortUrl });
    } 

});

//-------------------get-URL-redirect--------------------------------------
app.get('/api/shorturl/:shortUrl', async (req, res) => {
  
  const shortUrl = req.params.shortUrl;
  const url = await Url.findOne({ shortUrl: shortUrl });
      if (!url) {
        return res.send('URL not found')
      };
  res.redirect(url.fullUrl);

});
//-------------------------------------------------------------

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
