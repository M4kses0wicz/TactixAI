import requests
import urllib.parse
import re

keyword = 'Wojciech Szczesny'
url = f'https://fminside.net/players?search={urllib.parse.quote(keyword)}'
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get(url, headers=headers)

# Find the block containing the search results
# Usually it's in a list or table
matches = re.findall(r'<span class=\"name\">.*?<a href=\"[^\"]+\" title=\"([^\"]+)\".*?<img[^>]*src=[\"\'](//img\.fminside\.net/faces[^\"\']+)[\"\']', res.text, re.DOTALL | re.IGNORECASE)

if matches:
    print('Found via span name:', matches[0])
else:
    # Let's just find the first player row
    player_rows = re.findall(r'<span class=\"name\">.*?<a href=\"/players/[^\"]+\"[^>]*>([^<]+)</a>', res.text)
    print('Player rows found:', player_rows[:5])

    player_imgs = re.findall(r'<span class=\"name\">.*?<img[^>]*src=[\"\'](//img\.fminside\.net/faces[^\"\']+)[\"\']', res.text)
    print('Player imgs found:', player_imgs[:5])
