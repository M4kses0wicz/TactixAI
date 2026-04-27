
import requests
import urllib.parse
from bs4 import BeautifulSoup

keyword = 'Kylian Mbappe'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')
player = soup.select_one('.name')
if player:
    print(player)

