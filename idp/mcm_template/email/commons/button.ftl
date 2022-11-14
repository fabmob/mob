<#macro confirm link text>
    <table style="margin: 20px auto; padding: 20px 0px;text-align: center;">
        <tr>
            <td>
                <!--[if mso]>
                    
                <v:rect style="height:45px;width:0;" fill="f" stroke="f" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" />
                    
                <v:roundrect style="width:350px;height:55px;position:relative;top:0;left:-4px;" arcsize="50%" stroke="f" fill="true" xmlns:v=&quot;urn:schemas-microsoft-com:vml&quot; xmlns:w=&quot;urn:schemas-microsoft-com:office:word&quot;>
                    <v:fill type="gradientradial" color="transparent" color2="#01BF7D" focus="0" focusposition=".05,0.23" focussize=".9,0.25" />
                </v:roundrect>
                    
                <v:roundrect href="${link}" style="width:350px;height:45px;position:relative;top:0;left:0;v-text-anchor:middle;text-align: center;" arcsize="50%" stroke="f" fillcolor="#01BF7D" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
                    <w:anchorlock/>
                    <v:textbox inset="0,0,0,0">
                    <center>
                <![endif]-->
                <a href="${link}" style="color: white;background-color: #01BF7D;border-radius: 25px;outline: none;padding: 12px 20px;border: none;text-decoration: none;text-align: center;text-decoration: none;box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;">${text}</a>
                <!--[if mso]>
                    </center>
                    </v:textbox>
                </v:roundrect>
                <![endif]-->
            </td>
        </tr>
    </table>
</#macro>