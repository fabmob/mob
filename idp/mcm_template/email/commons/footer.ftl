<#include "utils.ftl">

<#function if cond then else="">
  <#if cond>
    <#return then>
  <#else>
    <#return else>
  </#if>
</#function>

<#assign footerLink = getLink("mob-footer.png")>

<table style="height: 150px;width: 100%;text-align: center;color: white;margin-top: 40px;max-width: 640px;background-color: #464CD0;width:640px;">
  <tr>
    <td>
      <p>
        &copy; Mon Compte Mobilité - Tous droits réservés -
        <a
          style="color: white;"
          href="https://${properties.websiteFQDN!}/mentions-legales-cgu"
          >Mentions légales
        </a>
      </p>
      <img style="padding-top: 15px;width: auto;height: 50px;object-fit: contain;" src="${footerLink}" alt="mob footer" />
    </td>
  </tr>
</table>