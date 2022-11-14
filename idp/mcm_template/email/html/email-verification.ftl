<#import "../commons/template-mcm.ftl" as template>
<#import "../commons/button.ftl" as button>

<@template.mcm>
    <table style="width: 640px; max-width: 640px">
        <tr>
            <td>
                <div>
                    ${kcSanitize(msg("emailVerificationBodyHtml1", user.getFirstName()))?no_esc}
                    ${kcSanitize(msg("emailVerificationBodyHtml2"))?no_esc}
                    <div class="btn">
                      <@button.confirm link=link text=msg("emailVerificationBodyHtml3") />
                    </div>
                    ${kcSanitize(msg("emailVerificationBodyHtml4"))?no_esc}
                    <div>
                      <br>
                      ${kcSanitize(msg("emailVerificationBodyHtml5"))?no_esc}
                    </div>
                </div>
            </td>
        </tr>
    </table>
</@template.mcm>
