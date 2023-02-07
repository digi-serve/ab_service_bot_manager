//
// slackBotBolt
// implement our slackBot to post, listen and respond to commands on a #slack
// channel.
// We are using the new @slack/bolt api provided by #Slack
//

const path = require("path");
const { App } = require("@line/bot-sdk").Client;
const update = require(path.join(__dirname, "command_update.js"));

// commands
// a hash of commands we can process:
// update : issue a command to update the Docker Containers
const Commands = {
   update,
};

var bot;
var channelID = null;
var hashUsers = {
   /* id:name */
};
var config = null;
var Client = null;

module.exports = {
   /**
    * slackBot.init()
    * establish a connection to a #slack App.
    * @param {obj} conf
    *        provided config options
    *        (config/[bot_manager.js + local.js])
    * @param {Socket} hostClient
    *        a connection to the Host command process
    */
   init: (conf, hostClient) => {
      console.log("bot_manager: slackBot: init ...");

      config = conf;
      Client = hostClient;

      // verify we have our needed configuration parameters.
      var checkParams = ["botToken", "botName", "channel"];
      var hadError = false;
      checkParams.forEach((p) => {
         if (config.slackBot[p].indexOf("..") > -1) {
            console.log("ERROR: missing configuration value: " + p);
            hadError = true;
         }
      });
      if (hadError) {
         return;
      }

      const app = new App({
         token: "xoxb-918363240465-2288178868452-hA90uU3RSNVwSrDDxZS8NUmS",
         signingSecret: "34978139f7eea8d7a91498f0ada9cdba",
         socketMode: true,
         appToken:
            "xapp-1-A027QJ5JKN3-2294291076244-c102cc00a7729e4a2ad13609f41b1b0835ae4b501889c65319b5280d7638035c",
         logLevel: "debug",
      });

      // Listens to incoming messages that contain "hello"
      app.message("hey", async ({ message, say }) => {
         // say() sends a message to the channel where the event was triggered
         await say(`Hey there <@${message.user}>!`);
      });

      (async () => {
         // Start your app
         await app.start(3000);

         console.log("⚡️ Bolt app is running!");
      })();

      /*

      // create a bot
      bot = new App({
         token: config.slackBot.botToken, // Add a bot https://my.slack.com/services/new/bot and put the token
         // name: config.slackBot.botName,
         signingSecret: config.slackBot.signingSecret,
         socketMode: true,
         appToken:
            "xapp-1-A027QJ5JKN3-2294291076244-c102cc00a7729e4a2ad13609f41b1b0835ae4b501889c65319b5280d7638035c",
         logLevel: "debug",
      });

      // bot.event("message", async ({ ack, command, say, message }) => {
      //    console.log("EVENT:MESSAGE:");
      //    try {
      //       await ack();
      //       console.log(command);
      //       console.log(message);
      //       say("Got it");
      //    } catch (e) {
      //       console.log("Error");
      //       console.error(e);
      //    }
      // });

      bot.message("hey", async ({ ack, command, say }) => {
         console.log("bot.message received:");
         console.log(command);

         try {
            await ack();
            say("got it!");
         } catch (err) {
            console.log("Error:");
            console.error(err);
         }
      });

      (async () => {
         await bot.start(config.slackBot.port);
         console.log("Slack Bolt App is running!");
      })();





*/

      // bot.start(config.slackBot.port)
      //    .then(() => {
      //       console.log("Slack Bolt App is running!");
      //    })
      //    .catch((err) => {
      //       console.error("Error starting Slack Bolt App:");
      //       console.error(err);
      //    });

      /*
      bot.on("start", function () {
         // get the channelID of the desired channel to interact with
         bot.getChannelId(config.slackBot.channel).then((id) => {
            channelID = id;
            console.log(
               `bot_manager: slackBot: ${config.slackBot.channel} .id is ${channelID}`
            );
         });

         // get a hash of userid => user.name
         bot.getUsers().then((list) => {
            // console.log("list:", list);
            list.members.forEach((u) => {
               hashUsers[u.id] = u.name;
            });
            console.log("users:", hashUsers);
         });

         // define channel, where bot exist. You can adjust it there https://my.slack.com/services
         bot.postMessageToChannel(config.slackBot.channel, `online!`);
      });

      bot.on("message", function (data) {
         // all ingoing events https://api.slack.com/rtm
         // console.log('message:', data);
         if (data.type == "message") {
            if (data.channel == channelID) {
               var command;
               var options;

               // check for direct typed command:
               if (data.text.indexOf(config.slackBot.botName) > -1) {
                  // command format:  [botName] [command] [options, ...]
                  var parts = data.text.split(" ");
                  parts.shift(); // remove [botName]
                  command = parts.shift().toLowerCase(); // [command]
                  options = parts;

                  // if we don't know this command, then tell our channel.
                  if (!Commands[command]) {
                     console.log("unknown command:", command);
                     console.log(data);
                     bot.postMessageToChannel(
                        config.slackBot.channel,
                        `I don't understand: ${command}`
                     );
                  }

                  // else check if an attachment has a trigger:
               } else if (data.attachments && data.attachments.length > 0) {
                  data.attachments.forEach((a) => {
                     config.triggers.forEach((t) => {
                        // keep the 1st match
                        if (!command) {
                           if (
                              a.title.search(t.search) > -1 ||
                              a.text.search(t.search) > -1
                           ) {
                              command = t.command;
                              options = t.options;
                           }
                        }
                     });
                  });
               }

               // if we have a valid command, then run the command:
               if (Commands[command]) {
                  if (!Client) {
                     console.error(
                        "ERROR: Host Client is not set while trying to run command "
                     );
                     return;
                  }
                  Commands[command](bot, config, options, Client);
               }
            }
         }
      });

      bot.on("error", (err) => {
         console.log("error:", err);
      });

      bot.on("close", () => {
         console.log("CLOSE: slack connection closed.");
      });
      */
   },

   /**
    * setClient
    * pass in the connection to the Host command processor.
    * @param {Socket} client
    */
   setClient: (client) => {
      Client = client;
   },

   /**
    * slackBot.write()
    * post a message to our slack channel
    * @param msg {string} the message to write to our slackbot channel.
    */
   write: (msg) => {
      if (bot) {
         console.log("SlackBotBolt.write() called:");
         console.error(msg);
         // bot.postMessageToChannel(config.slackBot.channel, msg);
      }
   },
};

