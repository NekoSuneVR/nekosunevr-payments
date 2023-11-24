const axios = require('axios');

class DTCModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/dtc/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class TLOSModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/telos/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class BLURTModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/blurt/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class EOSModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/eos/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class BNBModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/bnb/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class WAXModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/wax/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class HIVEModule {
  constructor() {
    this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/hive/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class FLSModule {
  constructor() {
    this.explorerUrl = 'https://fls.flitswallet.app/api/v1/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (vout.value === amount && vout.scriptPubKey.addresses[0] === address) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

class LTCModule {
  constructor() {
    this.explorerUrl = 'https://ltc.flitswallet.app/api/';
  }

  async existsTransaction(address, amount, memo, timestamp) {
    try {
      const transactions = await this.getAddressTransactions(address);
      for (const transaction of transactions) {
        const transactionInfo = await this.getTransaction(transaction);
        const conf = this.checkConfirmations(transaction);

        if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
          return {
            exists: false,
            txid: '',
            conf,
          };
        }

        for (const vout of transactionInfo.vout) {
          const formattedAmount = vout.value;

          if (vout.value === amount && vout.scriptPubKey.addresses[0] === address) {
            return {
              exists: true,
              txid: transaction,
              conf,
            };
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async checkConfirmations(txid) {
    try {
      const transaction = await this.getTransaction(txid);
      return transaction.confirmations;
    } catch (error) {
      throw error;
    }
  }

  async getAddressTransactions(address) {
    try {
      const addressEndpoint = `${this.explorerUrl}address/${address}`;
      const response = await axios.get(addressEndpoint);
      const transactionsArray = response.data.transactions || [];
      return transactionsArray;
    } catch (error) {
      throw error;
    }
  }

  async getTransaction(txid) {
    try {
      const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
      const response = await axios.get(transactionEndpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = {
  DTCModule,
  HIVEModule,
  FLSModule,
  LTCModule,
  TLOSModule,
  WAXModule,
  BLURTModule,
  BNBModule,
  EOSModule
};