<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo displayWide=(realm.password && social.providers??); section>
    <#if section = "header">
        ${msg("doLogIn")}
    <#elseif section = "form">
        <div id="kc-form" <#if realm.password && social.providers??>class="${properties.kcContentWrapperClass!}"</#if>>
            <div id="kc-form-wrapper" <#if realm.password && social.providers??>class="${properties.kcFormSocialAccountContentClass!} ${properties.kcFormSocialAccountClass!}"</#if>>
                <div id="mcm-login-header">
                    <h1>${msg("headerTitle")}</h1>
                    <p>${msg("textSignIn")}</p>
                </div>
                <div id="mcm-login">
                    <#if realm.password>
                        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                            <h2 class="signin-title">${msg("doLogInFC")}</h2>
                            <p>${msg("textFC")}</p>

                            <#if realm.password && social.providers??>
                                 <div id="kc-social-providers" class="franceconnect-container">
                                      <#list social.providers as p>
                                          <#if p.providerId == 'franceconnect-particulier'>
                                                <a href="${p.loginUrl}" id="zocial-${p.alias}" class="zocial ${p.providerId}"></a>
                                                <a class='franceconnect-link' target="_blank" href="https://franceconnect.gouv.fr">${msg("franceconnectLink")}</a>  
                                          </#if> 
                                    </#list>
                                </div>
                           </#if> 
                        </form>
                    </#if>
                    <div class="responsive-display separ-sections"><div class="label">${msg("orLabel")}</div></div>
                    <div class="responsive-not-display separ-sections"><div class="label">${msg("orLabel")}</div></div>
                    <div id="signin-section">
                        <form class="signin-section-left" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                            <div class="signin-text">
                                <h2 class="signin-title">${msg("doLogInMob")}</h2>
                                  <div class="${properties.kcFormGroupClass!} form-section">
                                <label for="username" class="${properties.kcLabelClass!}"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>

                                <#if usernameEditDisabled??>
                                    <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}" type="text" placeholder="exemple@mail.com" disabled />
                                <#else>
                                    <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}"  type="text" placeholder="exemple@mail.com"  autocomplete="off" />
                                </#if>
                            </div>

                            <div class="${properties.kcFormGroupClass!} form-section">
                                <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                                <input tabindex="2" id="password" class="${properties.kcInputClass!}" name="password" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"  autocomplete="off" />
                                <span class="mcm-eye-img" id="togglePassword" onclick="showPassword(this)"></span>
                                <div class="${properties.kcFormOptionsWrapperClass!} kc-forgot-password">
                                    <#if realm.resetPasswordAllowed>
                                        <span><a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                                    </#if>
                                </div>
                            </div>

                            <div class="kc-inputs-form form-section">
                                <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                                    <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="login" id="kc-login" type="submit" value="${msg("btnLogIn")}"/>
                                </div>
                                <#if realm.rememberMe && !usernameEditDisabled??>
                                    <div class="checkbox" onclick="toggleCheckbox()">
                                        <#if login.rememberMe??>
                                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> 
                                        <#else>
                                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" >
                                        </#if>
                                        <label>${msg("rememberMe")}</label>
                                    </div>
                                </#if>
                            </div>
                            </div>
                            <div id="mcm-img-login" class="responsive-display"></div>
                        </form>
                    </div>
                </div>
                <div id="mcm-signin-link-container">
                    <p>${msg("questionSignIn")} </p>
                    <a class="mcm-basic-link" href="https://${properties.websiteFQDN!}/inscription/formulaire">${msg("btnSignIn")}</a>                          
                </div>
            </div>
            <div id="mcm-img-login" class="responsive-not-display"></div>
        </div>

        <script type="text/javascript">
            document.getElementById('kc-page-title').classList.add("display-none");
            document.getElementById('mcm-img').classList.add("display-none");
            function toggleCheckbox() {
                let checkbox = document.getElementById('rememberMe');
                checkbox.checked = !checkbox.checked;
            }
            function showPassword(toggle) {
                let password = document.getElementById('password');
                if(password.getAttribute('type') === 'password') {
                    password.setAttribute('type', 'text');
                    toggle.classList.add("mcm-eye-visible");
                } else {
                    password.setAttribute('type', 'password');
                    toggle.classList.remove("mcm-eye-visible");
                }
            }
        </script>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration">
                <span>${msg("noAccount")} <a tabindex="6" href="${url.registrationUrl}">${msg("doRegister")}</a></span>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>