/*
// Format of DockerHub webhook posted to the channel.
{ text: '',
  bot_id: 'BG0CV3ZPH',
  mrkdwn: true,
  attachments: 
   [ { author_name: 'skipdaddy',
       fallback: 'Push to skipdaddy/ab-api-sails:master (digest sha256:ae48664bc87d73b50f431146489b1fea293ddac22c39f5ff1696b36ef4e6bb13)',
       text: 'Push to skipdaddy/ab-api-sails:master (digest sha256:ae48664bc87d73b50f431146489b1fea293ddac22c39f5ff1696b36ef4e6bb13)',
       title: 'skipdaddy/ab-api-sails:master: Repository Push',
       id: 1,
       title_link: 'https://cloud.docker.com/redirect/?resource_uri=/api/audit/v1/action/973d8137-2e27-4018-9d14-299e2d9d1127/',
       author_icon: 'https://secure.gravatar.com/avatar/cff60d5b8df43ee1f7aea15345974c97.jpg?s=32&r=g&d=mm',
       color: '2eb886',
       mrkdwn_in: [Object] } ],
  type: 'message',
  subtype: 'bot_message',
  team: 'T03LJKVR6',
  channel: 'CFXUA0B1P',
  event_ts: '1549433907.002600',
  ts: '1549433907.002600' }

  { text: '',
  bot_id: 'BG0CV3ZPH',
  mrkdwn: true,
  attachments: 
   [ { author_name: 'skipdaddy',
       fallback: 'Build in \'master\' (17d0c742) succeeded in 0:08:26',
       text: 'Build in \'master\' (17d0c742) succeeded in 0:08:26',
       title: 'skipdaddy/ab-api-sails:master: Build in \'master\' (17d0c742)',
       id: 1,
       title_link: 'https://cloud.docker.com/redirect/?resource_uri=/api/audit/v1/action/9747954e-aee6-4498-a55c-28516295d14e/',
       author_icon: 'https://secure.gravatar.com/avatar/cff60d5b8df43ee1f7aea15345974c97.jpg?s=32&r=g&d=mm',
       color: '2eb886',
       mrkdwn_in: [Object] } ],
  type: 'message',
  subtype: 'bot_message',
  team: 'T03LJKVR6',
  channel: 'CFXUA0B1P',
  event_ts: '1549433934.002700',
  ts: '1549433934.002700' }
*/
