<#outputformat "plainText">
    <#assign attributes = user.getAttributes()>
    <#assign requiredActionsText>
        <#if requiredActions??>
            <#list requiredActions>
                <#items as reqActionItem>
                    ${msg("requiredAction.${reqActionItem}")}<#sep>, </#sep>
                </#items>
            </#list>
        </#if>
    </#assign>
</#outputformat>
<#import "../commons/template-mcm.ftl" as template>
<#import "../commons/button.ftl" as button>

<@template.mcm>
    <#if attributes.emailTemplate??>
        <#if attributes.emailTemplate == 'financeur'>
            <div class="grid-container">
                <div class="grid-center">
                    <div>
                        ${kcSanitize(msg("executeActionsBodyHtmlFunder1", user.getFirstName()))?no_esc}
                        ${kcSanitize(msg("executeActionsBodyHtmlFunder2", attributes.funderName))?no_esc}
                        ${kcSanitize(msg("executeActionsBodyHtmlFunder3"))?no_esc}
                        <div class="btn">
                            <@button.confirm link=link text=msg("executeActionsBodyHtmlFunder4") />
                        </div>
                        <br>
                        <div>
                            ${kcSanitize(msg("executeActionsBodyHtmlFunder5"))?no_esc}
                        </div>
                    </div>
                </div>
            </div>
        </#if>
        <#if attributes.emailTemplate == 'citoyen'>
            <div class="grid-container">
                <div class="grid-center">
                    <div>
                        ${kcSanitize(msg("executeActionsBodyHtmlCitizen1", user.getFirstName()))?no_esc}
                        ${kcSanitize(msg("executeActionsBodyHtmlCitizen2", attributes.funderName))?no_esc}
                        <div class="btn">
                            <@button.confirm link=link text=msg("executeActionsBodyHtmlCitizen3") />
                        </div>
                        ${kcSanitize(msg("executeActionsBodyHtmlCitizen4"))?no_esc}
                        <div>
                            <br>
                            ${kcSanitize(msg("executeActionsBodyHtmlCitizen5"))?no_esc}
                        </div>
                    </div>
                </div>
            </div>
        </#if>
    <#else>
        ${kcSanitize(msg("executeActionsBodyHtml",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration)))?no_esc}
    </#if>
</@template.mcm>