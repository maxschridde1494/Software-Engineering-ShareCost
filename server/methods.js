/* Meteor methods to load early*/

if (Meteor.isServer){

	/* Divides total by n. The result is the floor-divided
	 * cost to be split between invited members. At this point,
	 * the creator is expected to pick up the possible remainder of cents. */
	var split_cost = function(total, n) {
		return Number((Math.floor((total * 100) / n) / 100).toFixed(2));
	}

	/* Checks if the user with 'venmo_id' can vote on 'purchase.' */
	var valid_vote = function(venmo_id, purchase) {
		/* Checking membership */
		if (purchase.members.indexOf(venmo_id) == -1) {
			throw new Meteor.Error("Error, attempt to vote on a purchase that doesn't involve the logged-in user.");
		}
		/* Checking that user hasn't already accepted purchase. */
		if (purchase.accepted.indexOf(venmo_id) != -1) {
			throw new Meteor.Error("Error, attempt to vote on a purchase that the user already accepted.");
		}
		/* Checking that user hasn't already rejected purchase. */
		if (purchase.rejected.indexOf(venmo_id) != -1) {
			throw new Meteor.Error("Error, attempt to vote on a purchase that the user already rejected.");
		}
	}

	/* Checks if 'purchase' is ready to be processed (unanimous vote in favor). */
	valid_purchase = function(purchase) {
		if (purchase.rejected.length > 0) {
			throw new Meteor.Error("Can't process this purchase, somebody rejected it.");
		}
		if (purchase.accepted.length < purchase.members.length) {
			throw new Meteor.Error("Can't process a purchase until everyone has voted in favor of it.");
		}
	}

	get_friends = function(venmo_id, access) {
		var url = "https://api.venmo.com/v1/users/" + venmo_id + "/friends";
		var result = HTTP.get(url, {"params": {"access_token": access, "limit": 2000}});
		return result.data.data;
	}

	pay = function(url, access, venmo_id, amount) {
		var result = HTTP.post(url,
			{params: {access_token: access,
				user_id: venmo_id,
				note: Math.random().toString(),
				amount: amount}});
		return result;
	}

	Meteor.methods({
		/* Retrieves the current user's venmo friends. Currently only makes one GET request
		 * for a maximum of 2000 friends. We might need to account for pagination. */
		'get_venmo_friends': function() {
			this.unblock(); //allows other Methods to run, since I'm doing HTTP.get() synchronously
			var user = Meteor.user();
			if (!user) {
				throw new Meteor.Error("Couldn't retrieve Venmo friends; user is not logged in.");
			}
			var venmo_id = user.services.venmo.id;
			var access = user.services.venmo.accessToken;
			try {
				return get_friends(venmo_id, access);
			} catch (e) {
				console.log(e);
				throw new Meteor.Error("Error with GET");
			}
		},
		/* Performs some additional setup after the user logs in,
		 * including updating the user's friend list. */
		'after_login': function() {
			/* Update the user's friend list */
			Meteor.call('get_venmo_friends', function(err, res) {
				if (err) {
					throw new Meteor.Error("Unable to retrieve Venmo friends.");
				}
				Friends.upsert(Meteor.userId(), {$set: {'venmo_friends': res}});
			});
			/* If the user doesn't have the purchases field, add it.
			 * This is fired each time the user logs in, maybe there's a 
			 * better way to do this? The venmo-oauth package seems to 
			 * take care of user creation for us, so I'm not sure. */
			if (Meteor.user().purchases == undefined) {
				Users.update(Meteor.userId(), {$set: {purchases: {created: [], invited: []}}});
			};
			/*same as above, but just with the groups field*/
			if (Meteor.user().groups == undefined){
				Users.update(Meteor.userId(), {$set: {groups: []}});
			}
			var venmo_id = Meteor.user().services.venmo.id;
			var userPending = PendingUsers.findOne(venmo_id);
			if (userPending != null) {
				for (i = 0; i < userPending.purchases.length; i++) {
					PendingPurchases.upsert(userPending.purchases[i], {$pull: {"pending_members" : venmo_id}});
					var current_purchase = PendingPurchases.findOne(userPending.purchases[i]);
					if (current_purchase.pending_members.length == 0) {
						var pid = Purchases.insert(current_purchase.purchase);
						PendingPurchases.remove(userPending.purchases[i]);
						Meteor.call("send_purchase", pid, current_purchase.purchase, function(error, result) {
							var creator = Users.findOne({'services.venmo.id': current_purchase.purchase.creator});
							Meteor.call("own_purchase", pid, creator);
						});
					}
				}
				PendingUsers.remove(venmo_id);
			}
		},
		/* Makes a Venmo payment of 'amount' from srcUser (app ID) to dstVenmo (venmo ID). */
		'user_pay_user': function(srcUser, dstVenmo, amount) {
			this.unblock(); //allows other Methods to run, since we're doing HTTP.post() synchronously
			var user = Users.findOne(srcUser);
			if (!user) {
				throw new Meteor.Error(403, "Invalid user");
			}
			var venmo_id = dstVenmo;
			var access = user.services.venmo.accessToken;
			var url = "https://api.venmo.com/v1/payments";
			try {
				return pay(url, access, venmo_id, amount);
			} catch (e) {
				console.log(e);
				throw new Meteor.Error("Error with POST");
			}
		},
		/* Makes a Venmo payment of 'amount' from the current user to 'venmoId'. */
		'pay_user': function(venmoId, amount){
			this.unblock(); //allows other Methods to run, since we're doing HTTP.post() synchronously
			return Meteor.call("user_pay_user", Meteor.userId(), venmoId, amount);
		},
		/* Converts a list of venmo ids into a list of respective app ids.
		 * Throws an error if any of the venmo members aren't signed up for the app. */
		'venmo_ids_to_ids': function(vids) {
			var result = [];
			var pending = [];
			vids.forEach(function(vid) {
				var user = Users.findOne({'services.venmo.id': vid});
				if (!user) {
					pending.push(vid);
				}
				else {
					result.push(user._id);
				}
			});
			return [result, pending];
		},
		/* Adds a purchase id to each app user (according to their venmo id).
		 * Uses venmo_ids_to_ids as a helper.
		 * Throws an error (via helper) if any of the venmo members aren't signed up for the app.  */
		'send_purchase': function(pid, vids) {
			// changed vids from purch.members to purch (alex)
			var v_ids = Meteor.call("venmo_ids_to_ids", vids.members);
			var ids = v_ids[0];
			if (v_ids[1].length == 0) {
				Users.update({_id: {$in: ids}}, {$push: {'purchases.invited': pid}});
			}
			return v_ids[1];
		},
		/* Adds a purchase id to the current user's purchase.created.
		 * I made this because Meteor won't let me do it client-side. */
		'own_purchase': function(pid, owner) {
			Users.update(owner, {$push: {'purchases.created': pid}});
		},
		/*add a group to a user's groups field. pass in group id as argument and array of venmo_ids in group*/
		'add_group': function(gid, vids){
			var all_ids = Meteor.call("venmo_ids_to_ids", vids);
			if (all_ids[1].length != 0) {
				throw new Meteor.Error("Some people aren't in ShareCost");
			}
			var ids = all_ids[0];
			ids.forEach(function(sid){
				Users.update({_id: sid}, {$push:{'groups': gid}});
			});
			return ids;
		},
		/* given a list of members venmoIDs, ensure no group with same members exists.
		*  use first group member to check against the groups that they are included in */
		'check_group_exists': function(vids){
			var len = vids.length;
			var memberVID = vids[0];
			var member = Users.findOne({'services.venmo.id': memberVID});
			var memberGIDs = member.groups;
			var exists = false;
			memberGIDs.forEach(function(gid){
				var group = Groups.findOne({_id: gid});
				var groupVIDs = group.members
				if (groupVIDs.length == len){
					var sum = 0;
					groupVIDs.forEach(function(vid){
						var counter = 0;
						while (counter <= len - 1){
							if (vids[counter] == vid){
								sum++;
							}
							counter++;
						}
					});
					if (sum == len){
						exists = true;
					}
				}
			});
			return exists;
		},
		/* Called once a purchase has been unanimously approved, and attempts to
		 * process all payments at once. Checks if members have already paid,
		 * so can hypothetically be called more than once. */
		'process_group_purchase': function(purchase_id) {
			var purchase = Purchases.findOne(purchase_id);
			valid_purchase(purchase);
			/* Splitting cost, keeping track of it with array instead */
			//var split = split_cost(purchase.cost, purchase.members.length + 1);
			purchase.members.forEach(function(venmo_id){
				if (purchase.paid.indexOf(venmo_id) != -1) {
					return;
				}
				/* Need app id, since that's what "user_pay_user" takes for the payer. */
				var id = Users.findOne({'services.venmo.id': venmo_id})._id;
				var response = Meteor.call("user_pay_user", id, purchase.creator, purchase.split[venmo_id]);
				if (response.data.data.payment.status == "settled") {
					Purchases.update(purchase_id, {$push: {paid: venmo_id}})
				}
			});

		},
		'accept_purchase': function(purchase_id) {
			var purchase = Purchases.findOne(purchase_id);
			var venmo_id = Meteor.user().services.venmo.id;
			valid_vote(venmo_id, purchase);
			Purchases.update(purchase_id, {$push: {accepted: venmo_id}});
			/* Process payment if there has been unanimous acceptance. */
			var purchase = Purchases.findOne(purchase_id);
			if (purchase.accepted.length == purchase.members.length) {
				Meteor.call("process_group_purchase", purchase_id);
			}
		},
		'reject_purchase': function(purchase_id) {
			var purchase = Purchases.findOne(purchase_id);
			var venmo_id = Meteor.user().services.venmo.id;
			valid_vote(venmo_id, purchase);
			Purchases.update(purchase_id, {$push: {rejected: venmo_id}});
		},
		'pay_sandbox': function(){
			var user = Meteor.user();
			if (!user) {
				throw new Meteor.Error("Couldn't retrieve Venmo friends; user is not logged in.");
			}
			var venmo_id = "145434160922624933";
			var access = user.services.venmo.accessToken;
			var url = "https://sandbox-api.venmo.com/v1/payments";
			var req = HTTP.call("POST", url, 
								{params: {access_token: access, user_id: venmo_id, note: "test", amount: 0.1}},
								function(error, result){
									if(error){
										console.log(error);
										throw new Meteor.Error("Error with POST");
									} else {
										console.log(result);
										return result;
									}
								});

		}

	});
}
