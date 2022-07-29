<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${messageHeader}
        <#else>
            ${message.summary}
        </#if>
    <#elseif section = "form">
    <div id="kc-info-message">
        <p class="instruction mcm-subtitle">
            <#if requiredActions??><#list requiredActions><b><#items as reqActionItem>${msg("requiredAction.${reqActionItem}")}<#sep>, </#items></b></#list>
            <#else>
            </#if>
        </p>
        <#if skipLink??>
            <p class="instruction mcm-subtitle">${kcSanitize(msg("activeAccount"))?no_esc}</p>
            <p class="retour-ligne">${kcSanitize(msg("activeAccountDescription1"))?no_esc}</p>
            <p class="retour-ligne">${kcSanitize(msg("activeAccountDescription2"))?no_esc}</p>
            <div class="button-redirect">
                <a id="button-activated" href="${properties.redirectToLoginPage}">${kcSanitize(msg("btnLogIn"))?no_esc}</a>
            <div>
        <#else>
            <#if pageRedirectUri?has_content>
                <p><a href="${pageRedirectUri}">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            <#elseif actionUri?has_content>
                <p id="redirectToWebsite">${kcSanitize(msg("proceedWithAction"))?no_esc}</p>
                <div class="button-redirect">
                    <a id="button-activate-account" href="${actionUri}">Activer mon compte</a>
                <div>
                <#--  Bypass manual action from user  -->
                <script type="text/javascript">
                    document.getElementById('button-activate-account').click();
                </script>
            <#elseif (client.baseUrl)?has_content>
                <p><a href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            </#if>
        </#if>
    </div>
    </#if>
</@layout.registrationLayout>