#!/usr/bin/env node

const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

const METADATA_PATH = '/home/pi/hosting/metadata_output.txt';
const METADATA_JSON_OUTPUT = '/home/pi/metadata_finder/metadata.json';

const metaData = fs.readFileSync(METADATA_PATH, 'utf8');

function writeJsonDataToFile(data) {
  fs.writeFileSync(METADATA_JSON_OUTPUT, JSON.stringify(data, null, 2));
}

parser.parseString(metaData, function(err, result) {
  if (err) {
    console.error('xml2js.parseString: Error occurred: ', err);
    writeJsonDataToFile({});
  } else {
    if (result) {
      const {
        melodis: { tracks_grouped },
      } = result;

      const track = tracks_grouped[0];
      if (track.track_name_group) {
        const trackNameGroup = track.track_name_group[0];
        const trackName = trackNameGroup.$;
        const artistNameGroup = trackNameGroup.artist_name_group[0].tracks[0].track[0];
        const {
          $: { artist_name, track_name, album_primary_image, album_name },
        } = artistNameGroup;
        const nowPlayingData = {
          artist: artist_name,
          album: album_name,
          track: track_name,
          imageUrl: album_primary_image,
        };

        writeJsonDataToFile(nowPlayingData);

        return;
      }
    }

    writeJsonDataToFile({});
  }
});
