<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("termsTitle")}
    <#elseif section = "form">
    <div class="kc-terms">
        <div id="kc-terms-text">
            <p>${kcSanitize(msg("termsText"))?no_esc}</p>
        </div>
        <form class="form-actions" action="${url.loginAction}" method="POST">
            <div class="kc-terms-checkbox">
                <div class="checkbox">
                    <input
                        type="checkbox"
                        id="tos1"
                        name="user.attributes.tos1"
                        onclick="enableAcceptButton()"/>
                    <label for="tos1">${kcSanitize(msg("cguTermsText", "https://${properties.websiteFQDN!}/mentions-legales-cgu"))?no_esc}</label>
                </div>
                <div class="checkbox">
                    <input
                        type="checkbox"
                        id="tos2"
                        name="user.attributes.tos2"
                        onclick="enableAcceptButton()"/>
                    <label for="tos2">${kcSanitize(msg("rgpdTermsText", "https://${properties.websiteFQDN!}/charte-protection-donnees-personnelles"))?no_esc}</label>
                </div>
            </div>
            <input disabled class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" name="accept" id="kc-accept" type="submit" value="${msg("doAcceptTerms")}"/>
        </form>
        <div class="clearfix"></div>
    </div>
    <script type="text/javascript">
        function enableAcceptButton() {
            let tos1 = document.getElementById('tos1');
            let tos2 = document.getElementById('tos2');
            let acceptBtn = document.getElementById('kc-accept');
            acceptBtn.disabled = !(tos1.checked && tos2.checked);
        }
        document.getElementById('mentions-legales-cgu').addEventListener("click", function(e) {
            if (e.target.tagName == "A" && !e.target.hasAttribute("target")){
                e.target.setAttribute("target", "_blank");
            }
        }); 
        document.getElementById('protect-donnees-charte').addEventListener("click", function(e) {
            if (e.target.tagName == "A" && !e.target.hasAttribute("target")){
                e.target.setAttribute("target", "_blank");
            }
        }); 
    </script>
    </#if>
</@layout.registrationLayout>
