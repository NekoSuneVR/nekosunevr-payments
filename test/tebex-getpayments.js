const {TebexPay} = require("../lib/index.js")

const tebexpay = new TebexPay({
	tebexapikey: ""
})

tebexpay.getPlayerLookup("NekoSuneVR").then(data => {
   console.log(data);
})