#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');
const https = require('https');

const SLACK_ID = 'YOUR WEBHOOK PATH/ID/KEY GOES HERE';

const SILENCE_TRESHOLD = 0.05;
const SILENCE_FILE_PATH = '/home/pi/metadata_finder/nothing_is_playing.txt';
const LOG_FILE_PATH = '/home/pi/metadata_finder/look_for_now_playing_log.txt';
const METADATA_JSON_PATH = '/home/pi/metadata_finder/metadata.json';

async function sh(cmd) {
  return new Promise(function(resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function log(text) {
  fs.appendFileSync(LOG_FILE_PATH, `${new Date().toString()}: ${text}\n`);
}

function isSilent(amplitude) {
  return amplitude < SILENCE_TRESHOLD;
}

function createSilenceFile() {
  return new Promise((resolve, reject) => {
    fs.writeFile(SILENCE_FILE_PATH, 'Nothing is playing', error => {
      if (error) {
        log('Error creating silence file', error);
        reject();
      }

      log('Succesfully created silence file');
      return resolve();
    });
  });
}

function deleteSilenceFile() {
  return new Promise((resolve, reject) => {
    fs.unlink(SILENCE_FILE_PATH, error => {
      if (error) {
        log('Error deleting silence file', error);
        reject();
      }

      log('Succesfully deleted silence file');
      resolve();
    });
  });
}

function randomText() {
  const messages = [
    'Finally! I love this song... :sunglasses:',
    'Oh, it looks like something is playing',
    "I don't think I've heard this one :thinking_face:",
    ':musical_note: to my :ear::ear:',
    ':heart_ear_flipped::eyes: :heart_ear:',
    "Where's George Michael when I need him :face_with_monocle:",
    'Without music, life would be a mistake',
    'Music is a language that doesn’t speak in particular words. It speaks in emotions, and if it’s in the bones, it’s in the bones',
    ':blank::tophat::blank:\n:heart_ear_flipped::eyes::heart_ear:\n:blank::nose::blank:\n:blank::lips::blank:',
    ':heart_ear_flipped::sunglasses::heart_ear:',
    ':heart_ear_flipped::grimacing_messenger::heart_ear:',
    'One good thing about music, when it hits you, you feel no pain',
    'We are the music makers, and we are the dreamers of dreams',
    'Music is to the soul what words are to the mind',
    'I like beautiful melodies telling me terrible things',
    'Music is the strongest form of magic',
    'Music is the great uniter. An incredible force. Something that people who differ on everything and anything else can have in common',
    'Music is my higher power',
    'Life is like a beautiful melody, only the lyrics are messed up',
    'Music can change the world because it can change people',
    "I'm just a musical prostitute, my dear",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

function postMessage(message) {
  return new Promise((resolve, reject) => {
    const metaDataString = fs.readFileSync(METADATA_JSON_PATH, 'utf8');
    const metaData = JSON.parse(metaDataString);

    const data = JSON.stringify({
      channel: '#mal-radio-local',
      username: 'radio.local',
      icon_emoji: ':vinyl:',
      attachments: [
        {
          fallback: message,
          pretext: message,
          title: 'Tap here to listen',
          title_link: 'http://radio.local',
          color: 'good',
          ...(metaData.imageUrl && metaData.imageUrl.length > 0 && { thumb_url: metaData.imageUrl }),
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
      log(`Request status code: ${res.statusCode}`);

      res.on('data', d => {
        log('Successfully posted message in slack channel!');
        resolve();
      });
    });

    req.on('error', error => {
      log(`Error posting message: ${JSON.stringify(error)}`);
      reject();
    });

    req.write(data);
    req.end();
  });
}

async function analyze() {
  try {
    const result = await sh('sox /home/pi/metadata_finder/to_analyze.mp3 -n stat 2>&1 | grep "Maximum amplitude"');
    const { stdout } = result;
    const values = stdout.split(':');
    const value = values[1];
    const amplitude = parseFloat(value);

    log(`Current amplitude: ${amplitude}`);

    // Reading the amplitude sometimes gives a value of 1 when nothing is playing.
    // When something is playing amplitude is usually around 0.5,
    // so make sure we don't trigger falsely
    if (amplitude < 1) {
      if (isSilent(amplitude)) {
        if (!fs.existsSync(SILENCE_FILE_PATH)) {
          await createSilenceFile();
        } else {
          log('Still silent. Wait for something to start playing...');
        }
      } else {
        if (fs.existsSync(SILENCE_FILE_PATH)) {
          log('Something started playing, will try to post message');
          // Silence file exists, post something in the channel
          await postMessage(randomText());
          await deleteSilenceFile();
        } else {
          log('Looks like something is continously playing');
        }
      }
    }
  } catch (error) {
    log(`Failed anayzing mp3: ${JSON.stringify(error)}`);
    // Not 100% sure but it seems like if the to_analyze.mp3 file is recorded completely silent
    // analysing it gives an error.
    if (!fs.existsSync(SILENCE_FILE_PATH)) {
      createSilenceFile();
    }
  }
}

analyze().then(() => process.exit(1));
