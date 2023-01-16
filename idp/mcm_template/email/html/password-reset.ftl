<#import "../commons/template-mcm.ftl" as template>
<#import "../commons/button.ftl" as button>

<@template.mcm>
    <table style="width: 640px; max-width: 640px">
        <tr>
            <td>
            <div style="margin-bottom: 40px"">
                ${kcSanitize(msg("passwordResetBodyHtml1", user.getFirstName()))?no_esc}
                ${kcSanitize(msg("passwordResetBodyHtml2"))?no_esc}
                <div class="btn">
                    <@button.confirm link=link text=msg("passwordResetBodyHtml3") />
                </div>
                ${kcSanitize(msg("passwordResetBodyHtml4", linkExpirationFormatter(linkExpiration)))?no_esc}
                <div>
                    ${kcSanitize(msg("passwordResetBodyHtml5"))?no_esc}
                </div>
            <div>
            </td>
        </tr>
    </table>
</@template.mcm>
