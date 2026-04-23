import json
import re
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

with open('papers_data.json', 'r', encoding='utf-8') as f:
    papers_data = json.load(f)

# Need to format papers_data properly
country_info = {
    "US": {"flag": "🇺🇸", "name_ja": "アメリカ", "name_en": "United States"},
    "China": {"flag": "🇨🇳", "name_ja": "中国", "name_en": "China"},
    "Japan": {"flag": "🇯🇵", "name_ja": "日本", "name_en": "Japan"},
    "Korea": {"flag": "🇰🇷", "name_ja": "韓国", "name_en": "South Korea"},
    "Russia": {"flag": "🇷🇺", "name_ja": "ロシア", "name_en": "Russia"}
}

all_countries_data = {}
all_papers_list = []
for c, insts in papers_data.items():
    c_data = {
        "flag": country_info[c]["flag"],
        "name_ja": country_info[c]["name_ja"],
        "name_en": country_info[c]["name_en"],
        "institutions": {}
    }
    for inst_name, papers in insts.items():
        # Get institution_ja from first paper, or just use inst_name if empty
        inst_ja = papers[0]["institution_ja"] if papers else inst_name
        c_data["institutions"][inst_name] = {
            "name_ja": inst_ja,
            "papers": papers
        }
        all_papers_list.extend(papers)
    all_countries_data[c] = c_data

seed_data = {
    "last_updated": "2026-03-25T18:00:00.000Z",
    "countries": all_countries_data
}

seed_data_json = json.dumps(seed_data, ensure_ascii=False, indent=2)

# Replace SEED_DATA
new_html = re.sub(r'const SEED_DATA = \{[\s\S]*?\};\n\n// ============ STATE ============',
                  f'const SEED_DATA = {seed_data_json};\n\n// ============ STATE ============',
                  html_content)

# Update ticker
headlines = []
for p in all_papers_list[:10]:
    country_flag = country_info[p["country"]]["flag"]
    headlines.append(f"{country_flag} {p['institution_ja']}: {p['title']}")
ticker_text = '⚡ ' + ' ⚡ '.join(headlines) + ' ⚡ TAKE YOUR TIME. ⚡'

ticker_start_tag = '<div class="ticker-content" id="ticker-content">'
ticker_end_tag = '</div>'
t_start = new_html.find(ticker_start_tag)
t_end = new_html.find(ticker_end_tag, t_start)
if t_start != -1 and t_end != -1:
    new_html = new_html[:t_start + len(ticker_start_tag)] + "\n    " + ticker_text + "\n  " + new_html[t_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print("Replaced!")
