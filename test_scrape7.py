import requests
import urllib.parse
from bs4 import BeautifulSoup

keyword = 'Wojciech Szczesny'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)
soup = BeautifulSoup(res.text, 'html.parser')

player_blocks = soup.select('div.player') or soup.select('li.player') or soup.select('.player')
# But wait, .player is also used for a bunch of things.
# Let's search by name
name_span = soup.find('span', class_='name')
if name_span:
    # Try to find an img tag that might be the face, which usually is nearby
    # Check parent or previous siblings
    parent = name_span.parent
    while parent and parent.name != 'body':
        img = parent.select_one('img[src*="faces"]')
        if img:
            print("Found image via parent tree:", img['src'])
            break
        parent = parent.parent
