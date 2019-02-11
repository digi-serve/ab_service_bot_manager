module.exports = {
  /*************************************************************************/
  /* dockerHub                                                             */
  /* configure our responses to dockerHub webhooks                         */
  /*   enable: {bool}  enable listening for dockerHub webhooks             */
  /*   port: {integer}  The port we are listening on                       */
  /*************************************************************************/
  dockerHub: {
    enable: false,
    port: 14000
  },
  /*************************************************************************/
  /* slackBot                                                              */
  /* configure our connection to an active Slack Bot channel               */
  /*   enable: {bool}  enable our slack bot                                */
  /*   botToken: {string}  OAuth & Permission: Bot User OAuth Access Token */
  /*   botName:  {string}  The display name of this bot's posts            */
  /*             Note: botName also needs to preceed a command to the bot. */
  /*             if botName = "jarvis" then the update command would need  */
  /*             to be : jarvis update                                     */
  /*   channel:  {string} The name of the channel to post/listen to        */
  /*************************************************************************/
  slackBot: {
    enable: false,
    botToken: ".....", // define in config/local.js
    botName: ".....", // define in config/local.js
    channel: "....." // define in config/local.js
  },
  /*************************************************************************/
  /* triggers                                                              */
  /* define a set of triggers that will scan incoming messages in our      */
  /* channel and then issue a command (defined below).                     */
  /* Each trigger is an object with the following properties:              */
  /*   search:  {string/regEx}  the expression to search for               */
  /*   command: {string}  the [key] of the command to run if the search    */
  /*                      term is found.                                   */
  /*   options: {obj} additional options to send to the command            */
  /*************************************************************************/
  triggers: [
    // { search: /skipdaddy\/.*:master/, command: "update", options: {} }
  ],
  /*************************************************************************/
  /* commands                                                              */
  /* define the command line action that should be run for the following   */
  /* defined commands:                                                     */
  /*   update:  update the running containers                              */
  /*                                                                       */
  /*************************************************************************/
  commands: {
    update: "docker stack deploy -c docker-compose.yml ab"
  },
  /*************************************************************************/
  /* hostConnection                                                        */
  /* define how the communication between this container and the host      */
  /* command processor.                                                    */
  /* If a sharedSock is defined, that will be chosen over the .tcp option. */
  /* NOTE: using sharedSock on a Mac system will result in "ECONNREFUSED"  */
  /* sharedSock:    On Linux systems we can share a .sock to communicate   */
  /*  path :        {string} full path to the shared socket                */
  /* tcp:           On non Linux systems, we will create a tcp connection  */
  /*  port:         {string} the port to connect to on the host            */
  /*  accessToken:  {string} a shared accessToken this client must provide */
  /*                to establish the connection.                           */
  /*************************************************************************/
  hostConnection: {
    // sharedSock: {
    //   path: "/tmp/appbuilder.sock"
    // },
    // tcp: {
    //   port: "1338",
    //   accessToken: "li77lePigLi77lePigLe7MeIn"
    // }
  }
};
