import requests
import urllib.parse
import re

keyword = 'Kylian Mbappe'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
matches = re.findall(r'<span class=\"name\">([^<]+)</span>', res.text)
for m in matches:
    print("Name:", m)

matches2 = re.findall(r'<img[^>]+>', res.text)
for m in matches2:
    if 'faces' in m or 'player' in m:
        print("IMG:", m)
