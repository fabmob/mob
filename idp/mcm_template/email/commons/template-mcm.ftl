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
        <table style=" margin-bottom: 40px; width: 100%; max-width: 640px">
        <div style="margin-bottom: 40px">
         <tr>
                <td>
                <#nested>
                </td>
            </tr>
        </div>
           
        </table>
        <#include "../commons/footer.ftl">
    </body>

    </html>
</#macro>