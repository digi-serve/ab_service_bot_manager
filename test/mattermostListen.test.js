const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

const fakeApp = {
   use: sinon.fake(),
   post: sinon.fake(),
   listen: sinon.fake(),
};
const fakeExpress = sinon.fake.returns(fakeApp);

const mattermostListen = proxyquire("../src/mattermostListen.js", {
   express: fakeExpress,
});

describe("Mattermost listen", () => {
   it("Sets up the server", () => {
      mattermostListen({});
      assert.equal(fakeApp.use.callCount, 1);
      assert.equal(fakeApp.post.callCount, 1);
      assert.equal(fakeApp.listen.callCount, 1);
   });
   it("Uses the port from bot", () => {
      mattermostListen({ whPort: 12345 });
      assert.equal(fakeApp.listen.lastCall.firstArg, 12345);
   });
});
