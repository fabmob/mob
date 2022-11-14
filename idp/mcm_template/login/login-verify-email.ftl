<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
    <#elseif section = "form">
        <p class="instruction mcm-subtitle">
            ${msg("emailVerifyInstruction1")}
        </p>
        <p class="instruction retour-ligne">
            ${msg("emailVerifyInstruction2")} <br/>
            ${msg("emailVerifyInstruction3")}
        </p>
        <div class="button-redirect">
            <a class="mcm-link" href="${url.loginAction}">${msg("emailVerifyBtn")}</a>
        </div>
        <script type="text/javascript">
            document.getElementsByClassName('alert-warning')[0].classList.add("display-none");
        </script>
    </#if>
</@layout.registrationLayout>
