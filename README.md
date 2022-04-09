# DebilBot

Self-hosted YouTube music bot for Discord.

## Features

- Basic queue support

### YouTube

- Play from YouTube URL
- Play from keyword search (ex: )

### Supported commands

- `!play` From URL. Example:`!play https://youtube.com/watch?v=XXXXXX`
- `!play` From keyword search. Example: `!play i want it that way backstreet boys`
- `!np` Now playing.
- `!skip`
- `!stop`
- `!join`
- `!leave`
- `!queue`

## Installation

First off you will need a Discord Application with a Bot. Follow the steps in [Discord Application Configuration](#discord-application-configuration) section if you dont have one.

### Requirements

- node v16.xx (tested on v16.14.1)
- npm (tested on v8.3.1)

### Install and build

Download the source code from github:

`git clone https://xxxxx`

Navigate to the project root directory.

Run `npm install` to install dependencies.

Run `npm run build` to build the project.

### Launching the bot

At this stage the bot needs to know what bot instance to run as. You will need to provide a Bot Token through the environment variable `DEBIL_BOT_TOKEN`.

Easiest way to launch the bot is through npm and to provide the token directly through your terminal:

`DEBIL_BOT_TOKEN=<Your token here> npm start `

You should see the following log output in your console:

```
{"level":"info","message":"Logging in.."}
{"level":"info","message":"Connected"}
```

Verify that the bot is online in your server. If so, congratulations!

## List of available configuration variables

`DEBIL_BOT_TOKEN` The Bot Token of the bot instance to run as.

`DEBIL_MAX_IDLE_TIME` The maximum amount of time in SECONDS the bot will stay idle in a channel. After this time has passed the bot will leave. Defaults to 300.

`DEBIL_SENTRY_DSN` The DSN of the Sentry project to send captured exceptions to. (Optional.)

`DEBIL_SENTRY_ENVIRONMENT` What Sentry environment to run as. Defaults to "dev".

`DEBIL_SENTRY_TRACE_SAMPLE_RATE` The Sentry trace sample rate to use, a number between 0 and 1. Check the Sentry docs for further explanation. Defaults to 1.

## Discord Application Configuration

Visit https://discord.com/developers/applications to set one up. Remember to keep the generated Bot Token as you will need it later.

### Generate invite URL

After you have created your application you will need to invite the Bot to a server. You can do this at your Discord Application screen:

- Click `OAuth2` in the menu
- Click `URL Generator`
- Check the `bot` scope checkbox.
- Check all the necessary permission checkboxes listed below. The final permissions integer should be `3197952`.

### Required Bot Permissions

Permissions Integer: `3197952`

#### General

- Read Messages/View Channels

#### Text

- Send Messages
- Embed Links
- Attach Files

#### Voice

- Connect
- Speak

### Invite bot to your server

- Copy the generated URL
- Paste the URL into your browser
- Select your server
- Click continue
- Click authorize
- All done!

## Changelog

- [Changelog](/CHANGELOG.md)

## Known issues

- Searches and retrieving video info is slow (~2 seconds). See https://github.com/miniwa/debil-bot/issues/13.
