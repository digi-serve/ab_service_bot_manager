const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

let LineBot = require("../src/lineBot.js");

function reloadBotWithStubs(fetch, lineListen) {
   LineBot = proxyquire("../src/lineBot.js", {
      "node-fetch": fetch,
      "./lineListen.js": lineListen === undefined ? sinon.fake() : lineListen,
   });
}

describe("LineBot", () => {
   const config = {
      lineBot: {
         enable: true,
         type: "Line",
         botToken: "notarealtoken",
         botName: "test",
         url: "https://www.test.com/line/channels/most",
         callback: "https://ab.test.com",
         callbackPort: 15000,
      },
   };
   const url = "https://www.test.com";
   const team = "line";
   const channel = "most";

   describe("constructor", () => {
      it("sets values", () => {
         const bot = new LineBot({ config, url, channel, team });
         assert.deepEqual(bot.config, config);
         assert.equal(bot.auth, `Bearer ${config.lineBot.botToken}`);
         assert.equal(bot.url, url);
         assert.equal(bot.botName, config.lineBot.botName);
         assert.equal(bot.channelName, channel);
         assert.equal(bot.teamName, team);
         assert.equal(bot.whUrl, config.lineBot.callback);
         assert.equal(bot.whPort, config.lineBot.callbackPort);
      });
   });
   describe("init", () => {
      it("returns a bot", async () => {
         // Create Stubs
         const getChannelIdStub = sinon
            .stub(LineBot.prototype, "getChannelID")
            .resolves();
         const getTeamIdStub = sinon
            .stub(LineBot.prototype, "getTeamId")
            .resolves();
         const writeStub = sinon.stub(LineBot.prototype, "write");
         const registerWebhooksStub = sinon
            .stub(LineBot.prototype, "registerWebhooks")
            .resolves();
         // Call
         const bot = await LineBot.init(config);
         // Assertions
         assert.equal(getChannelIdStub.callCount, 1);
         assert.equal(getTeamIdStub.callCount, 1);
         assert.equal(writeStub.callCount, 1);
         assert.equal(registerWebhooksStub.callCount, 1);
         assert.deepEqual(bot.config, config);
         assert.equal(bot.auth, `Bearer ${config.lineBot.botToken}`);
         assert.equal(bot.url, url);
         assert.equal(bot.botName, config.lineBot.botName);
         assert.equal(bot.channelName, channel);
         assert.equal(bot.teamName, team);
         assert.equal(bot.whUrl, config.lineBot.callback);
         assert.equal(bot.whPort, config.lineBot.callbackPort);

         // Restore Stubs
         getChannelIdStub.restore();
         getTeamIdStub.restore();
         writeStub.restore();
         registerWebhooksStub.restore();
      });
   });
   describe("setClient", () => {
      it("sets the client", () => {
         const bot = new LineBot({ config, url, channel, team });
         const client = "test";
         const setClientSpy = sinon.spy(bot, "setClient");
         bot.setClient(client);
         assert.equal(bot.client, client);
         assert.equal(setClientSpy.callCount, 1);
      });
   });
   describe("write", () => {
      const fakeFetch = sinon.fake.resolves({ status: 201 });
      reloadBotWithStubs(fakeFetch);

      const bot = new LineBot({ config, url, channel, team });
      const writeSpy = sinon.spy(bot, "write");
      const testMessage = "This is a test message";

      it("Returns if bot.channelId not set", async () => {
         const callsBefore = fakeFetch.callCount;
         await bot.write(testMessage);
         const callsAfter = fakeFetch.callCount;
         assert.equal(writeSpy.callCount, 1);
         assert.equal(callsBefore, callsAfter);
      });
      it("Sends a post request", async () => {
         const testMessage = "This is a test message";
         const regTest = /This\sis\sa\stest\smessage/;
         bot.channelId = "channelId";
         const callsBefore = fakeFetch.callCount;
         await bot.write(testMessage);
         const callsAfter = fakeFetch.callCount;
         const postBody = fakeFetch.lastCall.lastArg.body;

         assert.equal(writeSpy.callCount, 2);
         assert.match(postBody, regTest);
         assert.equal(callsAfter, callsBefore + 1);
      });
   });
   describe("getChannelID", () => {
      it("Makes a request", async () => {
         const fakeFetch = sinon.fake.resolves({
            status: 200,
            json: () => {
               return { id: "channel-id" };
            },
         });
         reloadBotWithStubs(fakeFetch);

         const bot = new LineBot({ config, url, channel, team });
         const spy = sinon.spy(bot, "getChannelID");
         await bot.getChannelID();
         assert.equal(spy.callCount, 1);
         assert.equal(
            fakeFetch.firstArg,
            `${url}/api/v4/teams/name/${team}/channels/name/${channel}`
         );
         assert.equal(bot.channelId, "channel-id");
      });
   });
   describe("getTeamId", () => {
      it("Makes a request", async () => {
         const fakeFetch = sinon.fake.resolves({
            status: 200,
            json: () => {
               return { id: "team-id" };
            },
         });
         reloadBotWithStubs(fakeFetch);

         const bot = new LineBot({ config, url, channel, team });
         const spy = sinon.spy(bot, "getTeamId");
         await bot.getTeamId();
         assert.equal(spy.callCount, 1);
         assert.equal(fakeFetch.firstArg, `${url}/api/v4/teams/name/${team}`);
         assert.equal(bot.teamId, "team-id");
      });
   });
   describe("registerWebhooks", () => {
      it("Makes a request (no webhooks setup)", async () => {
         const stubFetch = sinon
            .stub()
            .onFirstCall()
            .resolves({
               status: 200,
               json: () => {
                  return [];
               },
            })
            .onSecondCall()
            .resolves({
               status: 201,
               json: () => {
                  return { token: "wh-token" };
               },
            });
         const fakeMmListen = sinon.fake();
         reloadBotWithStubs(stubFetch, fakeMmListen);

         const bot = new LineBot({ config, url, channel, team });
         const spy = sinon.spy(bot, "registerWebhooks");
         bot.channelId = "channel-id";
         await bot.registerWebhooks();

         assert.equal(spy.callCount, 1);
         assert.equal(fakeMmListen.callCount, 1);
         assert.equal(stubFetch.callCount, 2);
         assert.equal(
            stubFetch.firstCall.firstArg,
            `${url}/api/v4/hooks/outgoing?channel_id=channel-id`
         );
         assert.equal(
            stubFetch.lastCall.firstArg,
            `${url}/api/v4/hooks/outgoing`
         );
         assert.equal(bot.whToken, "wh-token");
      });
      it("Makes a request (webhooks already setup)", async () => {
         const stubFetch = sinon.stub().resolves({
            status: 200,
            json: () => {
               return [
                  {
                     display_name: config.lineBot.botName,
                     callback_urls: [
                        `${config.lineBot.callback}:${config.lineBot.callbackPort}/line/webhook`,
                     ],
                     token: "wh-token",
                  },
               ];
            },
         });

         const fakeMmListen = sinon.fake();
         reloadBotWithStubs(stubFetch, fakeMmListen);

         const bot = new LineBot({ config, url, channel, team });
         const spy = sinon.spy(bot, "registerWebhooks");
         bot.channelId = "channel-id";
         await bot.registerWebhooks();

         assert.equal(spy.callCount, 1);
         assert.equal(fakeMmListen.callCount, 1);
         assert.equal(stubFetch.callCount, 1);
         assert.equal(
            stubFetch.firstCall.firstArg,
            `${url}/api/v4/hooks/outgoing?channel_id=channel-id`
         );
         assert.equal(bot.whToken, "wh-token");
      });
   });
   describe("webhookHandler", () => {
      const mockRequest = (token, text) => {
         return { body: { token, text } };
      };
      const mockResponse = () => {
         const res = {};
         res.status = sinon.stub().returns(res);
         res.send = sinon.stub().returns(res);
         res.download = sinon.stub();
         return res;
      };
      const bot = new LineBot({ config, url, channel, team });
      bot.whToken = "wh-token";
      it("Rejects an invalid token", () => {
         const req = mockRequest("bad-token", "");
         const res = mockResponse();
         bot.webhookHandler(req, res);
         assert.equal(res.status.callCount, 1);
         assert.equal(res.status.firstCall.firstArg, 403);
         assert.equal(res.send.callCount, 1);
      });
      it("Responds - no command", () => {
         const writeStub = sinon.stub(bot, "write");
         const req = mockRequest("wh-token", "test");
         const res = mockResponse();
         bot.webhookHandler(req, res);
         assert.equal(res.status.callCount, 1);
         assert.equal(res.status.firstCall.firstArg, 200);
         assert.equal(res.send.callCount, 1);
         assert.equal(writeStub.callCount, 1);
         assert.match(
            writeStub.firstCall.firstArg,
            /Please\swrite\sa\scommand/
         );
         writeStub.restore();
      });
      it("Responds - invalid command", () => {
         const writeStub = sinon.stub(bot, "write");
         const req = mockRequest("wh-token", "test bad-command");
         const res = mockResponse();
         bot.webhookHandler(req, res);
         assert.equal(res.status.callCount, 1);
         assert.equal(res.status.firstCall.firstArg, 200);
         assert.equal(res.send.callCount, 1);
         assert.equal(writeStub.callCount, 1);
         assert.equal(
            writeStub.firstCall.firstArg,
            "I don't understand: `bad-command`"
         );
         writeStub.restore();
      });
      it("Responds - no host client connnection", () => {
         const req = mockRequest("wh-token", "test update");
         const res = mockResponse();
         bot.webhookHandler(req, res);
         assert.equal(res.status.callCount, 1);
         assert.equal(res.status.firstCall.firstArg, 503);
         assert.equal(res.send.callCount, 1);
      });
      it("Responds - runs command", () => {
         bot.client = "fakeClient";
         const updateStub = sinon.stub(bot.Commands, "update");
         const req = mockRequest("wh-token", "test update");
         const res = mockResponse();
         bot.webhookHandler(req, res);
         assert.equal(res.status.callCount, 1);
         assert.equal(res.status.firstCall.firstArg, 200);
         assert.equal(res.send.callCount, 1);
         assert.equal(updateStub.callCount, 1);
      });
   });
});
