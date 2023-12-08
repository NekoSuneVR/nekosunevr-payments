const fetch = require('node-fetch');
const SHA256 = require("crypto-js/sha256");
const commerce = require('coinbase-commerce-node');
const axios = require('axios');

class TebexPay {
    constructor(auth) {
        this.tebexapikey = auth.tebexapikey;
    }

    getTransaction(transactionId) {
        return new Promise(async (resolve, reject) => {
            fetch(`https://plugin.tebex.io/payments/${transactionId}`, {
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    getPlayerLookup(username) {
        return new Promise(async (resolve, reject) => {
            fetch(`https://plugin.tebex.io/user/${username}`, {
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    getSales() {
        return new Promise(async (resolve, reject) => {
            fetch(`https://plugin.tebex.io/sales`, {
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    getBans() {
        return new Promise(async (resolve, reject) => {
            fetch(`https://plugin.tebex.io/bans`, {
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    getPackages() {
        return new Promise(async (resolve, reject) => {
            fetch(`https://plugin.tebex.io/packages`, {
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    createCheckoutURL(packageId, username) {
        return new Promise(async (resolve, reject) => {
            const Query = `package_id=${packageId}&username=${username}`;
            fetch(`https://plugin.tebex.io/checkout`, {
                    body: Query,
                    headers: {
                        "X-Tebex-Secret": `${this.tebexapikey}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST"
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }
}

class SellixPay {
    constructor(auth) {
        this.sellixapikey = auth.sellixapikey;
        this.sellixmerchant = auth.sellixmerchant;
    }

    getOrder(orderId) {
        return new Promise(async (resolve, reject) => {
            fetch(`https://dev.sellix.io/v1/orders/${orderId}`, {
                    headers: {
                        "Authorization": `Bearer ${this.sellixapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }

    getProduct(productId) {
        return new Promise(async (resolve, reject) => {
            fetch(`https://dev.sellix.io/v1/products/${productId}`, {
                    headers: {
                        "Authorization": `Bearer ${this.sellixapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    resolve(response) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }
}

class CraftingStorePay {
    constructor(auth) {
        this.craftingstoreapikey = auth.craftingstoreapikey;
    }

    getPayment(transactionId) {
        return new Promise(async (resolve, reject) => {
            fetch(`https://api.craftingstore.net/v7/payments`, {
                    headers: {
                        "token": `Bearer ${this.craftingstoreapikey}`,
                        "Content-Type": "application/json",
                    },
                })
                .then(res => res.json()) // FORMATING TO JSON
                .then(response => {
                    
                    const foundData = result.data.find((x) => x.transactionId.toLowerCase() == transactionId.toLowerCase());
                    resolve(foundData) // REPONSE
                }).catch(error => {
                    reject(error.toString()); // REJECT ERROR 
                });
        })
    }
}

class G2APay {
   constructor(auth) {
       this.g2aapikey = auth.g2aapikey;
   }

   getPayment(transactionId) {
      function calculateAuthHash() {
         const hash = SHA256(`117988d1-3757-48a2-9aba-206f15879414payment@coreroute.chOS@a6Ba@@0W8o-OFPKBzfQCk0UE2--HDGBnNMBHGCnOzbm2z@DmZdy7dGLf49vHP`, 'utf8');
 
         return hash;
      }
      return new Promise(async (resolve, reject) => {
          fetch(`https://pay.g2a.com/rest/transactions/${transactionId}`, {
                  headers: {
                     'Authorization' : this.g2aapikey + ";" + calculateAuthHash(),
                      "Content-Type": "application/json",
                  },
              })
              .then(res => res.json()) // FORMATING TO JSON
              .then(response => {
                  
                  resolve(response) // REPONSE
              }).catch(error => {
                  reject(error.toString()); // REJECT ERROR 
              });
      })
  }
}

class CoinBasePay {
   constructor(auth) {
       this.cbapikey = auth.cbapikey;
   }

   createPayment(chargeData) {
      return new Promise(async (resolve, reject) => {
          commerce.apiKey = this.cbapikey;

          try {
            const charge = await commerce.charges.create(chargeData);
            // Redirect the user to the payment URL
            resolve(charge.hosted_url);
          } catch (error) {
            console.error('Error creating payment:', error);
            reject('Internal Server Error');
          }
      })
  }

  getPayment(event) {
      return new Promise(async (resolve, reject) => {
          commerce.apiKey = this.cbapikey;

          if (event.type === 'charge:confirmed') {
            const chargeId = event.data.id;

            // Check if the payment is verified
            commerce.charges.retrieve(chargeId, (err, charge) => {
              if (err) {
                console.error('Error retrieving charge:', err);
                var jsonres = {
                    status: "Internal Server Error",
                    data: err
                }
                reject(jsonres);
                return;
              }

              if (charge.timeline[0].status === 'completed') {
                var jsonres = {
                    status: "ACCEPTED!",
                    data: charge
                }
                resolve(jsonres);
              } else {
                 var jsonres = {
                    status: "DECLINED!",
                    data: charge
                 }
                 resolve(jsonres);
              }
            });
          } else {
            var jsonres = {
               status: "DECLINED!",
               data: charge
            }
            resolve(jsonres) ;
          }
      })
  }
}

class DTCModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/dtc/';
    }

    async existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   async checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   async getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   async getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class TLOSModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/telos/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class BLURTModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/blurt/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class EOSModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/eos/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class BNBModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/bnb/';
    }

    existsTransaction(address, amount, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.toAddr.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class WAXModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/wax/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class HIVEModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v3/payments/api/hive/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(address, transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.memo === memo && vout.address.toLowerCase() === address.toLowerCase()) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(address, txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${address}/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class FLSModule {
    constructor() {
       this.explorerUrl = 'https://fls.flitswallet.app/api/v1/';
    }

    existsTransaction(address, amount, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.scriptPubKey.addresses[0] === address) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

class LTCModule {
    constructor() {
       this.explorerUrl = 'https://ltc.flitswallet.app/api/';
    }

    existsTransaction(address, amount, memo, timestamp) {
        return new Promise(async (resolve, reject) => {
            try {
              const transactions = await this.getAddressTransactions(address);
              let matchFound = false;
              let conf = '';
              
              for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];

                try {
                  const transactionInfo = await this.getTransaction(transaction);
                  
                  if (transactionInfo.blocktime !== 0 && transactionInfo.blocktime > timestamp) {
                        continue;
                  }

                  for (const vout of transactionInfo.vout) {
                    const formattedAmount = vout.value;

                    if (formattedAmount === amount && vout.scriptPubKey.addresses[0] === address) {
                        await this.checkConfirmations(transaction).then(result => {
                           conf = result;
                        })
                        .catch(error => {
                           conf = ''
                        });
                        
                        resolve({
                          exists: true,
                          txid: transaction,
                          conf,
                       });
                       matchFound = true; // Set the flag to true
                       break; // Exit the loop
                    }
                 }
                
              } catch (error) {
                 console.error(`Error processing transaction ${transaction}:`, error);
              }
           }
           // If no matching transaction is found
           if (!matchFound) {
              return resolve({
                 exists: false,
                 txid: '',
                 conf,
              });
           }
        } catch (error) {
           throw reject(error);
        }
     })
   }

   checkConfirmations(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(txid);
            resolve(transaction.confirmations)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getAddressTransactions(address) {
     return new Promise(async (resolve, reject) => {
        try {
            const addressEndpoint = `${this.explorerUrl}address/${address}`;
            const response = await axios.get(addressEndpoint);
            const transactionsArray = response.data.transactions || [];
            resolve(transactionsArray)
        } catch (error) {
            throw reject(error);
        }
     })
   }

   getTransaction(txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transactionEndpoint = `${this.explorerUrl}tx/${txid}`;
            const response = await axios.get(transactionEndpoint);
            resolve(response.data)
        } catch (error) {
            throw reject(error);
        }
     })
   }
}

exports.HIVEModule = HIVEModule;
exports.FLSModule = FLSModule;
exports.LTCModule = LTCModule;
exports.TLOSModule = TLOSModule;
exports.WAXModule = WAXModule;
exports.BLURTModule = BLURTModule;
exports.BNBModule = BNBModule;
exports.EOSModule = EOSModule;
exports.DTCModule = DTCModule;
exports.CoinBasePay = CoinBasePay;
exports.TebexPay = TebexPay;
exports.CraftingStorePay = CraftingStorePay;
exports.SellixPay = SellixPay;
exports.G2APay = G2APay;
