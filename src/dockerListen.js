//
// dockerListen
// listen for DockerHub webhook calls and restart the running stack
const express = require("express");
const app = express();
let port = 14000;
module.exports = config => {
  console.log("bot_manager: dockerListen: init ...");
  port = config.dockerHub.port || 14000;

  app.post("/dockerHub", (req, res) => res.send("Hello World!"));

  app.listen(port, () =>
    console.log(`bot_manager listening for post /dockerHub on port ${port}!`)
  );
};
