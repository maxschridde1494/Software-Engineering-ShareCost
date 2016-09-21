/* General server code */

Meteor.startup(function () {

	if (process.env.NODE_ENV === "development"){
		var clientId = Meteor.settings.VENMO.DEV.CLIENT_ID;
		var secret = Meteor.settings.VENMO.DEV.SECRET;
	} else {
		var clientId = Meteor.settings.VENMO.PROD.CLIENT_ID;
		var secret = Meteor.settings.VENMO.PROD.SECRET;
	}

	ServiceConfiguration.configurations.remove({
		service: "venmo"
	});

	ServiceConfiguration.configurations.insert({
		service: "venmo",
		clientId: clientId,
		scope: "access_profile+access_friends+make_payments",
		secret: secret
	});

});
