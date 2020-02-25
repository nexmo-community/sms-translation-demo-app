require('dotenv').config();

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/socket" });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// this is used with the heroku one-click install.
// if you are running locally, use GOOGLE_APPLICATION_CREDENTIALS to point to the file location
let config = null;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS === undefined) {
  config = {
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.translateTo = 'en';

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    ws.translateTo = message;
  });

});

function obfuscateNumber(str) {
  return str.replace(str.substring(0, str.length - 4), '*'.repeat(str.length - 4))
};

app.use(express.static(path.join(__dirname, '../build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const handleRoute = (req, res) => {

  let params = req.body;

  if (req.method === "GET") {
    params = req.query
  }

  if (!params.to || !params.msisdn) {
    res.status(400).send({ 'error': 'This is not a valid inbound SMS message!' });
  } else {
    wss.clients.forEach(async (client) => {
      let translation = await translateText(params, client.translateTo);
      let response = {
        from: obfuscateNumber(req.body.msisdn),
        translation: translation.translatedText,
        originalLanguage: translation.detectedSourceLanguage,
        originalMessage: params.text,
        translatedTo: client.translateTo
      }

      client.send(JSON.stringify(response));
    });
    
    res.status(200).end();
  }

};

app.route('/inboundSMS')
  .get(handleRoute)
  .post(handleRoute)
  .all((req, res) => res.status(405).send());

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 10000);

const translate = new Translate();

function translateText(params, translateTo = 'en') {
  const target = translateTo;

  return translate.translate(params.text, target)
    .then(data => {
      return data[1].data.translations[0]
    })
    .catch(err => {
      console.log('error', err);
    });
}

server.listen(process.env.PORT || 8000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});