<#import "template-minimal.ftl" as layout>
<@layout.registrationLayout bodyClass="oauth"; section>
    <#if section = "header">
        <#if client.name?has_content>
            <div>
                ${msg("oauthGrantTitle", client.name)}
                <span id="kc-title-identity">${client.name}</span> ?
            </div>
        <#else>
            <div>
                ${msg("oauthGrantTitle", client.clientId)}
                <span id="kc-title-identity">${client.clientId}</span> ?
            </div>
        </#if>
    <#elseif section = "form">
        <div id="kc-oauth" class="content-area">
            <div>${msg("oauthGrantRequest")}</div>

            <ul  class="${properties.kcScreenListGroup!}">
                <#if oauth.clientScopesRequested??>
                    <#list oauth.clientScopesRequested as clientScope>
                        <li>
                            <span>${advancedMsg(clientScope.consentScreenText)}</span>
                        </li>
                    </#list>
                </#if>
            </ul>

            <form id="kc-oauth-form" class="form-actions" action="${url.oauthAction}" method="POST">
                <input type="hidden" name="code" value="${oauth.code}">
                <div class="${properties.kcFormGroupClass!}">
                    <div id="kc-oauth-data-protection">
                        ${msg("privateDataProtectionText")}
                        <a href="https://${properties.websiteFQDN!}/charte-protection-donnees-personnelles" alt="CGV">
                            ${msg("privateDataProtectionLinkText")}
                        </a>
                    </div>

                    <div id="kc-form-buttons-group" class="${properties.kcFormButtonsGroupClass!}">
                        <div id="kc-form-buttons-content" class="${properties.kcFormButtonsWrapperClass!}">
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" name="accept" id="kc-login" type="submit" value="${msg("doYes")}"/>
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}" name="cancel" id="kc-cancel" type="submit" value="${msg("doNo")}"/>
                        </div>
                    </div>
                </div>
            </form>

            <div class="clearfix"></div>
        </div>
    </#if>
</@layout.registrationLayout>
