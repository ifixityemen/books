import { app } from 'electron';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

function getUrlAndTokenString() {
  const inProduction = app.isPackaged;
  const errLogCredsPath = path.join(__dirname, '../err_log_creds.txt');

  let apiKey, apiSecret, url;
  try {
    [apiKey, apiSecret, url] = fs
      .readFileSync(errLogCredsPath, 'utf-8')
      .split('\n')
      .filter((f) => f.length);
  } catch (err) {
    if (!inProduction) {
      console.log('error logging failed');
      console.log(err);
    }
    return;
  }

  !inProduction && console.log(apiKey, apiSecret, url);
  return { url: encodeURI(url), tokenString: `token ${apiKey}:${apiSecret}` };
}

function post(bodyJson) {
  const inProduction = app.isPackaged;
  const { url, tokenString } = getUrlAndTokenString();
  const isHttps = url.split(':')[0].toLowerCase() === 'https';
  const headers = {
    Authorization: tokenString,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const req = (isHttps ? https : http).request(
    url,
    {
      method: 'POST',
      headers,
    },
    (res) => {
      if (inProduction) {
        return;
      }

      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
      });
    }
  );

  req.write(bodyJson);
  req.end();
}

export function sendError(bodyJson) {
  post(bodyJson);
}

// Nothing nefarious going on here.
// Just regular old user mandated error logging.