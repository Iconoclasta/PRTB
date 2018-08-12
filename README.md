Note from wallet developers:

Remember that this is still a beta, and many major changes were made in the recent days. If you notice the bot not responding, this seems to be on the fault of Reddit API or the library used by the bot. I'm investigating into this. Private messages to the bot work fine, so you can deposit/withdraw/check balance and history all you want.

If you have any bugs or want to suggest changes, send me a private message!


# PIVX Reddit TipBot

[![Build Status](https://travis-ci.com/CameraLucida/PIVXRedditTipBot.svg?branch=master)](https://travis-ci.com/CameraLucida/PIVXRedditTipBot)  [![Dependencies](https://david-dm.org/CameraLucida/PIVXRedditTipBot.svg)](https://david-dm.org/CameraLucida/PIVXRedditTipBot)

# How to use it

The PIVX Reddit Tip Bot allows Reddit.com users to perform basic PIVX transactions between fellow redditors.

The bot interfaces with you via /u/pivxtipbot which will respond to the following commands via DM:

`!deposit` - this command generates a **one time** deposit address for your account. This address will therefore only be associated with your account for **one** transaction. You must generate a new deposit address every time you wish to reload your account. Every time you generate a new deposit address all previous addresses are invalidated, 

`!withdraw [the amount of piv] [your PIVX address]` - this command withdraws your PIVX to any PIVX address. The minimum amount of PIVX to withdraw is 0.1 PIV.

`!balance` - this command displays your account's balance in PIVX.

`!history` - this command lists all the tips you've ever either received or sent.

`!transactions` - this command displays the list of all the deposits and withdrawals of your Reddit TipBot account. 

The bot operates on a 3 decimal place limit.

To transfer funds or "tip" an user within Reddit you must reply `!pivxtip [the amount of piv]` to a thread or comment of the desired recipient within a supported Sub-Reddit (see list below). The minimum tip amount is 0.001 PIVX. If you execute a tip with more than 3 decimal places the amount will be rounded down to the closest third decimal. For example if you tip someone 10.593856 the bot will transfer 10.593 from your account to the receiver.

Maintaining the bot and its codebase online and free of bugs costs time and money. The bot is designed to mimimize transaction fees but the PIVX network will also sometimes want its share. In order to keep the PIVX Reddit Tipbot service operational, it will regularly scrape all users' balances such to round them down to the nearest 0.001. For example if you receive a transaction of 10.85283 PIVX, your available balance will be of 10.852 PIVX with 0.00083 gone to cover eventual outbound transaction fees and fund further development. This is the ONLY fee the bot will ever charge.

 ---



#### A-Z LIST OF SUPPORTED SUBREDDITS (please get in touch to add or remove a subreddit from this list):
```
/r/Anarcho_Capitalism
/r/Bitcoin
/r/BitcoinMarkets
/r/Conservative
/r/CryptoMarkets
/r/DarkNetMarkets
/r/Economics
/r/Entrepreneur
/r/InternetIsBeautiful
/r/JoeRogan
/r/Libertarian
/r/MachineLearning
/r/Monero
/r/NeutralPolitics
/r/Piracy
/r/ProgrammerHumor
/r/Ripple
/r/SandersForPresident
/r/TheRedpill
/r/The_Donald
/r/beermoney
/r/btc
/r/buttcoin
/r/dashpay
/r/dataisbeautiful
/r/digitalnomad
/r/dogecoin
/r/economy
/r/engineering
/r/ethereum
/r/ethtrader
/r/finance
/r/financialindependence
/r/firstworldanarchists
/r/geek
/r/hacking
/r/investing
/r/learnprogramming
/r/litecoin
/r/personalfinance
/r/pivx
/r/podcasts
/r/politics
/r/privacy
/r/programming
/r/smashbros
/r/solotravel
/r/startups
/r/tech
/r/technology
/r/wallstreetbets
/r/wikileaks
```


# Run it yourself

1. Install the required dependencies ([tutorial](https://nodesource.com/blog/installing-node-js-tutorial-ubuntu/)):

sudo apt-get update && sudo apt-get upgrade

    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
Check the nodejs version:
    
    node -v
    
Install NPM globally

    sudo npm install npm --global

Prepare your machine for the bot

    sudo apt-get install mongodb
    sudo apt-get install make build-essential
    
2. Download and install the PIVX client ([official walkthrough](https://pivx.freshdesk.com/support/solutions/articles/30000024630-how-to-use-the-command-line-to-install-or-upgrade-pivx-and-start-staking-on-linux)):

Please check the latest PIVX client release at https://github.com/pivx-project/pivx/releases

    wget https://github.com/PIVX-Project/PIVX/releases/download/v3.1.1/pivx-3.1.1-x86_64-linux-gnu.tar.gz
    tar -xvzf pivx-3.1.1-x86_64-linux-gnu.tar.gz
    
We must now edit the pivx.config file to add the rpc settings to use on the config.json file of the bot

    mkdir ~/.pivx
    nano ~/.pivx/pivx.conf

Add the following lines to the file.  For the X's, press 16+ random keys on the keyboard.  You wil need to report these values to the config.json file of the bot:
    
    rpcuser=XXXXXXXXXXXXXXXX
    rpcpassword=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    rpcport=33333 //you can chose your preferred port
    enablezeromint=0 //the bot can't do zpiv yet!

Start the daemon

    ~/pivx-3.1.1/bin/pivxd -daemon
    
Encrypt wallet.dat

    ~/pivx-3.1.1/bin/pivx-cli encryptwallet mysupercomplexpasswordhere
    
Start the daemon again and unlock it with staking and anonymization off. The syntax is `walletpassphrase <passphrase> <unlock time> <for staking/anonymization only true/false>`

    ~/pivx-3.1.1/bin/pivx-cli walletpassphrase <passphrase>  0 false
    
 
Let the wallet sync


3. Set the PIVX Reddit Tip Bot up:

Git clone this repository and extract its content

    wget https://github.com/CameraLucida/PIVXRedditTipBot/archive/master.zip
    unzip PIVXRedditTipBot-master.zip

You must now customize your config.json file with your custom variables

    nano ~/master/src/data/config-example.json //save as config.json
    
Once the codebase is up to date to your preferences you must install npm

    cd ~/PIVXRedditTipBot-master
    npm install
    sudo npm install npm -g
    sudo npm i pm2 -g
    
You may now run your instance for the first time. You will need to maintain the ssh connection to the machine running the bot to keep it running. Use this command to test the bot and visualize all activities of the bot.

    cd ~/PIVXRedditTipBot-master
    node index

Once you're satisfied with the tests we may start the bot "for production" such that once the program is set on an independent VPS machine it may run without any ssh user connection.

    cd ~/PIVXRedditTipBot-master
    pm2 start index.js --name PRTB
    
To stop the bot type

    pm2 stop PRTB

---
---
---
---

A special thanks to [DaJuukes](http://dajuukes.codes/) for his continued support and great contribution toward crafting the official PIVX Reddit Tip Bot




### Coffe Me

PIVX: D6YcukkCyL66objpjZmnrNrwheTv4YdC8f


## Join us
Website: www.pivx.org 


Discord: https://discordapp.com/invite/jzqVsJd 

Twitter: https://twitter.com/_pivx 

Reddit: https://www.reddit.com/r/pivx/ 

Facebook: https://www.facebook.com/PIVXCrypto/ 

Linkedin: https://www.linkedin.com/company/pivx 

Instagram: https://www.instagram.com/pivxcrypto/ 

Steemit: https://steemit.com/@pivx/
