# coding: utf-8

# This file contains the main examples of API usage as a reminder
# An API explorer is also available at API_HOST/explorer for a complete documentation


import requests

API_HOST = "http://localhost:3002"
API_KEY = ""

headers = {
    "X-API-Key": API_KEY
}

# Add a new incentive to track
url = API_HOST + "/tracked-incentives"
json_params = {
    incentiveId: "67378718fce6b98d279a0f27", # Incentive id, required
    ccContacts: "hello@test.com,hello2@test.com", # Comma separated list of emails, optional
}
res = requests.post(url, json=json_params, headers=headers)
print(res.json())


# Check status of a tracked incentive
url = API_HOST + "/tracked-incentives/67378718fce6b98d279a0f27"
res = requests.get(url, headers=headers)
print(res.json())

# Expected response:
# {
#     "id": 1,
#     "incentiveId": "67378718fce6b98d279a0f27",
#     "lastReadTime": "2021-03-09T15:00:00.000Z", # Last time the subscriptions were checked
#     "lastNbSubs": 0, # Total number of VALIDEE subscriptions during the last check
#     "nbSubsHandled": 0, # Total number of subscriptions handled
#     "ccContacts": "hello@test.com,hello2@test.com"
# }

# Check vouchers usage
url = API_HOST + "/vouchers"
res = requests.get(url, headers=headers)
print(res.json())

# Expected response:
# [{
#     "id": 1,
#     "value": "4A2NN3ES",
#     "amount": "30.00",
#     "status": "USED",
#     "subscriptionId": "66e32c5974df3754b04faba0",
#     "citizenId": "802ac8b1-cde8-42f2-b310-a1c0380018d8",
#     "incentiveId": "67378718fce6b98d279a0f27" # Incentive id
# }]