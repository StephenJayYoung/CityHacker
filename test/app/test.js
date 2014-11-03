'use strict';

var server;

var mockAPI = function(fixturePath) {
  var fixture = __fixture('http/' + fixturePath);
  // console.log(JSON.stringify(fixture, undefined, 2));
  var responseBody = JSON.stringify(fixture.response.json);

  // respondWith is not causing anything to respond RIHGT NOW.
  // it would have been better named server.respondWhenARequestIsMadeFor,
  // but everyone would have hated the person who gave that long of a name.
  server.respondWith(fixture.request.method, fixture.request.url,
    [200, { 'Content-Type': 'application/json' }, responseBody]);
  return fixture;
};

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

      var putFixture = mockAPI('users/put');
      var getFixture = mockAPI('users/get');
      var nameBody = putFixture.request.json.user.visibleName;

      visit('/profile');

      andThen(function(){
        var getRequest = server.requests[0];
        expect(getRequest.url).to.eql(getFixture.request.url);
        expect(getRequest.method).to.eql(getFixture.request.method);
      });

      fillIn('input.visibleName', nameBody);
      click('button.submit');

      andThen(function(){
        var putRequest = server.requests[1];
        var putJSON = JSON.parse(putRequest.requestBody);
        expect(putRequest.url).to.eql(putFixture.request.url);
        expect(putRequest.method).to.eql(putFixture.request.method);
        expect(putJSON).to.eql(putFixture.request.json);
        expect(server.requests.length).to.eql(2);

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
