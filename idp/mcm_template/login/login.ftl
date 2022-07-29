<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo displayWide=(realm.password && social.providers??); section>
    <#if section = "header">
        ${msg("doLogIn")}
    <#elseif section = "form">
        <div id="kc-form" <#if realm.password && social.providers??>class="${properties.kcContentWrapperClass!}"</#if>>
            <div id="kc-form-wrapper" <#if realm.password && social.providers??>class="${properties.kcFormSocialAccountContentClass!} ${properties.kcFormSocialAccountClass!}"</#if>>
                <div id="mcm-login">
                    <#if realm.password>
                        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                            <h1 class="signin-title">${msg("doLogIn")}</h1>
                            <div class="${properties.kcFormGroupClass!} form-section">
                                <label for="username" class="${properties.kcLabelClass!}"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>

                                <#if usernameEditDisabled??>
                                    <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}" type="text" placeholder="exemple@mail.com" disabled />
                                <#else>
                                    <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}"  type="text" placeholder="exemple@mail.com"  autofocus autocomplete="off" />
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

                            <div class="kc-inputs-form">
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
                        </form>
                    </#if>
                    
                    <a class="responsive-display mcm-link" href="https://${properties.websiteFQDN!}/inscription/localisation">${msg("btnSignIn")}</a>

                    <div id="signin-section">
                        <div class="signin-section-left">
                            <div class="signin-text">
                                <h1 class="signin-title">${msg("doSignIn")}</h1>
                                <p>${msg("textSignIn")}</p>
                            </div>
                                <a class="responsive-not-display mcm-link" href="https://${properties.websiteFQDN!}/inscription/formulaire">${msg("btnSignIn")}</a>                          
                            <div id="mcm-img-login" class="responsive-display"></div>
                        </div>
                        <div id="mcm-img-login" class="responsive-not-display"></div>
                    </div>
                    <#--  <#if realm.password && social.providers??>
                        <div id="kc-social-providers" class="${properties.kcFormSocialAccountContentClass!} ${properties.kcFormSocialAccountClass!}">
                            <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 4>${properties.kcFormSocialAccountDoubleListClass!}</#if>">
                                <#list social.providers as p>
                                    <li class="${properties.kcFormSocialAccountListLinkClass!}"><a href="${p.loginUrl}" id="zocial-${p.alias}" class="zocial ${p.providerId}"> <span>${p.displayName}</span></a></li>
                                </#list>
                            </ul>
                        </div>
                    </#if>  -->
                </div>
            </div>
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
