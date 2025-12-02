const { BNBModule } = require('../lib/index.js')

async function test (account, amount, timestamp) {
  const module = new BNBModule({
    tokenContract: '0x55d398326f99059fF775485246999027B3197955',
    url: 'https://bsc1.trezor.io/api',
    altExplorerUrls: ['https://bsc2.trezor.io/api']
  })
  const transaction = await module.existsTransaction(account, amount, timestamp)
  console.log(transaction)
}

test('0x2CF64Ab6644EC9BA8A0289443e8e08bdDC77124D', '100.017396', 1764710562)
