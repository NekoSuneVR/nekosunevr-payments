const {POLModule} = require("../lib/index.js")

async function test(account, amount, timestamp) {
  const module = new POLModule({
    tokenContract: '0x1379E8886A944d2D9d440b3d88DF536Aea08d9F3' // MYST
  });
  const transaction = await module.existsTransaction(account, amount, timestamp);
  console.log(transaction);
}

test('0x819321542ed9b59e99aac414abf1820854d725d7', '0.05', 1764707645);