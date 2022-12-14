import Keycloak from "keycloak-js";
import metadata from "./metadata.json";

let token,
  keycloak,
  incentiveId,
  refreshToken,
  getMetadata,
  idpConfig,
  apiConfig,
  idpCmeConfig,
  keycloakCme;

// Init the keycloak connection
const initConfig = async () => {
  const response = await (await fetch("/static/config.json")).json();
  apiConfig = response.api;
  idpConfig = response.idp;
  keycloak = Keycloak(idpConfig);

  // Simulation maas client cme
  idpCmeConfig = response.idpCme;
  keycloakCme = Keycloak(idpCmeConfig);
  const mobConnectClic = localStorage.getItem("mobConnect");
  if (!mobConnectClic) {
    await initKeycloak();
  }

  await initKeycloakCme();
};

const initKeycloak = async () => {
  keycloak
    .init({})
    .then(() => {
      if (keycloak.refreshToken) {
        localStorage.setItem("refresh_token", keycloak.refreshToken);
        document.getElementById(
          "messageName"
        ).innerHTML = `Bonjour ${keycloak?.idTokenParsed?.name}, votre id citoyen est : ${keycloak.idTokenParsed.sub} et votre adresse email est : ${keycloak.idTokenParsed.preferred_username}`;
        document.getElementById("accessToken").innerHTML = keycloak.token;
      } else {
        document.getElementById("messageName").innerHTML = `Bonjour incognito`;
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("mobConnect");
      }
    })
    .catch(
      (err) =>
        (document.getElementById(
          "errors"
        ).innerHTML = `erreur nouveau token d'accès: ${err}`)
    );
};

// Keycloak simulation maas client cme
const initKeycloakCme = async () => {
  keycloakCme
    .init({})
    .then(async () => {
      if (keycloakCme.refreshToken) {
        localStorage.setItem("refresh_token_cme", keycloakCme.refreshToken);
        document.getElementById(
          "messageNameMobConnect"
        ).innerHTML = `Bonjour ${keycloakCme?.idTokenParsed?.name}, votre id citoyen est : ${keycloakCme.idTokenParsed.sub} et votre adresse email est : ${keycloakCme.idTokenParsed.preferred_username}`;
        document.getElementById("idTokenMobConnect").innerHTML =
          keycloakCme.idToken;
        await initKeycloak();
      } else {
        document.getElementById(
          "messageNameMobConnect"
        ).innerHTML = `Bonjour incognito`;
        localStorage.removeItem("refresh_token_cme");
        localStorage.removeItem("mobConnect");
      }
    })
    .catch(async (err) => {
      await initKeycloak();
      document.getElementById(
        "errorsMobConnect"
      ).innerHTML = `erreur nouveau token: ${err}`;
    });
};

const linkMyAccount = () => {
  localStorage.removeItem("mobConnect");
  return keycloak.login({
    redirectUri: window.location.origin,
    scope: "offline_access",
  });
};

// Clic button Mob connect
const mobConnect = () => {
  localStorage.setItem("mobConnect", true);
  return keycloakCme.login({
    redirectUri: window.location.origin,
    scope: "offline_access",
  });
};

const disconnect = async () => {
  await keycloak.logout({ redirectUri: window.location.origin });
};

// Clic button disconnect Mob connect
const disconnectMobConnect = async () => {
  await keycloakCme.logout({ redirectUri: window.location.origin });
};

const copyClipboard = () => {
  token = document.getElementById("accessToken").innerHTML;
  token ? navigator.clipboard.writeText(token) : alert("Demander un token");
};

// Clic button copy Mob connect
const copyClipboardMobConnect = () => {
  token = document.getElementById("idTokenMobConnect").innerHTML;
  token ? navigator.clipboard.writeText(token) : alert("Demander un token");
};

const subscriptions = () => {
  // Get the value of form
  incentiveId = document.getElementById("incentiveId").value;
  refreshToken = document.getElementById("token").value;
  getMetadata = document.getElementById("metadata").value;
  if (!verifyInput(incentiveId, refreshToken, getMetadata)) return false;
  const body = {
    incentiveId: incentiveId,
    attachmentMetadata: JSON.parse(getMetadata),
  };
  return fetch(`${apiConfig.url}/v1/subscriptions/metadata`, {
    method: "post",
    headers: {
      accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`erreur ${response.status}`);
      }
    })
    .then((res) => {
      //redirection to the website
      if (res.subscriptionURL)
        window.open(res.subscriptionURL, "_blank", "noopener");
    })
    .catch((err) => alert(`erreur lors de l'appel à l'api ${err}`));
};

function verifyInput(incentiveId, token, metadata) {
  // Regex to securize the request
  const regexToken = /[^\s\.,!?]+/g,
    regexincentiveId = /[a-z0-9]{8,20}$/gm,
    regexJson = /[!$%^&]/;
  let check = true;
  !token.match(regexToken) &&
    (alert("Erreur dans le Token !"), (check = false));
  !incentiveId.match(regexincentiveId) &&
    (alert("Erreur dans id de l'aide !"), (check = false));
  metadata.match(regexJson) &&
    (alert("Erreur dans les metadata !"), (check = false));
  return check;
}

const askForNewToken = () => {
  const body = new URLSearchParams({
    client_id: "simulation-maas-client",
    grant_type: "refresh_token",
    refresh_token: localStorage.getItem("refresh_token"),
  });

  return fetch(
    `${idpConfig.url}/realms/${idpConfig.realm}/protocol/openid-connect/token`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )
    .then(async (result) => await result.json())
    .then(
      ({ access_token }) =>
        (document.getElementById("accessToken").innerHTML = access_token)
    )
    .catch(
      (err) =>
        (document.getElementById(
          "errors"
        ).innerHTML = `erreur nouveau token d'accès: ${err}`)
    );
};

// Clic button asky for new token Mob connect
const askForNewTokenMobConnect = () => {
  const body = new URLSearchParams({
    client_id: "simulation-maas-client-cme",
    grant_type: "refresh_token",
    refresh_token: localStorage.getItem("refresh_token_cme"),
  });

  return fetch(
    `${idpCmeConfig.url}/realms/${idpCmeConfig.realm}/protocol/openid-connect/token`,
    {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  )
    .then(async (result) => await result.json())
    .then(
      ({ id_token }) =>
        (document.getElementById("idTokenMobConnect").innerHTML = id_token)
    )
    .catch(
      (err) =>
        (document.getElementById(
          "errorsMobConnect"
        ).innerHTML = `erreur nouveau token d'accès: ${err}`)
    );
};

const getMeta = () => {
  document.getElementById("metadata").value = JSON.stringify(metadata);
};

window.onload = initConfig;

document.getElementById("linkMyAccount").onclick = linkMyAccount;
document.getElementById("askForNewToken").onclick = askForNewToken;
document.getElementById("disconnect").onclick = disconnect;
document.getElementById("copyToken").onclick = copyClipboard;
document.getElementById("subscription").onclick = subscriptions;
document.getElementById("getMeta").onclick = getMeta;
document.getElementById("mobConnect").onclick = mobConnect;
document.getElementById("askForNewTokenMobConnect").onclick =
  askForNewTokenMobConnect;
document.getElementById("disconnectMobConnect").onclick = disconnectMobConnect;
document.getElementById("copyTokenMobConnect").onclick =
  copyClipboardMobConnect;
