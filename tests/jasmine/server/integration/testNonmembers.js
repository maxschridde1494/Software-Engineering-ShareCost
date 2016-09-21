describe('Nonmembers', function() {
    sharedSetup();
    it('Nonmember invite goes to puserTest and ppurchaseTest', function() {
        var user1 = new TestUser('az423', 'alex', 'alexma45', 'www.google.com');
        var user2 = new TestUser('ab422', 'alex2', 'alexma94', 'www.gmail.com');
        user1.addFriends(user2.services.venmo);
        user2.addFriends(user1.services.venmo);
        login(user1);
        expect(Meteor.user()).toBe(user1);
    });
});
