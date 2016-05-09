import misc from '../../config/misc';

export default class UserService {

  constructor(gapiLoaded, safeApply, $q) {
    "ngInject";

    this.safeApply = safeApply;
    this.authDefered = $q.defer();
    gapiLoaded().then(() => {
      gapi.load('auth2', this.initSigninV2.bind(this));
    });
    this.isSignedIn = false;
  }

  initSigninV2() {
    gapi.auth2.init({
      client_id: misc.google.client_id,
      scope: misc.google.scope,
      fetch_basic_profile: true
    }).then((auth) => {
      this.authDefered.resolve(true);
      // call $apply is a MUST because we are outside of angular
      this.safeApply();

      this.authInstance = auth;
      this.googleUser = auth.currentUser.get();
      if (this.isLogged()) {
        this._finalizeLogin();
      }
      this.attachSignin(document.getElementById('customGglBtn'));
    });
  }

  attachSignin(element) {
    this.authInstance.attachClickHandler(element, {},(googleUser) => {
        this.googleUser = googleUser;
        this._finalizeLogin();
        console.log('googleUser!', googleUser);
      }, function (error) {
        console.error(error);
      });
  }

  getUser() {
    if (this.authInstance)
      return this.googleUser.getBasicProfile();
  }

  isLogged() {
    return this.googleUser && this.googleUser.isSignedIn();
  }

  getEmail() {
    if (this.authInstance)
      return this.googleUser.getBasicProfile().getEmail();
  }

  getName() {
    if (this.authInstance)
      return this.googleUser.getBasicProfile().getName();
  }

  getIdToken() {
    if (this.authInstance)
      return this.googleUser.getAuthResponse().id_token;
  }

  logout() {
      this.authInstance.signOut().then(() => {
        this.isSignedIn = false;
        this.safeApply();
      })
  }

  _finalizeLogin() {
    document.getElementById('name').innerText = this.getName();
    this.isSignedIn = true;
    this.safeApply();
  }

  authInitialize() {
      return this.authDefered.promise;
  }

}
