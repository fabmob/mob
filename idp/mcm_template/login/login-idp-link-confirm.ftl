<#import "template-minimal.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("confirmLinkIdpTitle", idpDisplayName, realm.displayName)}
    <#elseif section = "form">
        <form id="kc-register-form" action="${url.loginAction}" method="post">
            <div class="${properties.kcFormGroupClass!}">
            ${msg("confirmLinkIdpDescription", idpDisplayName, realm.displayName )}
            </div>
            <div class="${properties.kcFormGroupClass!} submit-btn">
                <!-- <button type="submit" class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="submitAction" id="updateProfile" value="updateProfile">${msg("confirmLinkIdpReviewProfile")}</button> -->
                <button type="submit" class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="submitAction" id="linkAccount" value="linkAccount">${msg("confirmLinkIdpContinue", idpDisplayName)}</button>
            </div>
            <div class="${properties.kcFormGroupClass!} go-back-btn">
                <a href="https://${properties.websiteFQDN!}">${msg("doClickGoBack")}</a>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
