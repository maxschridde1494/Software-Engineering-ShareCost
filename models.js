/*
===User Schema=== (this is a default Meteor Collection, fields specified here are added by the developers)
purchases: {created: [], invited: []}
groups: [group_id,...]

===Friend Schema===
_id: hash NOTE: this is our user _id
venmo_friends: [{user1}, {user2}]

===Groups Schema===
_id: hash
title: ""
description: ""
members: [venmo_id,...]
member_names: {venmo_id: name,...} NOTE: for display purposes


===Purchase Schema===
id: hash
title: “”
description: “”
creator: venmo_id
members: [venmo_id, ...] NOTE: must be at least 1 long
accepted: [venmo_id, ...]
rejected: [venmo_id, ...]
member_names: {venmo_id: name, ...} NOTE: for display purposes
paid: [venmo_id, ...]
cost: number
created_at: number
venmo_responses: { }  NOTE: should we have this?
messages: [message, ...]
*/

/*friendsDatabase = function() {
    return new Mongo.Collection("friends");
}

purchasesDatabase = function() {
    return new Mongo.Collection("purchases");
}

meteorUsers = function() {
    return Meteor.users
}

pendingDatabase = function() {
	return new Mongo.Collection("pending_users");
}

pendingPurchasesDatabase = function() {
	return new Mongo.Collection("pending_purchases");

groupsDatabase = function(){
    return new Mongo.Collection("groups");
}

Purchases = purchasesDatabase();
Friends = friendsDatabase();
Groups = groupsDatabase();
Users = meteorUsers();
PendingUsers = pendingDatabase();
PendingPurchases = pendingPurchasesDatabase();*/
Purchases = new Mongo.Collection("purchases");
Friends = new Mongo.Collection("friends");
Users = Meteor.users;
Groups = new Mongo.Collection("groups");
PendingUsers = new Mongo.Collection("pending_users");
PendingPurchases = new Mongo.Collection("pending_purchases");

if (Meteor.isServer) {
  /* Server publishes all purchases with current user as a member */
  Meteor.publish("purchases", function() {
    return Purchases.find();
  });

  Meteor.publish("userData", function () {
    if (this.userId) {
      return Users.find({_id: this.userId});
    } else {
      this.ready();
    }
  });

  Meteor.publish('friends', function () {
    if (this.userId){
      return Friends.find({_id: this.userId});
    } else {
      this.ready();
    }
    
  });

  Meteor.publish("pendingUsers", function () {
    this.ready();
  });

  Meteor.publish("pendingPurchases", function () {
    this.ready();
  });

  Meteor.publish("groups", function(){
    if (this.userId){
      return Groups.find();
    }else{
      this.ready();
    }
  });

  /* Helper for validating strings. min and max are inclusive.
   * Returns null if valid, an array of error messages if not. */
  var check_string = function(name, text, min, max) {
    var errors = [];
    if (typeof text != "string") {
      errors.push(name + " should be a string.");
    } else if (text.length < min) {
      errors.push(name + " should be more than " + min + " characters.");
    } else if (text.length > max) {
      errors.push(name + " should be less than " + max + " characters.");
    }
    return errors;
  }

  /* Methods for testing data validity */
  Meteor.methods({
    /* Checks that 'purchase' is valid.
     * Returns null if valid, an array of error messages if not. */
    'check_purchase': function(purchase) {
      var TITLE_MIN = 1;
      var TITLE_MAX = 64;
      var DESC_MIN = 0;
      var DESC_MAX = 256;
      var PURCH_MIN = 1;
      var PURCH_MAX = 10;
      var badSplitCost = false;

      var errors = [];
      errors = errors.concat(check_string("Title", purchase.title, TITLE_MIN, TITLE_MAX),
        check_string("Description", purchase.description, DESC_MIN, DESC_MAX));
      
      if (typeof purchase.cost != "number" || purchase.cost.toString() == "NaN") {
        errors.push("Cost should be a number.");
      }

      if (purchase.members.length < PURCH_MIN) {
        errors.push("There should be at least one invited friend.");
      } else if (purchase.members.length > PURCH_MAX) {
        errors.push("No more than 10 friends allowed.");
      }

      var sum = 0;
      for (var member in purchase.split) {
        if (isNaN(purchase.split[member])) {
          badSplitCost = true;
        }
        else if (purchase.split[member] < 0) {
          badSplitCost = true;
        }
        else {
          sum += purchase.split[member];
        }
      }
      if (badSplitCost) {
        errors.push("Cost should be a non-negative number.");
      }
      else if (sum < purchase.cost - 0.15 || sum > purchase.cost + 0.15) {
        errors.push("Specified costs do not add up.");
      }

      return errors;
    }
  });

}

if (Meteor.isClient) {
  /* Server publishes all purchases with current user as a member */
  Meteor.subscribe("purchases");
  Meteor.subscribe("userData");
  Meteor.subscribe("friends");
  Meteor.subscribe("pendingUsers");
  Meteor.subscribe("pendingPurchases");
  Meteor.subscribe("groups");
}
