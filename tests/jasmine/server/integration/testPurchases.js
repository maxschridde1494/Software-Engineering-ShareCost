"use strict";
describe("venmoFriends", function () {
    // Mock user information
    var user = {};
    user._id = "ycMSMjwJYdP9eJD4M";
    user.services = {};
    user.services.venmo = {};
    user.services.venmo.id = "You";
    user.services.venmo.profile_picture_url = "http://www.ihop.com/menus/main-menu/pancakes/-/media/ihop/MenuItems/Pancakes/Original%20Buttermilk%20Pancakes/Original_%20Buttermilk_Pancakes.png?mh=367";

    var response = {};
    response.data = {};
    response.data.data = {};
    response.data.data.payment = {};
    response.data.data.payment.staus = "settled";

    // Reset Purchases collection to a single document before each test
    beforeEach(function() {
        Purchases.remove({});
        var purch = {}
        purch._id = "1";
        purch.title = "Title";
        purch.description = "Description";
        purch.cost = 5;
        purch.creator = "Me";
        purch.members = ["You", "Him"];
        purch.accepted = [];
        purch.rejected = [];
        purch.paid = [];
        purch.created_at = new Date();
        purch.member_names = "temp";
        Purchases.insert(purch);

        // Mock the Meteor.user() response
        spyOn(Meteor, "user").and.callFake(function() {
            return user;
        });

        spyOn(Meteor, "call").and.callFake(function(args) {
            if (args == "accept_purchase") {
                Purchases.update("1", {$push: {accepted: Meteor.user().services.venmo.id}});
                if (Purchases.findOne("1").accepted.length == Purchases.findOne("1").members.length) {
                    Meteor.call("process_group_purchase", "1");
                }
            }
            else {
                return;
            }
        });
    });

    it("check user information", function() {
        expect(Meteor.user().services.venmo.profile_picture_url).toBe("http://www.ihop.com/menus/main-menu/pancakes/-/media/ihop/MenuItems/Pancakes/Original%20Buttermilk%20Pancakes/Original_%20Buttermilk_Pancakes.png?mh=367");
    });

    it("accept_purchase test without processing", function() {
        Meteor.call("accept_purchase", "1");
        expect(Purchases.findOne("1").accepted.length).toBe(1);
        expect(Purchases.findOne("1").rejected.length).toBe(0);
    });

    it("accept_purchase test with processing", function() {
        Meteor.call("accept_purchase", "1");
        user.services.venmo.id = "Him";
        Meteor.call("accept_purchase", "1");
        expect(Purchases.findOne("1").accepted.length).toBe(2);
        expect(Meteor.call).toHaveBeenCalledWith("process_group_purchase", "1");
    });
        
});
