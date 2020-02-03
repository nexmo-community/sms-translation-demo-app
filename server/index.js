'use strict';
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
let translateTo = 'en';

wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    translateTo = message;
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

app.post('/inboundSMS', async function (req, res) {
  let translation = await translateText(req.body);
  let response = {
    from: obfuscateNumber(req.body.msisdn),
    translation: translation.translatedText,
    originalLanguage: translation.detectedSourceLanguage,
    originalMessage: req.body.text,
    translatedTo: translateTo
  }
  wss.clients.forEach(client => { client.send(JSON.stringify(response))});
  res.send('200');
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 10000);

function translateText(params) {
  const translate = new Translate();
  const target = translateTo || 'en';

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