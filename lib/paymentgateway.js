const fetch = require('node-fetch');
const SHA256 = require("crypto-js/sha256");
const commerce = require('coinbase-commerce-node');
class TebexPay {
    constructor(auth) {
        this.tebexapikey = auth.tebexapikey;
    }

    getTransaction(transactionId) {
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
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

exports.CoinBasePay = CoinBasePay;
exports.TebexPay = TebexPay;
exports.CraftingStorePay = CraftingStorePay;
exports.SellixPay = SellixPay;
exports.G2APay = G2APay;
