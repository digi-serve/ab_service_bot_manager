//
// command_processCheck
// respond to an "processcheck" command from our #slack channel
// additional options can be sent along with the command, so we will need to process those here.

// isUpdateInProgress {bool} flag to prevent issuing multiple updates back to back

//used for pid check
const psLookup = require("current-processes");
const _ = require("lodash");

var isUpdateInProgress = false;
var timeoutID = null;

var Bot;
var Config;
var Server;

module.exports = (bot, config, options, commandServer) => {
  Bot = bot;
  Config = config;
  Server = commandServer;

  // prevent issuing multiple commands
  if (!isUpdateInProgress) {
    isUpdateInProgress = true;

    bot.postMessageToChannel(
      config.slackBot.channel,
      "... checking server Processes"
    );

    checkRunningProcesses();
    //Run the loop
    checkProcess();

    //return results
    logHighUsageProcesses();

    // reset our Timer
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      isUpdateInProgress = false;
    }, 1000); // 3 * 60 *  3min
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
    Server.removeListener("data", done);
  }
}

// stores a short term process list
var history = []
// if a process appears in 'history' more than once it is added to this list
var repeatoffenders = [];

let i = 1;

function checkProcess() {
  // This runs several times over a small span of time in order to avoid capturing spikes
  //this may prove to be unnessicary
  setTimeout(function () {
    checkRunningProcesses()

    i++;
    if (i < 5) {
      checkProcess();
    }

  }, 500)
}

function checkRunningProcesses() {
  psLookup.get(function (err, processes) {
    var sorted = _.sortBy(processes, "cpu");
    let top5 = sorted.reverse().splice(0, 5);
    top5.forEach(element => {
      var match = function (stored) {
        return element.pid == stored.pid;
      };
      if (history.some(match) && (!repeatoffenders.some(match))) {
        //console.log("Caught new high usage process")
        repeatoffenders.push(element);
      }
      //check if comperitavly high usage process has a history //and check if true usage is actually that high
      if (!history.some(match)) { //&& h.cpu > .5
        //console.log("adding to history")
        history.push(element);
      }
    });
  });
}


function logHighUsageProcesses() {
  if (repeatoffenders.length > 0) {
    let botMessage = `These processes may be problematic: `
    //console.log("These processes may be problematic: ");
    let sorted = _.sortBy(repeatoffenders, "cpu");
    repeatoffenders = sorted.reverse().splice(0, 3);
    repeatoffenders.forEach(element => {
      botMessage += (`"\n"` + JSON.stringify(element));
      //console.log(element)
    });
    history
    history = _.sortBy(history, "cpu");
    history = history.reverse().splice(0, 3);

    Bot.postMessageToChannel(
      Config.slackBot.channel,
      botMessage
    );
  } else {
    Bot.postMessageToChannel(
      Config.slackBot.channel,
      "no data, please run check again"
    );
    checkProcess()
  }
}
