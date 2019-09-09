const https = require('https');
const fs = require('fs');

const SLACK_ID = 'YOUR WEBHOOK PATH/ID/KEY GOES HERE';

const METADATA_JSON_OUTPUT = '/home/pi/metadata_finder/metadata.json';

const metaDataString = fs.readFileSync(METADATA_JSON_OUTPUT, 'utf8');
const metaData = JSON.parse(metaDataString);
console.log('metaData', metaData);

const data = JSON.stringify({
  channel: '#mal-radio-local',
  username: 'radio.local',
  icon_emoji: ':vinyl:',
  attachments: [
    {
      fallback: `${'Test'}`,
      pretext: `${':blank::tophat::blank:\n:heart_ear_flipped::eyes::heart_ear:\n:blank::nose::blank:\n:blank::lips::blank:'}`,
      title: 'Tap here to listen',
      title_link: 'http://radio.local',
      color: '#34e8eb',
      ...(metaData.imageUrl && { thumb_url: metaData.imageUrl }),
      fields: [
        {
          title: 'Artist',
          value: metaData.artist || ':3d_thinking:',
          short: true,
        },
        {
          title: 'Album',
          value: metaData.album || ':3d_thinking:',
          short: true,
        },
        {
          title: 'Song',
          value: metaData.track || ':3d_thinking:',
          short: true,
        },
      ],
    },
  ],
});

console.log('data', data);

const options = {
  hostname: 'hooks.slack.com',
  path: `/services/${SLACK_ID}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
