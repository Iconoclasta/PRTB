const handleTip = require('./handleTip.js');

const handleErr = require('./error_handler.js');

const {settings} = require('../data/config.json');

module.exports = async (post, client) => {

    const {parent_id, body, subreddit} = post;
    const args = body.match(/\S+/g);

    if (!settings.subreddits.includes(subreddit.display_name.toLowerCase())) return;

    if (args[0] !== '!pivxtip') return;

    if (args.length < 2) return;

    const amount = args[1];
    if (isNaN(parseFloat(amount))) return;

    const c = await client.getComment(parent_id);

    const authorName = await c.author.name;

    if (c) {
        //do stuff with comment
        handleTip(post, c, amount).then(async () => {
            await post.reply(`/u/${await post.author.name} has sucessfully tipped /u/${authorName} ${amount} PIVX!`);
        }).catch(async (err) => {
            //insufficient funds
            if (err == 1) await post.reply(`Insufficient funds to tip ${authorName} ${amount} PIVX!`);
            else if (err == 2) await post.reply(`You may not tip yourself!`);
            else if (err == 3) await post.reply(`Too small amount to tip!`);
            else if (err == 4) await post.reply(`You didn't have an account, so one was created for you!`);
            else await post.reply(err);
            console.log(err);
        });
    }
    else {
        //error
        handleErr("Unable to find comment from ID");
    }
};
