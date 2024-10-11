import csv
import requests

CSV_FILE = "voucher_csv_exemple.csv"
API = "http://localhost:3002/vouchers"
API_KEY = "apikey"

headers = {
    "X-API-Key": API_KEY
}
with open(CSV_FILE, 'r') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for line in reader:
        json_params = {
            "value": line['Code'],
            "amount": line['Value']
        }
        res = requests.post(API, json=json_params, headers=headers)
        if res.status_code < 300:
            print(res.json())
        else:
            print("Error, " + res.text)