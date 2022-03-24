import { Restivus } from "meteor/maka:rest";
// Global API configuration
let Api = new Restivus({
  apipath: "api/",
  version: "v1",
  useDefaultAuth: true,
  prettyJson: true,
  enableCors: true,
  onLoggedIn: function () {
    console.log(this.user.username + " (" + this.userId + ") logged in");
  },
  onLoggedOut: function () {
    console.log(this.user.username + " (" + this.userId + ") logged out");
  },
});
export default Api;
