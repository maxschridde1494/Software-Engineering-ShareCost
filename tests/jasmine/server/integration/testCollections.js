describe('Collections', function () {

  it('there are 0 current purchases', function () {
    Purchases.remove({});
    expect(Purchases.find().count()).toEqual(0);
  });

  it('there are no friends', function () {
    Friends.remove({});
  	expect(Friends.find().count()).toBe(0);
  });

  describe('valid purchase', function (){
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

    it('throws an error for invalid purchase', function (){
    	expect(function () { valid_purchase(purch)}).toThrow();
    });

    it('accepts a valid purchase', function (){
    	purch.accepted = ["You", "Him"];
    	expect(function () {
    		valid_purchase(purch)}).not.toThrow();
    });
    
  });

});
