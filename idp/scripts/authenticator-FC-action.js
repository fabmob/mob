/**
 * Available variables:
 * script - this current script (ScriptModel.java)
 * user - the current user (UserModel.java)
 * realm - the current realm (RealmModel.java)
 * session - the current KeycloakSession (KeycloakSession.java)
 * authenticationSession - the current authenticationSession (AuthenticationSessionModel.java)
 * httpRequest - the current http request (org.jboss.resteasy.spi.HttpRequest)
 * LOG - Logger (org.jboss.logging.Logger scoped to ScriptBasedAuthenticator)
 * 
 * voir KC 16.1 doc (https://www.keycloak.org/docs/16.1/server_development/#_script_providers)
 */

/**
 * CONST
 */
var ArrayList = Java.type("java.util.ArrayList");

/**
 * Mandatory Authenticate function to launch the script
 * context.success() needs to be called to finish process
 * context.failure(param) can be called to reject current authentication process
 * @param context 
 */
function authenticate(context) {
  LOG.info("#####################################################################################");
  LOG.info("SCRIPT name=" + script.getName() + "; description=" + script.getDescription() + "; realmId=" + script.getRealmId());

  
  // Add term and condition action to citizen
  user.addRequiredAction('terms_and_conditions');

  context.success();
}
