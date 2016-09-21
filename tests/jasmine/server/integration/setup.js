TestUser = function(meteor_id, name, venmo_id, profile_picture) {
	this._id = meteor_id;
	this.friends = [];
	this.services = {};
	this.services.venmo = {};
	this.services.venmo.display_name = name;
	this.services.venmo.id = venmo_id;
	this.services.venmo.accessToken = '32ad442';
};
TestUser.prototype.addFriends = function(friend) {
	this.friends.push(friend);
};
login = function(user) {
	spyOn(Meteor, 'user').and.returnValue(user);
	spyOn(Meteor, 'userId').and.returnValue(user._id);
	get_friends = jasmine.createSpy().and.returnValue(user.friends);
	pay = jasmine.createSpy().and.returnValue({'data': {'data': {'payment': { 'status': 'settled'}}}});
};
logout = function() {
	spyOn(Meteor, 'user').and.returnValue(null);
	spyOn(Meteor, 'userId').and.returnValue(null);
};
sharedSetup = function() {
	beforeEach(function() {
		Purchases.remove({});
		Friends.remove({});
		Users.remove({});
		PendingUsers.remove({});
		PendingPurchases.remove({});
	});
};
