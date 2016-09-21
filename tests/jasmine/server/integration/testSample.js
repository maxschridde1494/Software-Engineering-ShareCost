var user1 = new TestUser('asdfasdf', 'user1', '1', 'http://www.mysticpizza.com/admin/resources/pizza-pepperoni-w857h456.jpg');
var user2 = new TestUser('asdfasdf2', 'user2', '2', 'http://5tim.com/wp-content/uploads/2011/05/hamburger.jpg');
var user3 = new TestUser('asdfasdf3', 'user3', '3', 'https://www.berksfoods.com/wp-content/uploads/2014/02/ph_home_1.png');
user1.addFriends(user2.services.venmo);
user2.addFriends(user1.services.venmo);
user1.addFriends(user3.services.venmo);
user3.addFriends(user1.services.venmo);

describe("friends test", function() {

    sharedSetup();
    beforeEach(function(done) {
        login(user1);
        Users.insert(user1);
        Meteor.call('after_login', function(error, result) {
            done();
        });
    });

    it("verify friends initialization", function() {
        expect(get_friends).toHaveBeenCalled();
        expect(Meteor.userId()).toBe("asdfasdf");
        expect(Friends.findOne(Meteor.userId()).venmo_friends.length).toBe(2);
    });

});

describe("payment tests", function() {
    var payment;

    sharedSetup();
    beforeEach(function(done) {
        login(user1);
        Users.insert(user1);
        Meteor.call('after_login', function(error, result) {
            Meteor.call('user_pay_user', Meteor.userId(), user2.services.venmo.id, 1, function(error, result) {
                payment = result;
                done();
            });
        });
    });

    it("verify payment", function() {
        expect(payment.data.data.payment.status).toEqual('settled');
    });

});

describe("payment tests", function() {

    sharedSetup();

    it("verify payment fails without a user logged in", function() {
        logout();
        expect(function () { Meteor.call('user_pay_user', Meteor.userId(), user2.services.venmo.id, 1) }).toThrow();
    });
});
