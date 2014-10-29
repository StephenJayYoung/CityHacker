'use strict';

var server;

describe('app', function() {
  before(function() { // before all tests, not each test
    server = sinon.fakeServer.create();
    server.autoRespond = true;
  });

  after(function() {
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

  describe('when signed in', function() {
    beforeEach(function() {
      // log in a fake user
      var container = applicationContainer();
      var session = container.lookup('auth-session:main');
      session.set('content', {
        username: 'fake-username',
        token: 'fake-token'
      });
    });

    it('allows user to create handle for their profile', function() {
      var nameBody = 'Fake Name';
      var responseJSON = {
        visibleName: {
          id: 1,
          body: nameBody
        }
      };
      var responseBody = JSON.stringify(responseJSON);

      // respondWith is not causing anything to respond RIHGT NOW.
      // it would have been better named server.respondWhenARequestIsMadeFor,
      // but everyone would have hated the person who gave that long of a name.
      server.respondWith('POST', '/api/comments',
        [200, { 'Content-Type': 'application/json' }, responseBody]);

      visit('/profile');
      fillIn('input.visibleName', nameBody);
      click('button.submit');

      andThen(function(){
        var requestBody = server.requests[0].requestBody;
        var requestJSON = JSON.parse(requestBody);
        expect(requestJSON).to.eql({
          visibleName: {
            // when the client made a request, it didn't have an id. it was a
            // new object, so it couldn't have an id yet. the server is
            // responsible for assigning ids. so we send it without one, and
            // the server does its thing & responds eventually with an id.
            // when we implement our server, we should do that same stuff.
            body: nameBody
          }
        });
        expect(server.requests.length).to.eql(1);

        // TODO: add more good expectations. for instance:
        // that you ended up on another page
        // that some content appeared somewhere
        // expect(currentURL()).to.equal('/profile');
        // expect(comment).to.equal('fakecomment');
      });
    });



  //This was an error test for adding comments
    // it.skip('shows an error when the server fails to respond to commenting properly', function() {
    //   var commentBody = 'fakecomment';
    //   var responseJSON = {
    //     error: {
    //       message: 'Terrible error!'
    //     }
    //   };
    //   var responseBody = JSON.stringify(responseJSON);
    //   server.respondWith('POST', '/api/comments',
    //     [400, { 'Content-Type': 'application/json' }, responseBody]);

    //   visit('/profile');
    //   fillIn('input.comment', commentBody);
    //   click('button.submit');
    //   andThen(function(){
    //     expect(find('.error').text()).to.eql('Terrible error!');
    //   });
    // });

  });
});
