export default class UserService {

  constructor(gapiLoaded, safeApply, $q, $rootScope, $state, ENV) {
    "ngInject";

    this.ENV = ENV;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.safeApply = safeApply;
    this.authDefered = $q.defer();
    this.authInitialized = false;
    this.isSignedIn = false;
    this._stateChangeBypass = false;
    this._loginState = 'loginPage';
    gapiLoaded().then(() => {
      gapi.load('auth2', this.initSigninV2.bind(this));
    });
    $rootScope.$on('$stateChangeStart', this.stateChange.bind(this));
  }

  stateChange(event, toState, toParams, fromState, fromParams, options) {
    if (this._stateChangeBypass ||
      (!toState.data || !toState.data.access || !toState.data.access.requiredLogin)) {
      this._stateChangeBypass = false;
      return;
    }
    event.preventDefault();

    this.authInitialize().then(() => {
      if (this.isLogged()) {
        this._stateChangeBypass = true;
        this.$state.go(toState, toParams);
      } else {
        this.$state.go(this._loginState);
      }
    });
  }

  initSigninV2() {
    gapi.auth2.init({
      client_id: this.ENV.GOOGLE.CLIENT_ID,
      scope: this.ENV.GOOGLE.SCOPE,
      fetch_basic_profile: true
    }).then((auth) => {
      this.authInstance = auth;
      this.googleUser = auth.currentUser.get();
      this.authInitialized = true;
      this.authInstance.isSignedIn.listen(this.signinChanged.bind(this));

      this.authDefered.resolve(true);
      // call $apply is a MUST because we are outside of angular
      this.safeApply();

      if (this.isLogged()) {
        this._finalizeLogin();
      }
      this.attachSignin(document.querySelectorAll('.customGPlusSignIn'));
    }, (reason) => {
      this.authDefered.reject(reason);
    });
  }

  signinChanged(signedIn) {
    var state = this.$state.current;

    if (!signedIn && (state.data && state.data.access && state.data.access.requiredLogin)) {
      this.$state.go('home');
    }
  }

  attachSignin(elements) {
    angular.forEach(elements, (element) => {
      this.authInstance.attachClickHandler(element, {}, (googleUser) => {
        this.googleUser = googleUser;
        this._finalizeLogin();
      }, function (error) {
        console.error(error);
      });
    });
  }

  isLogged() {
    return this.googleUser && this.googleUser.isSignedIn();
  }

  getUser() {
    if (this.isLogged())
      return this.googleUser.getBasicProfile();
  }

  getEmail() {
    if (this.isLogged())
      return this.googleUser.getBasicProfile().getEmail();
  }

  getName() {
    if (this.isLogged())
      return this.googleUser.getBasicProfile().getName();
  }

  getIdToken() {
    if (this.isLogged())
      return this.googleUser.getAuthResponse().id_token;
  }

  logout() {
    this.authInstance.signOut().then(() => {
      this.isSignedIn = false;
      this.safeApply();
    })
  }

  _finalizeLogin() {
    this.isSignedIn = true;
    this.safeApply();
  }

  authInitialize() {
    return this.authDefered.promise;
  }

}