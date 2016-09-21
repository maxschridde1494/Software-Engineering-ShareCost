describe("Route tests", function() {
    beforeEach(waitForRouter);

    describe("correctly take to login route", function(){
        var toReturn = 0;

        beforeEach(function (done) {
            spyOn(Meteor, "user").and.callFake(function() {
                return toReturn;
            });
            Router.go("/create");
            Tracker.afterFlush(done);
        });

        it("only show login screen before logging in", function() {
            expect(Router.current().route.getName()).toEqual("login");
            toReturn = 0;
        });

        it("upon logout, redirect once again to login", function() {
            expect(Router.current().route.getName()).toEqual("login");
        });
    });

    describe("takes to correct create route if logged in", function(){
        toReturn = 5;

        beforeEach(function (done) {
            spyOn(Meteor, "user").and.callFake(function() {
                return toReturn;
            });
            Router.go("/create");
            Tracker.afterFlush(done);
        });

        it("after logging in, taken to create page", function() {
            expect(Router.current().route.getName()).toEqual("create");
        });

    });

    describe("takes to correct home route if logged in", function(){
        toReturn = 5;

        beforeEach(function (done) {
            spyOn(Meteor, "user").and.callFake(function() {
                return toReturn;
            });
            Router.go("/");
            Tracker.afterFlush(done);
        });

        it("after logging in, taken to create page", function() {
            expect(Router.current().route.path()).toEqual("/");
        });

    });

});
