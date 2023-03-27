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
var SerializedBrokeredIdentityContext = Java.type(
  "org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext"
);

/**
 * Function helper to transform mapped attributes to CMS object
 * @param value : result of broker context data UserInfo
 * @param attribute : user attribute
 */
function createCMSAttribute(value, attribute) {
  var newAttribute = new ArrayList();
  switch (attribute) {
    case "identity.birthPlace":
      newAttribute.add(
        JSON.stringify({
          inseeValue: value,
          name: "",
          source: "franceconnect.gouv.fr",
          certificationDate: new Date(),
        })
      );
      break;
    case "identity.birthCountry":
      newAttribute.add(
        JSON.stringify({
          value: value,
          isoValue: "",
          source: "franceconnect.gouv.fr",
          certificationDate: new Date(),
        })
      );
      break;
    case "tos1":
      newAttribute.add(value);
      break;
    case "tos2":
      newAttribute.add(value);
      break;
    default:
      newAttribute.add(
        JSON.stringify({
          value: value,
          source: "franceconnect.gouv.fr",
          certificationDate: new Date(),
        })
      );
      break;
  }
  return newAttribute;
}

/**
 * Function helper to set attributes
 * @param user : user to modify
 * @param value : result of broker context data UserInfo
 * @param attribute : user attribute
 */
function setAttributeIfNotSet(user, attribute, value) {
  if (!user.getAttribute(attribute).length) {
    user.setAttribute(attribute, createCMSAttribute(value, attribute));
  }
}

/**
 * Mandatory Authenticate function to launch the script
 * context.success() needs to be called to finish process
 * context.failure(param) can be called to reject current authentication process
 * @param context
 */
function authenticate(context) {
  LOG.info(
    "#####################################################################################"
  );
  LOG.info(
    "SCRIPT name=" +
      script.getName() +
      "; description=" +
      script.getDescription() +
      "; realmId=" +
      script.getRealmId()
  );

  var authSession = context.getAuthenticationSession();

  // Reuse KC functions from AbstractIdpAuthenticator.java to get Broker informations
  var serializedCtx =
    SerializedBrokeredIdentityContext.readFromAuthenticationSession(
      authSession,
      "BROKERED_CONTEXT"
    );

  var brokerContext = serializedCtx.deserialize(
    context.getSession(),
    authSession
  );

  var userInfoFromBroker = JSON.parse(brokerContext.getContextData().UserInfo);

  // Set Identity CMS attributes
  setAttributeIfNotSet(
    user,
    "identity.lastName",
    userInfoFromBroker.family_name
  );
  setAttributeIfNotSet(
    user,
    "identity.firstName",
    userInfoFromBroker.given_name
  );
  setAttributeIfNotSet(
    user,
    "identity.gender",
    userInfoFromBroker.gender === "male" ? 1 : 2
  );
  setAttributeIfNotSet(
    user,
    "identity.birthDate",
    userInfoFromBroker.birthdate
  );
  setAttributeIfNotSet(
    user,
    "identity.birthPlace",
    userInfoFromBroker.birthplace
  );
  setAttributeIfNotSet(
    user,
    "identity.birthCountry",
    userInfoFromBroker.birthcountry
  );

  // Set Professional Information CMS attributes
  setAttributeIfNotSet(
    user,
    "personalInformation.email",
    userInfoFromBroker.email
  );

  setAttributeIfNotSet(user, "tos1", "true");
  setAttributeIfNotSet(user, "tos2", "true");

  //Set updated At attribute
  var updatedAt = new ArrayList();
  updatedAt.add(JSON.stringify(Date.now()));
  user.setAttribute("updatedAt", updatedAt);

  context.success();
}
