//
// command_update
// respond to an "update" command from our #slack channel
// additional options can be sent along with the command, so we will need to
// process those here.

var isUpdateInProgress = false;
// {bool} isUpdateInProgress
// flag to prevent issuing multiple updates back to back

var timeoutID = null;
// {string} timeoutID
// the setTimeout() id used to guage a max delay when waiting for an update
// response.

var Bot;
// {SlackBot} Bot
// Our bot_manager/src/slackBotBolt.js manager for interacting with our
// slack channel.

var Config;
// {json} Config
// our configuration settings.

var Server;
// {Net} Server
// the connection to our host process that is running our commands.

/**
 * @function command_update
 * process sending an 'update' command from our #slack channel to our host
 * process.
 * The commands we can send have been defined in our Config file and resolve
 * to a command line instruction. The response of that instruction will be
 * returned.
 * @param {SlackBot} bot
 * @param {json} config
 * @param {array} options
 * @param {Net} commandServer
 */
module.exports = (bot, config, options, commandServer) => {
   Bot = bot;
   Config = config;
   Server = commandServer;

   // prevent issuing multiple commands
   if (!isUpdateInProgress) {
      isUpdateInProgress = true;

      bot.postMessageToChannel(
         config.slackBot.channel,
         "... updating server containers"
      );

      // pass our update command to the Host Process
      commandServer.write(config.commands.update);

      // listen for responses from the Host
      commandServer.on("data", done);

      // reset our Timer
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => {
         isUpdateInProgress = false;
      }, 3 * 60 * 1000); // 3min
   }
};

/**
 * done
 * an event listener for the "data" event on the Server.
 * listen for a "__running" message and alert the #slack channel that we are
 * running.
 * @param {Buffer} data the incoming data from the Host Process.
 */
function done(data) {
   data = data.toString();

   // listen for the Host's update when things are all back up and running.
   if (data === "__running") {
      Bot.postMessageToChannel(Config.slackBot.channel, "... update complete.");
      isUpdateInProgress = false;
      clearTimeout(timeoutID);

      // only listen after we have issued an 'update' command.
      // this sequence is done, so remove our listener.
      Server.removeListener("data", done);
   }
}
