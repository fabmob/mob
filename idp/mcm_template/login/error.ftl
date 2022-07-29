<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("errorTitle")}
    <#elseif section = "form">
        <div id="kc-error-message">
            <p class="instruction mcm-subtitle">${kcSanitize(msg("messageErreur1"))?no_esc}</p>
            <p class="instruction">${kcSanitize(msg("messageErreur2"))?no_esc}</p>
            <#if client?? && client.baseUrl?has_content>
                <div class="button-redirect">
                    <a id="button-activated" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                </div>
             <#else>
                <div class="button-redirect">
                    <a id="button-activated" href="${properties.redirectToLoginPage}">Se connecter</a>
                </div>
            </#if>
        </div>
    </#if>
</@layout.registrationLayout>
