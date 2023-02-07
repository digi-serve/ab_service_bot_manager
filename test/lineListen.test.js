const assert = require("assert");
const sinon = require("sinon");
const proxyquire = require("proxyquire");

const fakeApp = {
   use: sinon.fake(),
   post: sinon.fake(),
   listen: sinon.fake(),
};
const fakeExpress = sinon.fake.returns(fakeApp);

const lineListen = proxyquire("../src/lineListen.js", {
   express: fakeExpress,
});

describe("Line listen", () => {
   it("Sets up the server", () => {
      lineListen({});
      assert.equal(fakeApp.use.callCount, 1);
      assert.equal(fakeApp.post.callCount, 1);
      assert.equal(fakeApp.listen.callCount, 1);
   });
   it("Uses the port from bot", () => {
      lineListen({ whPort: 12345 });
      assert.equal(fakeApp.listen.lastCall.firstArg, 12345);
   });
});
