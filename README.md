# DebilBot

Self-hosted YouTube music bot for Discord.

## Features

- Basic queue support

### YouTube

- Play from URL (ex: `!play https://youtube.com/watch?v=XXXXXX`)
- Play from keyword search (ex: `!play i want it that way backstreet boys`)

## Installation

First off you will need a Discord Application with a Bot. Follow the steps in [Discord Application Configuration](#discord-application-configuration) section if you dont have one.

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
