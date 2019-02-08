const path = require("path");
const AB = require("ab-utils");

const config = AB.config("bot_manager");

//
// dockerListen
// our listener for DockerHub webhooks
const dockerListen = require(path.join(
  process.cwd(),
  "src",
  "dockerListen.js"
));

if (config.dockerHub.enable) {
  dockerListen(config, client);
}

//
// slackBot
// our connection to a slack channel to listen/post information
const slackBot = require(path.join(process.cwd(), "src", "slackBot.js"));

if (config.slackBot.enable) {
  slackBot.init(config, client);
}

//
// net
// connect via a socket to a process on the Host server in order to execute
// commands on the host: mostly docker restart commands.
const net = require("net");
const SOCKETFILE = "/tmp/ab.sock";

console.log("Connecting to Host Process.");
var client;
var RECONNECTING = false;

function connectHost() {
  client = net
    .createConnection(SOCKETFILE)
    .on("connect", () => {
      console.log("Connected to Host Process");
      slackBot.setClient(client);
    })
    // Messages are buffers. use toString
    .on("data", function(data) {
      data = data.toString();

      if (data === "__running") {
        offlineImages = [];
        offlineAlerted = false;
        if (config.slackBot.enable) {
          slackBot.write("... running");
        }
      }

      if (data.indexOf("__offline") > -1) {
        var parts = data.split(":");
        offlineImages = parts[1].split(",");
        if (!offlineAlerted) {
          offlineAlert();
        }
      }

      // Generic message handler
      // console.info("Server:", data);
    })
    .on("error", function(data) {
      console.error("Server not active.");
      if (config.slackBot.enable) {
        slackBot.write("Host update server not active.");
      }
      reconnectToHost();
    })
    .on("end", function() {
      console.log("Connection to Host received: 'end'. ");
      reconnectToHost();
    });
}

function reconnectToHost() {
  client.end();
  if (!RECONNECTING) {
    RECONNECTING = true;
    setTimeout(() => {
      RECONNECTING = false;
      console.log("... attempt to reconnect to host");
      connectHost();
    }, 5000);
  }
}

/**
 * offlineAlert
 * a routine to periodically update our #slack channel with with docker
 * services are offline.
 */
var offlineImages = [];
var offlineAlerted = false;
function offlineAlert() {
  if (offlineImages.length > 0) {
    slackBot.write("... offline images:" + offlineImages.join(", "));
    offlineImages = []; // reset images
    offlineAlerted = true;
  }
}

connectHost();

setInterval(offlineAlert, 30 * 1000); // every 30s
