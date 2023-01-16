<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
    <#if !errorFC??>
        ${msg("errorTitle")}
    </#if>
    <#elseif section = "form">
        <div id="kc-error-message">
            <#if errorFC?? && errorFC?has_content>
                <p class="instruction mcm-subtitle">Échec de la réconciliation du compte moB avec FranceConnect</p>
                <p class="instruction">Un compte moB existe déjà avec votre adresse email mais ne correspond pas à votre identité. La réconciliation de FranceConnect avec ce compte existant n'est donc pas possible.</p>
                <p class="instruction">Merci de contacter le support technique si vous souhaitez vous connecter à moB avec FranceConnect.</p>
                <div class="button-redirect">
                    <a id="button-activated" href="https://${properties.websiteFQDN!}/contact" alt="Contacter mon compte mobilité">
                        Nous contacter
                    </a>
                </div>
            <#else>
                <p class="instruction mcm-subtitle">${kcSanitize(msg("messageErreur1"))?no_esc}</p>
                <p class="instruction">${kcSanitize(msg("messageErreur2"))?no_esc}</p>
                <#if client?? && client.baseUrl?has_content>
                    <div class="button-redirect">
                        <a id="button-activated" href="${client.baseUrl}">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                    </div>
                <#else>
                    <div class="button-redirect">
                        <a id="button-activated" href="${properties.redirectToLoginPage}">Me connecter</a>
                    </div>
                </#if>
            </#if>
        </div>
    </#if>
</@layout.registrationLayout>
