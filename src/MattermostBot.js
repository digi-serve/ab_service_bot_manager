const fetch = require("node-fetch");
const mattermostListen = require("./mattermostListen.js");
const update = require("./command_update.js");

class MattermostBot {
   constructor({ config, url, channel, team }) {
      this.config = config;
      this.auth = `Bearer ${config.slackBot.botToken}`;
      this.url = url;
      this.botName = config.slackBot.botName;
      this.channelName = channel;
      this.teamName = team;
      this.whUrl = config.slackBot.callback;
      this.whPort = config.slackBot.callbackPort;
      this.Commands = { update };
   }

   static async init(config, client) {
      const checkParams = ["botToken", "botName", "url"];
      checkParams.forEach((p) => {
         if (config.slackBot[p].indexOf("..") > -1) {
            return new Error("ERROR: missing configuration value: " + p);
         }
      });

      const urlParts = config.slackBot.url.match(
         /(^https?:\/\/.+)\/([^/]+)\/channels\/([^/]+)$/
      );

      const options = {
         config,
         url: urlParts[1],
         channel: urlParts[3],
         team: urlParts[2],
      };

      const bot = new MattermostBot(options);
      bot.setClient(client);
      await Promise.all([bot.getTeamId(), bot.getChannelID()]);
      console.log("Mattermost Bot Online");
      bot.write("Connected");
      bot.registerWebhooks();
      return bot;
   }

   /**
    * setClient
    * pass in the connection to the Host command processor.
    * @param {Socket} client
    */
   setClient(client) {
      this.client = client;
   }

   /**
    * Sends an api request to Mattermost, posting a message in the configured channel
    * POST /posts
    * @function write
    * @param {msg} write content to post
    */
   async write(msg) {
      if (this.channelId === undefined) {
         console.log("ChannelId not set yet");
         return;
      }

      const body = {
         channel_id: this.channelId,
         message: "",
         props: {
            attachments: [
               {
                  author_name: this.botName,
                  text: msg,
               },
            ],
         },
      };

      const res = await fetch(`${this.url}/api/v4/posts`, {
         method: "post",
         body: JSON.stringify(body),
         headers: {
            authorization: this.auth,
            content_type: "application/json",
         },
      });

      if (res.status === 201) return;

      throw new Error(`Mattermost post returned ${res.status}`);
   }

   /**
    * Sends an api request to Mattermost to get the ChannelId based on the
    * teamName & channelName and saves it to the class
    * GET /teams/name/:team_name/channels/name/:channel_name
    * @function getTeamId
    */
   async getChannelID() {
      const res = await fetch(
         `${this.url}/api/v4/teams/name/${this.teamName}/channels/name/${this.channelName}`,
         { headers: { authorization: this.auth } }
      );
      if (res.status !== 200) {
         throw new Error(`GET channelId returned ${res.status}`);
      }
      const json = await res.json();
      this.channelId = json.id;
      return true;
   }

   /**
    * Sends an api request to Mattermost to get the teamId based on the teamName
    * and saves it to the class
    * GET /teams/name/:team_name
    * @function getTeamId
    */
   async getTeamId() {
      const res = await fetch(
         `${this.url}/api/v4/teams/name/${this.teamName}`,
         {
            headers: { authorization: this.auth },
         }
      );
      if (res.status !== 200) {
         throw new Error(`GET teamId returned ${res.status}`);
      }
      const data = await res.json();
      this.teamId = data.id;
      return true;
   }

   /**
    * Launches the express app for callbacks and Sends an api request
    * to the Mattermost server adding outgoing Webhooks
    * POST /hooks/outgoing
    * @function registerWebhooks
    */
   async registerWebhooks() {
      mattermostListen(this);
      // Check for existing webhooks
      const res1 = await fetch(
         `${this.url}/api/v4/hooks/outgoing?channel_id=${this.channelId}`,
         { headers: { authorization: this.auth } }
      );

      if (res1.status !== 200) {
         console.log("Get Webhooks returned", res1.status);
      }

      const data = await res1.json();
      const matches = data.filter((wh) => {
         return (
            wh.display_name === this.botName &&
            wh.callback_urls.includes(
               `${this.whUrl}:${this.whPort}/mattermost/webhook`
            )
         );
      });
      if (matches.length > 0) {
         this.whToken = matches[0].token;
         console.log(`Webhooks for bot ${this.botName} already exist`);
         return;
      }
      // Add webhooks
      const body = {
         team_id: this.teamId,
         channel_id: this.channelId,
         description: "Added by ab bot manager",
         display_name: this.botName,
         trigger_words: [this.botName, this.botName.toLowerCase()],
         trigger_when: 0,
         callback_urls: [`${this.whUrl}:${this.whPort}/mattermost/webhook`],
         content_type: "application/json",
      };
      const res2 = await fetch(`${this.url}/api/v4/hooks/outgoing`, {
         method: "post",
         body: JSON.stringify(body),
         headers: {
            authorization: this.auth,
            content_type: "application/json",
         },
      });

      if (res2.status !== 201) {
         console.log("WEBHOOKS", res2);
         // throw new Error("Mattermost post returned" + res.status);
      }

      const json = await res2.json();
      this.whToken = json.token;
      return;
   }

   webhookHandler(req, res) {
      if (req.body.token !== this.whToken) {
         return res.status(403).send();
      }
      const text = req.body.text;
      const parts = text.split(" ");
      // Check if a command was written
      if (parts.length <= 1) {
         this.write(
            `Please write a command \`${this.botName} [command] [options, ...]\``
         );
         return res.status(200).send();
      }
      const command = parts[1];
      const options = parts.slice(2);
      // Check if the command is supported
      if (!Object.prototype.hasOwnProperty.call(this.Commands, command)) {
         this.write(`I don't understand: \`${command}\``);
         return res.status(200).send();
      }
      if (!this.client) {
         console.error(
            "ERROR: Host Client is not set while trying to run command "
         );
         return res.status(503).send();
      } else {
         this.Commands[command](this, this.config, options, this.client);
         return res.status(200).send();
      }
   }
}
module.exports = MattermostBot;
