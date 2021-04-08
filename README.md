# twitchTestBot

Deployed on HEROKU and Qovery


## ENV

For the entire setup provide:
`${LOCAL_WORKSPACE_FOLDER}` with the folder you are working in. Only required if you're not running in the devcontainer.

For the app:

```
TMI_KEY=tmioauth
TMI_USER=the bot user
ADMIN_USER=user with admin privilges of the app
MONGO_URL=url to your mongodb database (mongodb://db:27017 for local dev)
MONGO_DB=the db to store information
WRA_KEY=the api key from wolframalpha
```

## Installation

No installation is required, just make sure you run in the vscode devcontainer. Then run `npm run start` to start the bot

## Deployment

To start the bot on a local server:

- Clone the repo
- You have to provide the env file in the root of your directory for it to work.
- You have to either have a preexisting dump of the database (in a folder called dump/) or you should be running in the devcontainer with an already filled mongodb

### Devcontainer

When in the devcontainer, just run `npm run start:docker`. This will first dump the database, then build a docker image with that dump incorporated. The it will start the local docker-compose file, which incorporated all of these aspects.

### Local

When outside the devcontainer, make sure you have a dump of the database you want to restore.
Then run `docker build . -t thiesjoo/twitchtestingbot` to create the docker image.
Finally run `docker-compose -p twitchtestingbot up` to get the containers up and running.
