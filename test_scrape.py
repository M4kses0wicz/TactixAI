import requests
import urllib.parse
import re

keyword = 'Kylian Mbappe'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
matches = re.findall(r'<img[^>]*src=[\"\']([^\"]+)[\"\'][^>]*>', res.text)
for m in matches:
    if 'faces' in m or 'player' in m:
        print(m)
