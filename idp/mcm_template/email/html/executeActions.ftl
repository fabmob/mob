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

<html>
    <body>
        <#if attributes.emailTemplate??>
            <#if attributes.emailTemplate == 'financeur'>
                ${kcSanitize(msg("executeActionsBodyHtmlFunder",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration), user.getFirstName(), attributes.funderName))?no_esc}
            </#if>
            <#if attributes.emailTemplate == 'citoyen'>
                ${kcSanitize(msg("executeActionsBodyHtmlCitizen",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration)))?no_esc}
            </#if>
        <#else>
            ${kcSanitize(msg("executeActionsBodyHtml",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration)))?no_esc}
        </#if>
    </body>
</html>
