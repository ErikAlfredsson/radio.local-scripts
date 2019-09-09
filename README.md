# radio.local-scripts

![Alt Text](https://github.com/ErikAlfredsson/radio.local-scripts/blob/master/radio_local_example_image.png)

radio.local is a "vinyl wifi radio" built with darkice and Icecast.

We built a web UI on top of this which can be found here: https://github.com/worldeggplant/radio.local

This repository contains the scripts used on the same machine to:

- Fetch song meta data
- Determine if something is playing or not
- Post a message to Slack when something starts playing

## Dependencies/technologies

- nodejs
- crontab
- sox
