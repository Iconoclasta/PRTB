# PIVXTipBot

This is the official repository for /u/pivxtipbot. More info about its use and integration will soon be added.

[![Build Status](https://travis-ci.com/CameraLucida/PIVXRedditTipBot.svg?branch=master)](https://travis-ci.com/CameraLucida/PIVXRedditTipBot)


# Run it yourself

1. Install:

sudo apt-get update && sudo apt-get upgrade

    a) sudo apt-get install npm
    b) sudo apt-get install node.js
    c) sudo apt-get install nodejs
    d) sudo apt-get install mongodb
    )
2. Download and install the PIVX client [![official walkthrough(https://pivx.freshdesk.com/support/solutions/articles/30000024630-how-to-use-the-command-line-to-install-or-upgrade-pivx-and-start-staking-on-linux)]:

Git clone this repository, then run `npm install`. Make sure you have:

- A PIVX daemon (latest version) running on port 33333
- A MongoDB service running on default port

Then, run `npm start`.
