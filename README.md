# twitchTestBot

Deployed on Qovery

## TODO

- Add events on trigger
- Add currency (transfer to different users)
- Add betting on where **anon** will be in a week
- Add seperate docker-compose.yml for people who do not run with qovery (Wait for qovery to support dockercompose)


## ENV

For the entire setup provide:
`${LOCAL_WORKSPACE_FOLDER}` with the folder you are working in. Only required if you're not running in the devcontainer.

For the twitchbot:

```
TMI_KEY=tmioauth
TMI_USER=the bot user
ADMIN_USER=user with admin privilges of the app
MONGO_URL=url to your mongodb database (mongodb://db:27017 for local dev)
MONGO_DB=the db to store information
WRA_KEY=the api key from wolframalpha
```

## Installation

Bot:
```bash
cd src/twitchbot
npm i
npm run start
```

## Deployment

To start the bot on a local server:

- Have mongodb installed
- Clone the repo
- Provide the env file in the root of your directory
- Run `qovery auth` to authenticate
- Run `qovery application env list -c --dotenv >> .env` to export all the env variables
- Run `qovery run`
