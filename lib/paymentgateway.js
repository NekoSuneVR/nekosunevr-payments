const fetch = require('node-fetch');
const SHA256 = require("crypto-js/sha256");
const commerce = require('coinbase-commerce-node');
const axios = require('axios');
const Stripe = require('stripe')


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

class CoinBasePay {
   constructor(auth) {
       this.cbapikey = auth.cbapikey;
   }

   createPayment(chargeData) {
      return new Promise(async (resolve, reject) => {
          var Client = commerce.Client;
          Client.init(this.cbapikey);

          try {
            const charge = await commerce.resources.Charge.create(chargeData);
            // Redirect the user to the payment URL
            const jsondata = {
              item: charge.name,
              hosted_url: charge.hosted_url,
              expires_at: charge.expires_at,
              created_at: charge.created_at,
              code: charge.code,
              type: 'charge:created',
              attempt_number: 0
            }
            resolve(jsondata);
          } catch (error) {
            console.error('Error creating payment:', error);
            reject('Internal Server Error');
          }
      })
  }

  getPayment(event) {
      return new Promise(async (resolve, reject) => {
          var Client = commerce.Client;
          Client.init(this.cbapikey);

          if (event.type === 'charge:created') {
            var jsonres = {
               status: "WAITING!"
            }
            resolve(jsonres) ;
          } else if (event.type === 'charge:pending') {
            var jsonres = {
               status: "PENDING!!"
            }
            resolve(jsonres) ;
          } else if (event.type === 'charge:confirmed') {
            const chargeId = event.data.id;

            // Check if the payment is verified
            commerce.resources.Charge.retrieve(chargeId, (err, charge) => {
              if (err) {
                console.error('Error retrieving charge:', err);
                var jsonres = {
                    status: "Internal Server Error",
                    data: err
                }
                reject(jsonres);
                return;
              }

              if (charge.timeline[3]?.status === 'COMPLETED') {
                var jsonres = {
                    status: "ACCEPTED!"
                }
                resolve(jsonres);
              } else {
                 var jsonres = {
                    status: "DECLINED!"
                 }
                 resolve(jsonres);
              }
            });
          } else {
            var jsonres = {
               status: "DECLINED!"
            }
            resolve(jsonres) ;
          }
      })
  }
}

class TLOSModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/telos/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/blurt/';
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
                        await this.checkConfirmations(address, transaction).then(result => {
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

   checkConfirmations(address, txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(address, txid);
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

class EOSModule {
    constructor() {
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/eos/';
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
                
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/bnb/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/wax/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
       this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/hive/';
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
                        await this.checkConfirmations(address, transaction).then(result => {
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

   checkConfirmations(address, txid) {
     return new Promise(async (resolve, reject) => {
        try {
            const transaction = await this.getTransaction(address, txid);
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

class STEEMModule {
   constructor() {
      this.explorerUrl = 'https://api.nekosunevr.co.uk/v5/pay/gateways/api/steem/';
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
                       await this.checkConfirmations(address, transaction).then(result => {
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
                
                if (matchFound) {
                   break; // Exit the outer loop
                }

                // Add a conditional check to skip continue; when matchFound is true
                if (!matchFound) {
                  continue; // Continue processing the next transaction
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

  checkConfirmations(address, txid) {
    return new Promise(async (resolve, reject) => {
       try {
           const transaction = await this.getTransaction(address, txid);
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class ZNZModule {
    constructor() {
       this.explorerUrl = 'https://znzexplorer.nekosunevr.co.uk/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class PIVXModule {
    constructor() {
       this.explorerUrl = 'https://explorer.duddino.com/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class DOGEModule {
    constructor() {
       this.explorerUrl = 'https://doge.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class SAPPModule {
    constructor() {
       this.explorerUrl = 'https://sapp.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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


class DOGECModule {
    constructor() {
       this.explorerUrl = 'https://dogecexplorer.nekosunevr.co.uk/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class StripePay {
    constructor(auth) {
        this.strpeapikey = auth.stripeapikey;
    }

    createPayment(chargeData) {
      return new Promise(async (resolve, reject) => {;
          try {
             const stripe = new Stripe(this.strpeapikey);
             const session = await stripe.checkout.sessions.create(chargeData);
            // Redirect the user to the payment URL
            const jsondata = {
              item: chargeData.line_items[0].price_data.product_data.name,
              hosted_url: session.url,
              expires_at: session.expires_at,
              created_at: session.created,
              code: session.id,
              type: 'charge:created',
              attempt_number: 0
            }
            resolve(jsondata);
          } catch (error) {
            console.error('Error creating payment:', error);
            reject('Internal Server Error');
          }
      })
  }

  getPayment(event) {
      return new Promise(async (resolve, reject) => {

          if (event.type === 'payment_intent.created') {
            var jsonres = {
               status: "WAITING!"
            }
            resolve(jsonres) ;
          } else if (event.type === 'payment_intent.succeeded') {
            var jsonres = {
               status: "PENDING!!"
            }
            resolve(jsonres);
          } else if (event.type === 'charge.succeeded') {
            var jsonres = {
               status: "PENDING!!"
            }
            resolve(jsonres);
          } else if (event.type === 'checkout.session.completed') {
            const chargeId = event.data.object.id;
            const stripe = new Stripe(this.strpeapikey);
            // Check if the payment is verified
            stripe.checkout.sessions.retrieve(chargeId, (err, charge) => {
              if (err) {
                console.error('Error retrieving charge:', err);
                var jsonres = {
                    status: "Internal Server Error",
                    data: err
                }
                reject(jsonres);
                return;
              }

              if (charge.status === 'complete') {
                var jsonres = {
                    status: "ACCEPTED!"
                }
                resolve(jsonres);
              } else {
                 var jsonres = {
                    status: "DECLINED!"
                 }
                 resolve(jsonres);
              }
            });
          } else {
            var jsonres = {
               status: "DECLINED!"
            }
            resolve(jsonres) ;
          }
      })
  }
}

class MOBICModule {
    constructor() {
       this.explorerUrl = 'https://mobic.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class SAGAModule {
    constructor() {
       this.explorerUrl = 'https://saga.flitswallet.app//api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class PNYModule {
    constructor() {
       this.explorerUrl = 'https://pny.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class MONKModule {
    constructor() {
       this.explorerUrl = 'https://monk.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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


class UCRModule {
    constructor() {
       this.explorerUrl = 'https://ucr.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class KYANModule {
    constructor() {
       this.explorerUrl = 'https://kyan.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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


class DASHDModule {
    constructor() {
       this.explorerUrl = 'https://dashd.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class OWOModule {
    constructor() {
       this.explorerUrl = 'https://owo.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class SevenSevenSevenModule {
    constructor() {
       this.explorerUrl = 'https://777.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class CFLModule {
    constructor() {
       this.explorerUrl = 'https://cfl.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class BIRModule {
    constructor() {
       this.explorerUrl = 'https://bir.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class AZRModule {
    constructor() {
       this.explorerUrl = 'https://azr.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class BECNModule {
    constructor() {
       this.explorerUrl = 'https://becn.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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

class BTCModule {
    constructor() {
       this.explorerUrl = 'https://btc.flitswallet.app/api/v1/';
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
                 
                 if (matchFound) {
                    break; // Exit the outer loop
                 }

                 // Add a conditional check to skip continue; when matchFound is true
                 if (!matchFound) {
                   continue; // Continue processing the next transaction
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
exports.CoinBasePay = CoinBasePay;
exports.TebexPay = TebexPay;
exports.CraftingStorePay = CraftingStorePay;
exports.SellixPay = SellixPay;
exports.DOGECModule = DOGECModule;
exports.StripePay = StripePay;
exports.STEEMModule = STEEMModule;
exports.ZNZModule = ZNZModule;
exports.PIVXModule = PIVXModule;
exports.DOGEModule = DOGEModule;
exports.SAPPModule = SAPPModule;
exports.MOBICModule = MOBICModule;
exports.SAGAModule = SAGAModule;
exports.PNYModule = PNYModule;
exports.MONKModule = MONKModule;
exports.UCRModule = UCRModule;
exports.KYANModule = KYANModule;
exports.DASHDModule = DASHDModule;
exports.OWOModule = OWOModule;
exports.SevenSevenSevenModule = SevenSevenSevenModule;
exports.CFLModule = CFLModule;
exports.BIRModule = BIRModule;
exports.AZRModule = AZRModule;
exports.BECNModule = BECNModule;
exports.BTCModule = BTCModule;
