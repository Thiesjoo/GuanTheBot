# twitchTestBot

Please provide `TMI_KEY` as an ENV variable, with a working tmi oauth key and `TMI_USER` with a valid username.

## Installation

No installation is required, just make sure you run in the vscode devcontainer. Then run `npm run start` to start the bot

## Deployment

To start the bot:

- You have to provide the env file in the root of your directory for it to work.
- You have to either have a preexiting dump of the database (in a folder called dump/) or you should be running in the devcontainer with an already filled mongodb

### Devcontainer

When in the devcontainer, just run `npm run start:docker`. This will first dump the database, then build a docker image with that dump incorporated. The it will start the docker-compose file.

### Local

When outside the devcontainer, make sure you have a dump of the database you want to restore.
Then run `docker build . -t thiesjoo/twitchtestingbot` to create the docker image.
Finally run `docker-compose -p twitchtestingbot up` to get the containers up and running.
