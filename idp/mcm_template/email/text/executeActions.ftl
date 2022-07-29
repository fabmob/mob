<#ftl output_format="plainText">
<#assign attributes = user.getAttributes()>
<#assign requiredActionsText>
    <#if requiredActions??>
        <#list requiredActions>
            <#items as reqActionItem>
                ${msg("requiredAction.${reqActionItem}")}<#sep>, 
            </#items>
        </#list>
    <#else>
    </#if>
</#assign>

<#if attributes.emailTemplate??>
    <#if attributes.emailTemplate == 'financeur'>
        ${msg("executeActionsBodyHtmlFunder",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration), user.getFirstName(), attributes.funderName)}
    </#if>
    <#if attributes.emailTemplate == 'citoyen'>
        ${msg("executeActionsBodyHtmlCitizen",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration))}
    </#if>
<#else>
    ${msg("executeActionsBodyHtml",link, linkExpiration, realmName, requiredActionsText, linkExpirationFormatter(linkExpiration))}
</#if>