#!/bin/sh

DIRR="/home/pi/metadata_finder/"
FILE_PATH="/home/pi/metadata_finder/to_analyze.mp3"
OUTPUT_PATH="/home/pi/hosting/metadata_output.txt"

rm "$FILE_PATH"

curl --output "$FILE_PATH" http://10.2.1.168:8000/raspi --max-time 10

rm -rf "${DIRR}temp.spx"
ffmpeg -i "$FILE_PATH" -loglevel quiet "${DIRR}temp.spx" 2> /dev/null
echo "File conversion complete."

# Clear file
echo "" > "$OUTPUT_PATH"

URL='http://search.midomi.com/v2/?method=search&type=identify'

# We must pass an AppNumber in User-Agent. What it is doesn't matter, and other fields are
# irrelevant too.
USER_AGENT='User-Agent: AppNumber=31'

curl -X POST -H 'Transfer-Encoding: chunked' -H "$USER_AGENT" -T "${DIRR}temp.spx" -o "$OUTPUT_PATH" "$URL"

echo "Upload started."

# Parse meta data into json object
node /home/pi/metadata_finder/metadata_parser/metadata_parser.js

# Look if something just started playing and then post in slack channel
node /home/pi/metadata_finder/look_for_now_playing.js