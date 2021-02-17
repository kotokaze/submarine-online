const secret = require("./secret");

module.exports = {

	twitter: {
		consumerKey: secret.twitter.consumerKey || process.env.consumerKey,
		consumerSecret: secret.twitter.consumerSecret || process.env.consumerSecret,
		callbackURL: '/oauth_callback'
	},

	ipAddress: secret.ipAddress || process.env.ipAddress
};
