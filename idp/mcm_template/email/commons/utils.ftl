<#assign landscape = properties.landscape>
<#assign baseDomain = properties.baseDomain>

<#function getLink imgName>
    <#if (landscape != "null" && landscape != "undefined")>
        <#if landscape == "production">
            <#return "https://static.${baseDomain}/assets/${imgName}">
        <#elseif landscape == "testing">
            <#return "https://static.preview.${baseDomain}/assets/${imgName}">
        <#else>
            <#return "https://static.${landscape}.${baseDomain}/assets/${imgName}">
        </#if>
    <#else>
        <#return "https://static.preview.${baseDomain}/assets/${imgName}">
    </#if>
</#function>