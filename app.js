const path = require("path");
const fs = require("fs");
const AB = require("ab-utils");

const config = AB.config("bot_manager");

const slackBot = require(path.join(process.cwd(), "src", "slackBotBolt.js"));
const MatterBot = require("./src/MattermostBot.js");

(async () => {
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

   let bot;

   if (config.slackBot.enable) {
      //setup the bot
      console.log(`Initializint ${config.slackBot.type} Bot`);
      if (config.slackBot.type === "Slack") {
         bot = slackBot.init(config, client);
      } else if (config.slackBot.type === "Mattermost") {
         try {
            bot = await MatterBot.init(config, client);
         } catch (e) {
            console.log("MMBOT ERROR", e);
            process.exit(1);
         }
      }
   } else {
      console.log("Bot not enabled");
      process.exit();
   }

   //
   // net
   // connect via a socket to a process on the Host server in order to execute
   // commands on the host: mostly docker restart commands.
   //
   // Connections can either be
   //   - a shared .sock file  (LINUX systems only)
   //   - a tcp port + accessToken (Non Linux)
   //
   // If neither connection is defined, we will exit with an error!
   const net = require("net");
   var isSockConnection = true;
   var SOCKETFILE = "/tmp/ab.sock";
   var HOST = "host.docker.internal";
   var PORT = "1339";
   var ACCESSTOKEN = "ThereIsN0Sp00n";
   var endCounter = 0;
   if (
      !config.hostConnection.sharedSock ||
      !config.hostConnection.sharedSock.path
   ) {
      isSockConnection = false;
      if (
         !config.hostConnection.tcp ||
         !config.hostConnection.tcp.port ||
         !config.hostConnection.tcp.accessToken
      ) {
         console.error(
            "ERROR: config/local.js must specify a bot_manager.hostConnection."
         );
         process.exit(1);
      }
   }
   if (isSockConnection) {
      SOCKETFILE = config.hostConnection.sharedSock.path;
   } else {
      HOST = config.hostConnection.tcp.host || HOST;
      // PORT = config.hostConnection.tcp.port;
      ACCESSTOKEN = config.hostConnection.tcp.accessToken;
   }

   console.log("Connecting to Host Process.");
   var client;
   var RECONNECTING = false;

   function connectHost() {
      if (isSockConnection) {
         console.log(`createConnection(${SOCKETFILE})`);
         client = net.createConnection(SOCKETFILE);
      } else {
         console.log(`createConnection(${PORT}, ${HOST})`);
         client = net.createConnection(PORT, HOST);
      }

      client
         .on("connect", () => {
            console.log("Connected to Host Process");
            if (!isSockConnection) {
               console.log("... sending accessToken");
               client.write(ACCESSTOKEN);
            }
            bot.setClient(client);
         })
         // Messages are buffers. use toString
         .on("data", function (data) {
            data = data.toString();

            if (data === "__running") {
               offlineImages = [];
               offlineAlerted = false;
               if (config.slackBot.enable) {
                  bot.write("... running");
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
         .on("error", function (data) {
            console.log(data);
            if (data.code == "ECONNREFUSED") {
               // if we are supposed to be working with a .sock file,
               // make sure it is accessible:
               if (isSockConnection) {
                  fs.access(
                     SOCKETFILE,
                     fs.constants.F_OK | fs.constants.F_OK,
                     (err) => {
                        if (err) {
                           console.log("fs.access:", err);
                        }
                     }
                  );
               }
            }
            console.error("Server not active.");
            if (config.slackBot.enable) {
               bot.write("Host update server not active.");
            }
            reconnectToHost();
         })
         .on("end", function () {
            endCounter += 1;
            console.log(`${endCounter}: Connection to Host received: 'end'. `);
            reconnectToHost();
         });
   }

   function reconnectToHost() {
      client.end();
      client = null;
      if (!RECONNECTING) {
         RECONNECTING = true;
         setTimeout(() => {
            RECONNECTING = false;
            console.log("... attempt to reconnect to host");
            connectHost();
         }, 10000);
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
         bot.write("... offline images:" + offlineImages.join(", "));
         offlineImages = []; // reset images
         offlineAlerted = true;
      }
   }

   connectHost();

   setInterval(offlineAlert, 30 * 1000); // every 30s
})();
