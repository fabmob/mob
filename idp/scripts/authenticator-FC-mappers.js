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
var SerializedBrokeredIdentityContext = Java.type("org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext");

/**
 * Function helper to transform mapped attributes to CMS object
 * @param value : result of broker context data UserInfo
 */
function createCMSAttribute(value) {
  var newAttribute = new ArrayList()
  newAttribute.add(JSON.stringify({
    value: value,
    source: 'franceconnect.gouv.fr',
    certificationDate: new Date()
  }))
  return newAttribute
}

/**
 * Mandatory Authenticate function to launch the script
 * context.success() needs to be called to finish process
 * context.failure(param) can be called to reject current authentication process
 * @param context 
 */
function authenticate(context) {
  LOG.info("#####################################################################################");
  LOG.info("SCRIPT name=" + script.getName() + "; description=" + script.getDescription() + "; realmId=" + script.getRealmId());

  var authSession = context.getAuthenticationSession();

  // Reuse KC functions from AbstractIdpAuthenticator.java to get Broker informations
  var serializedCtx = SerializedBrokeredIdentityContext.readFromAuthenticationSession(authSession, "BROKERED_CONTEXT");

  var brokerContext = serializedCtx.deserialize(context.getSession(), authSession);

  var userInfoFromBroker = JSON.parse(brokerContext.getContextData().UserInfo);

  // Set Identity CMS attributes
  if (!user.getAttribute("identity.lastName").length) {
    user.setAttribute("identity.lastName", createCMSAttribute(userInfoFromBroker.family_name))
  }
  if (!user.getAttribute("identity.firstName").length) {
    user.setAttribute("identity.firstName", createCMSAttribute(userInfoFromBroker.given_name))
  }
  if (!user.getAttribute("identity.gender").length) {
    user.setAttribute("identity.gender", createCMSAttribute(userInfoFromBroker.gender === "male" ? 1 : 2))
  }
  if (!user.getAttribute("identity.birthDate").length) {
    user.setAttribute("identity.birthDate", createCMSAttribute(userInfoFromBroker.birthdate))
  }
  if (!user.getAttribute("identity.birthPlace").length) {
    user.setAttribute("identity.birthPlace", createCMSAttribute(userInfoFromBroker.birthplace))
  }
  if (!user.getAttribute("identity.birthCountry").length) {
    user.setAttribute("identity.birthCountry", createCMSAttribute(userInfoFromBroker.birthcountry))
  }
  // Set Professional Information CMS attributes
  if (!user.getAttribute("personalInformation.email").length) {
    user.setAttribute("personalInformation.email", createCMSAttribute(userInfoFromBroker.email))
  }

  //Set updated At attribute
  var updatedAt = new ArrayList();
  updatedAt.add(JSON.stringify(Date.now()));
  user.setAttribute("updatedAt", updatedAt);

  context.success();
}
