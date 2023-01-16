/**
 * Available variables:
 * script - this current script (ScriptModel.java)
 * user - the current user (UserModel.java)
 * realm - the current realm (RealmModel.java)
 * userSession - the current KeycloakSession (KeycloakSession.java)
 * authenticationSession - the current authenticationSession (AuthenticationSessionModel.java)
 * httpRequest - the current http request (org.jboss.resteasy.spi.HttpRequest)
 * LOG - Logger (org.jboss.logging.Logger scoped to ScriptBasedAuthenticator)
 *
 * voir KC 16.1 doc (https://www.keycloak.org/docs/16.1/server_development/#_script_providers)
 */

/**
 * CONST
 */
var SerializedBrokeredIdentityContext = Java.type(
  "org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext"
);
var ExistingUserInfo = Java.type(
  "org.keycloak.authentication.authenticators.broker.util.ExistingUserInfo"
);
var UserModel = Java.type("org.keycloak.models.UserModel");
var ArrayList = Java.type("java.util.ArrayList");
var Collectors = Java.type("java.util.stream.Collectors");
var Normalizer = Java.type("java.text.Normalizer");
var Messages = Java.type("org.keycloak.services.messages.Messages");
var Details = Java.type("org.keycloak.events.Details");
var Response = Java.type("javax.ws.rs.core.Response");
var Errors = Java.type("org.keycloak.events.Errors");

/**
 * Function helper to transform mapped attributes to CMS object
 * @param value : result of user.getAttributes("example")
 */
function createCMSAttribute(value) {
  var newAttribute = new ArrayList();
  newAttribute.add(
    JSON.stringify({
      value: value,
      source: "franceconnect.gouv.fr",
      certificationDate: new Date(),
    })
  );
  return newAttribute;
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
  var serializedCtx = SerializedBrokeredIdentityContext.readFromAuthenticationSession(
    authSession,
    "BROKERED_CONTEXT"
  );
  var brokerContext = serializedCtx.deserialize(
    context.getSession(),
    authSession
  );
  var userInfoFromBroker = JSON.parse(brokerContext.getContextData().UserInfo);
  var username = brokerContext.getModelUsername();

  var existingUserinfo = authSession.getAuthNote("EXISTING_USER_INFO");
  if (existingUserinfo !== null) {
    context.attempted();
    return;
  }

  var duplication = checkExistingUser(userInfoFromBroker);

  if (duplication == null) {
    // If no existing user with same lastName, firstName and birthdate compare Emails if sameEmail display error page
    if (brokerContext.getEmail() != null && !realm.isDuplicateEmailsAllowed()) {
      sameEmail = session
        .users()
        .getUserByEmail(realm, brokerContext.getEmail());
      if (sameEmail != null) {
        var response = context
          .form()
          .setAttribute("errorFC", "Email déjà existant");
        context.challenge(response);
      }
    }

    LOG.info(
      "No duplication detected. Creating account for user '%s' and linking with identity provider '%s' ." +
        username +
        brokerContext.getIdpConfig().getAlias()
    );

    // Creating user
    var federatedUser = session.users().addUser(realm, username);
    federatedUser.setEnabled(true);

    serializedCtx
      .getAttributes()
      .entrySet()
      .forEach(function (attr) {
        if (!UserModel.USERNAME.equalsIgnoreCase(attr.getKey())) {
          federatedUser.setAttribute(attr.getKey(), attr.getValue());
        }
      });

    context.setUser(federatedUser);
    context
      .getAuthenticationSession()
      .setAuthNote("BROKER_REGISTERED_NEW_USER", "true");
    context.success();
  } else {
    LOG.info(
      "Duplication detected. There is already existing user with %s '%s' ." +
        duplication.getExistingUserId() +
        duplication.getDuplicateAttributeName() +
        duplication.getDuplicateAttributeValue()
    );
    // Set duplicated user, so next authenticators can deal with it
    context
      .getAuthenticationSession()
      .setAuthNote("EXISTING_USER_INFO", duplication.serialize());
    //Only show error message if the authenticator was required
    if (context.getExecution().isRequired()) {
      var challengeResponse = context
        .form()
        .setError(Messages.FEDERATED_IDENTITY_EXISTS, [{}])
        .createErrorPage(Response.Status.CONFLICT);
      context.challenge(challengeResponse);
      context
        .getEvent()
        .user(duplication.getExistingUserId())
        .detail(
          duplication.getDuplicateAttributeName(),
          duplication.getDuplicateAttributeValue()
        )
        .removeDetail(Details.AUTH_METHOD)
        .removeDetail(Details.AUTH_TYPE)
        .error(Errors.FEDERATED_IDENTITY_EXISTS);
    } else {
      var existingUser = session
        .users()
        .getUserById(realm, duplication.getExistingUserId());

      LOG.info(
        "Reconciliation Duplication detected. existingUser " + existingUser
      );

      // gender
      existingUser.setAttribute(
        "identity.gender",
        createCMSAttribute(userInfoFromBroker.gender === "male" ? 1 : 2)
      );

      // LastName
      existingUser.setAttribute(
        "identity.lastName",
        createCMSAttribute(userInfoFromBroker.family_name)
      );

      // FirstName
      existingUser.setAttribute(
        "identity.firstName",
        createCMSAttribute(userInfoFromBroker.given_name)
      );

      // birthdate
      existingUser.setAttribute(
        "identity.birthDate",
        createCMSAttribute(userInfoFromBroker.birthdate)
      );
      context.attempted();
    }
  }
}

/*
 * Check if user already exist based on his lastName firstName and birthdate
 *
 */
function checkExistingUser(userInfoFromBroker) {
  var lastName = userInfoFromBroker.family_name;
  var firstName = userInfoFromBroker.given_name;
  var birthDate = userInfoFromBroker.birthdate;

  var collectedExistingUser = session
    .users()
    .searchForUserByUserAttributeStream(realm, "birthdate", birthDate)
    .collect(Collectors.toList());

  var existingUser = getExistingUser(
    collectedExistingUser,
    lastName,
    firstName
  );

  if (existingUser.length === 1) {
    return new ExistingUserInfo(
      existingUser[0].getId(),
      UserModel.LAST_NAME,
      existingUser[0].getLastName()
    );
  }

  return null;
}

/*
 * Check user's lastName and firstName
 *
 */
function getExistingUser(collectedExistingUser, lastName, firstName) {
  var matchUser = new ArrayList();
  var matchLastName = false;
  var matchFirstName = false;
  collectedExistingUser.forEach(function (user) {
    matchLastName = false;
    matchFirstName = false;

    //Compare lastName
    if (
      normalizeString(lastName, "lastName") ===
      normalizeString(user.getLastName(), "lastName")
    ) {
      matchLastName = true;
    }

    //Compare firstName
    if (
      normalizeString(firstName.split(" ")[0]) ===
        normalizeString(user.getFirstName()) ||
      normalizeString(firstName) ===
        normalizeString(user.getFirstName().split(" ")[0]) ||
      normalizeString(firstName) === normalizeString(user.getFirstName())
    ) {
      matchFirstName = true;
    }

    if (matchLastName && matchFirstName) {
      matchUser.add(user);
    }
  });
  return matchUser;
}

/*
 * Normalize accented characters in a string
 *
 */
function normalizeString(arg, field) {
  var normalizer = Normalizer.normalize(arg, Normalizer.Form.NFD);
  var ascii = normalizer.replaceAll("[^\\p{ASCII}]", "").toLowerCase();
  return field === "lastName" ? ascii.replace(/\s/g, "") : ascii;
}
