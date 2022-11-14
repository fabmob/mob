<html>
<head>
 <#if properties.idpFQDN == "undefined">
  <link href='http://localhost:9000${url.resourcesPath}/css/style.css' rel="stylesheet" type="text/css" />
  <#else>
  <link href='https://${properties.idpFQDN}${url.resourcesPath}/css/style.css' rel="stylesheet" type="text/css" />
</#if>
</head>
<#include "../commons/header.ftl">
<body>
  <div class="grid-container">
             <div class="grid-center">
             <div>
                ${kcSanitize(msg("identityProviderLinkBodyHtml1", user.getFirstName()))?no_esc}
                ${kcSanitize(msg("identityProviderLinkBodyHtml2"))?no_esc}
              <div class="btn"><button class="confirm-btn">
                ${kcSanitize(msg("identityProviderLinkBodyHtml3", link))?no_esc}
             </button></div>
                ${kcSanitize(msg("identityProviderLinkBodyHtml4"))?no_esc}
              <div>
              <br>
                ${kcSanitize(msg("identityProviderLinkBodyHtml5"))?no_esc}
              </div></div></div></div>
</body>
    <#include "../commons/footer.ftl">
</html>
