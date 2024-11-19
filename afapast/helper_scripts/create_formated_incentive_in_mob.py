# coding: utf-8
import requests
import json

url = "http://localhost:3000/v1/incentives"
# There is no real way of getting this token programmatically
# We suggest logging in to the admin interface, and looking in dev tools for the token query to idp auth/realms/mcm/protocol/openid-connect/token
# The response should contain an access_token usable here
token = ""

# These are found in the admin interface
funderId = "318d18d5-0d02-457e-918e-8b272251d1b2"
territoryIds = ["66e328c074df3754b04fab9e"]

title = "DOMICILE- TRAVAIL - prise en charge à 92,5%"
minAmount = "92.5%"
allocatedAmount = "92.5%"

# title = "Forfait liberté - prise en charge à 75%"
# minAmount = "75%"
# allocatedAmount = "75%"

payload = json.dumps({
  "title": title,
  "description": "Aide Tiers Payant pour l'entreprise Communauté d’Agglomération de La Rochelle\n\nDemande de prise en charge directe de la part employeur, sans avance de frais.\nRèglement du reste à charge par l'employé directement sur la boutique en ligne : boutiqueenligne.fr ou sur l'application 'BOUTIQUE'",
  "incentiveType": "AideEmployeur",
  "funderId": funderId,
  "minAmount": minAmount,
  "transportList": [
    "transportsCommun",
    "velo"
  ],
  "territoryIds": territoryIds,
  "allocatedAmount": allocatedAmount,
  "conditions": "- être employé de Communauté d’Agglomération de La Rochelle",
  "paymentMethod": "- Validation par le gestionnaire \n- Application du droit en une fois directement sur la boutique en ligne\nou\n- Règlement en une fois sous la forme d'un coupon valable sur la boutique en ligne",
  "contact": "",
  "additionalInfos": "Pour plus d'information, consultez l [aide EN LIGNE](https://moncomptemobilite.fr/) ![image TEST](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqQXCfw2Ulfrfe1xG2NGkSe7FOnT0h9AEjcQ&s)",
  "isMCMStaff": True,
  "subscriptionCheckMode": "MANUEL",
  "isCitizenNotificationsDisabled": False,
#   "subscriptionLink": "",
  "specificFields": [
    {
      "isRequired": True,
      "title": "Type d'abonnement",
      "inputFormat": "listeChoix",
      "choiceList": {
        "possibleChoicesNumber": 1,
        "inputChoiceList": [
          {
            "inputChoice": "Abonnement Yélo seul"
          },
          {
            "inputChoice": "Abonnement Yélo  + Vélo  Libre Service (VLS) à +5 €"
          }
        ]
      }
    },
  ],
})
headers = {
  'Authorization': 'Bearer ' + token,
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.json())
