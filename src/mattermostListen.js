//
// dockerListen
// listen for DockerHub webhook calls and restart the running stack
const express = require("express");
const app = express();
let port = 15000;
module.exports = (bot) => {
   port = bot.whPort || 15000;
   app.use(express.json());
   app.post("/mattermost/webhook", (req, res) => {
      return bot.webhookHandler(req, res);
   });

   app.listen(port, () =>
      console.log(
         `bot_manager listening for post /mattermost/webhook on port ${port}!`
      )
   );
};
