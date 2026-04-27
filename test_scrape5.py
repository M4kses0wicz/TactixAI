
import requests
import urllib.parse
from bs4 import BeautifulSoup

keyword = 'Kylian Mbappe'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')
row = soup.select_one('li.player') or soup.select_one('div.player') or soup.select_one('.player-row') or soup.select_one('.title')
if not row:
    row = soup.select_one('span.name').parent.parent.parent

if row:
    img = row.select_one('img')
    print('Found img:', img.get('src') if img else 'None')
else:
    print('Row not found')

