<#macro mcm>
    <html>
        <head>
            <#if properties.idpFQDN == "undefined">
                <link href='http://localhost:9000${url.resourcesPath}/css/style.css' rel="stylesheet" type="text/css" />
            <#else>
                <link href='https://${properties.idpFQDN}${url.resourcesPath}/css/style.css' rel="stylesheet" type="text/css" />
            </#if>
        </head>
    <body>
        <#include "../commons/header.ftl">
        <table style="width: 100%; max-width: 640px">
            <tr>
                <td>
                <#nested>
                </td>
            </tr>
        </table>
        <#include "../commons/footer.ftl">
    </body>

    </html>
</#macro>