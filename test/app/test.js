'use strict';

var server;
    /**
     * StubAPI creates a stub server script for
     * testing.
     *
     *@param {String} fixturePath - Path for type of request (get or put)
     *@returns {Object} fixture - JSON Object that was requested from the DB.
     *
     */

var stubAPI = function(fixturePath) {
  var fixture = __fixture('http/' + fixturePath);
  var responseBody = JSON.stringify(fixture.response.json);
  // respondWith is not causing anything to respond RIHGT NOW.
  // it would have been better named server.respondWhenARequestIsMadeFor,
  // but everyone would have hated the person who gave that long of a name.
  server.respondWith(fixture.request.method, fixture.request.url,
    [200, { 'Content-Type': 'application/json' }, responseBody]);
  return fixture;
};

describe('app', function() {
  beforeEach(function() {
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  afterEach(function() {
    server.restore();
  });

  beforeEach(function() {
    App.reset();
  });

  it('has an index page', function() {
    visit('/');
    andThen(function() {
      expect(currentRouteName()).to.equal('index');
    });
  });
  it('will have a home link', function(){
    visit('/');
    andThen(function(){
      expect(find('a.home').length).to.equal(1);
    });
  });
  it('will have a signup link ', function(){
    visit('/');
    andThen(function(){
      expect(find('a.signup').length).to.equal(1);
    });
  });
  it('will have a login link', function(){
    visit('/');
    andThen(function(){
      expect(find('a.login').length).to.equal(1);
    });
  });

  // ----------------------------------------------------

  describe('when signed in', function() {
    beforeEach(function() {
      // log in a fake user
      var container = applicationContainer();
      var session = container.lookup('auth-session:main');
      session.set('content', {
        id: 1,
        username: 'fake-username',
        token: 'fake-token'
      });
    });

    it('allows client to update their profile', function() {

      var putFixture = stubAPI('users/put');
      var getFixture = stubAPI('users/get');
      var nameBody = putFixture.request.json.user.visibleName;
      var email = putFixture.request.json.user.user_email;

      visit('/profile');

      andThen(function(){
        var getRequest = server.requests[0];
        expect(getRequest.url).to.eql(getFixture.request.url);
        expect(getRequest.method).to.eql(getFixture.request.method);
      });

      fillIn('input.visibleName', nameBody);
      fillIn('input.user_email', email);
      click('button.submit.updateUserProfile');

      andThen(function(){
        var putRequest = server.requests[1];
        var putJSON = JSON.parse(putRequest.requestBody);
        expect(putRequest.url).to.eql(putFixture.request.url);
        expect(putRequest.method).to.eql(putFixture.request.method);
        expect(putJSON).to.eql(putFixture.request.json);
        expect(server.requests.length).to.eql(2);
      });
    });

    // -------------------------------------------------------------

    describe('when visiting their profile', function() {
      beforeEach(function() {
        stubAPI('users/get-full-profile-info');
        visit('/profile');
      });

      it('fills in the user name', function() {
        expect(find('input.username').val()).to.eql('rramone');
      });

      it('fills in the visibleName', function() {
        expect(find('input.visibleName').val()).to.eql('Adventure Pig');
      });

      it('fills in the user_email', function() {
        expect(find('input.user_email').val()).to.eql('ramone@gmail.com');
      });

      it('fills in the user interests', function() {
        expect(find('input.interests').val()).to.eql('carrots, lettuce, obstacle courses');
      });

      it('fills in the user bio', function() {
        expect(find('input.bio').val()).to.eql('my bio');
      });

    });

    // -------------------------------------------------------------

    describe('when visiting their profile', function() {
      beforeEach(function() {
        stubAPI('users/get-full-profile-info');
        visit('/profile');
      });

      it('has a profile page', function() {
        expect(currentRouteName()).to.equal('profile');
      });

      it('will have a home link', function(){
        expect(find('a.home').length).to.equal(1);
      });

      it('will have a logout link', function(){
        expect(find('a.logout').length).to.equal(1);
      });

      it('will have a cityHackers link', function(){
        expect(find('a.users').length).to.equal(1);
      });

      it('will have a profile link', function(){
        expect(find('a.profile').length).to.equal(1);
      });

      it('will NOT have a login link', function(){
        expect(find('a.login').length).to.equal(0);
      });

      it('will NOT have a signup link', function(){
        expect(find('a.signup').length).to.equal(0);
      });

      //---------------------------------------------------------

      it('will display Name as part of user info', function(){
        expect(find('input.visibleName').length).to.equal(1);
      });

      it('will display User Name as part of user info', function(){
        expect(find('input.username').length).to.equal(1);
      });

      it('will display email as part of user info', function(){
        expect(find('input.user_email').length).to.equal(1);
      });

      it('will display Interests as part of user info', function(){
        expect(find('input.interests').length).to.equal(1);
      });
    });

    //---------------------------------------------------------
    describe('when visiting the cityhackers', function() {
      beforeEach(function() {
        stubAPI('users/users');
        visit('/cityhackers');
      });

      it('has a cityhackers page', function() {
        expect(currentRouteName()).to.equal('users');
      });

      // TODO: when kali finishes showing all users, this should pass. it may need
      // to be tweaked slightly (like different css selectors).
      it.skip('has a list of users', function(){
        expect(find('ul li').length).to.equal(6);
      });

      //click('button.submit.addFriend' for user steve);
      andThen(function(){
        // get request for friendship steve's recipientUser key will equal 1
        expect().to.equal();
      });

      //---------------------------------------------------------

    });
  });
});
