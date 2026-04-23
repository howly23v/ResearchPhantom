import json
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Using plain string replacement for 'と' -> 'マサチューセッツ工科大学'
new_html = html_content.replace('"name_ja": "と"', '"name_ja": "マサチューセッツ工科大学"')
new_html = new_html.replace('"institution_ja": "と"', '"institution_ja": "マサチューセッツ工科大学"')

# Also 'Stanford University' -> 'スタンフォード大学' for name_ja
new_html = new_html.replace('"name_ja": "Stanford University"', '"name_ja": "スタンフォード大学"')
new_html = new_html.replace('"institution_ja": "Stanford University"', '"institution_ja": "スタンフォード大学"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print("String replaced names.")
