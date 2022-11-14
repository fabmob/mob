<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">
        <p>${msg("emailInstruction")}</p>
        <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <div class="${properties.kcFormGroupClass!}">
                <label for="username" class="${properties.kcLabelClass!}"><#if !realm.loginWithEmailAllowed>${msg("email")} *<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>
                <#if auth?has_content && auth.showUsername()>
                    <input type="text" id="username" name="username" class="${properties.kcInputClass!}" autofocus value="${auth.attemptedUsername}" placeholder="exemple@mail.com" />
                <#else>
                    <input type="text" id="username" name="username" class="${properties.kcInputClass!}" autofocus placeholder="exemple@mail.com" pattern="[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)"/>
                    <div id="mcm-regex-error" class="mcm-regex-error">
                        <p>${msg("invalidEmailFormat")}</p>
                    </div>
                </#if>
            </div>
            <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                    <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                    </div>
                </div>

                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doSubmit")}"/>
                </div>
            </div>
        </form>
        <#--  Custom invalid regex for username input as email  -->
        <script type="text/javascript">
            var input = document.getElementById('username');
            var mcmErrorMessage = document.getElementById('mcm-regex-error');
            mcmErrorMessage.style.display = 'none';
            input.addEventListener('invalid', function(event){
                event.preventDefault();
                if (!event.target.validity.valid) {
                    mcmErrorMessage.style.display = 'block';
                }
            });
            input.addEventListener('input', function(event){
                if ( 'block' === mcmErrorMessage.style.display ) {
                    mcmErrorMessage.style.display = 'none';
                }
            });
        </script>
    </#if>
</@layout.registrationLayout>
