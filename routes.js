Router.configure({
   layoutTemplate: 'BaseLayout'
});

Router.route('/login', function () {
  if (Meteor.user()) {
  	this.redirect('/');
  } else {
  	this.render('login');
  }
});

Router.route('/create', function () {
    if (Meteor.user()) {
        this.render('create');
    } else {
        this.redirect('/login');
    }
});

Router.route('/groups', function () {
    if (Meteor.user()) {
        this.render('Groups');
    } else {
        this.redirect('/login');
    }
});

Router.route('/', function () {
  if (Meteor.user()) {
  	this.render('home');
  } else {
  	this.redirect('/login');
  }
});

Router.route('/purchase/:_id', function () {
  var purchase = Purchases.findOne({_id: this.params._id});
    this.render('ShowPurchase', {data: purchase});
  }, {
    name: 'purchase.show'
});

Router.route('/create/groups', function(){
  if (Meteor.user()){
      this.render('CreateGroup');
  }else{
      this.redirect('/login');
  }
})