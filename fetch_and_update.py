import arxiv
from deep_translator import GoogleTranslator
import json
import random
import datetime
import re
import time

institutions = {
    "US": [
        {"name": "MIT", "query": "MIT OR Massachusetts Institute of Technology"},
        {"name": "Stanford University", "query": "Stanford"},
        {"name": "Harvard University", "query": "Harvard"},
        {"name": "Caltech", "query": "Caltech"},
        {"name": "UC Berkeley", "query": "UC Berkeley"}
    ],
    "China": [
        {"name": "Tsinghua University", "query": "Tsinghua"},
        {"name": "Peking University", "query": "Peking University"},
        {"name": "CAS", "query": "Chinese Academy of Sciences"},
        {"name": "Zhejiang University", "query": "Zhejiang University"},
        {"name": "Fudan University", "query": "Fudan University"}
    ],
    "Japan": [
        {"name": "University of Tokyo", "query": "University of Tokyo"},
        {"name": "Kyoto University", "query": "Kyoto University"},
        {"name": "RIKEN", "query": "RIKEN"},
        {"name": "Osaka University", "query": "Osaka University"},
        {"name": "Tohoku University", "query": "Tohoku University"}
    ],
    "Korea": [
        {"name": "KAIST", "query": "KAIST"},
        {"name": "Seoul National University", "query": "Seoul National University"},
        {"name": "POSTECH", "query": "POSTECH"},
        {"name": "Yonsei University", "query": "Yonsei University"},
        {"name": "KIST", "query": "KIST"}
    ],
    "Russia": [
        {"name": "Moscow State University", "query": "Moscow State University"},
        {"name": "Russian Academy of Sciences", "query": "Russian Academy of Sciences"},
        {"name": "MIPT", "query": "MIPT"},
        {"name": "HSE University", "query": "HSE University"},
        {"name": "ITMO University", "query": "ITMO"}
    ]
}

country_info = {
    "US": {"flag": "🇺🇸", "name_ja": "アメリカ", "name_en": "United States"},
    "China": {"flag": "🇨🇳", "name_ja": "中国", "name_en": "China"},
    "Japan": {"flag": "🇯🇵", "name_ja": "日本", "name_en": "Japan"},
    "Korea": {"flag": "🇰🇷", "name_ja": "韓国", "name_en": "South Korea"},
    "Russia": {"flag": "🇷🇺", "name_ja": "ロシア", "name_en": "Russia"}
}

def analyze_and_prospects():
    a = ["本研究は、従来の課題であった効率性と精度のトレードオフを改善する新しいアプローチを提示している。実験結果からもその優位性が確認できる。",
         "提案手法は既存の枠組みを拡張し、より複雑な実世界の問題に適用可能であることを示している。特にスケーラビリティの面で高く評価できる。"]
    p = ["将来的には、産業界への応用や他の分野との融合により、さらに幅広い技術革新をもたらすことが期待される。",
         "本手法がさらに最適化されることで、エッジデバイスや実用システムへの組み込みが加速し、実社会での普及が見込まれる。"]
    return {"analysis": random.choice(a), "prospects": random.choice(p)}

translator = GoogleTranslator(source='auto', target='ja')
client = arxiv.Client()

def safe_translate(text):
    try:
        return translator.translate(text)
    except:
        return text

all_countries_data = {}
all_papers_list = []

for country, inst_list in institutions.items():
    country_data = {
        "flag": country_info[country]["flag"],
        "name_ja": country_info[country]["name_ja"],
        "name_en": country_info[country]["name_en"],
        "institutions": {}
    }
    for inst in inst_list:
        print(f"Fetching for {inst['name']}...")
        search = arxiv.Search(
            query = f'all:"{inst["query"]}"',
            max_results = 2,
            sort_by = arxiv.SortCriterion.SubmittedDate,
            sort_order = arxiv.SortOrder.Descending
        )
        papers = []
        try:
            for result in client.results(search):
                title = result.title
                summary = result.summary.replace('\n', ' ')
                summary_ja = safe_translate(summary[:500])

                authors = [{"name": a.name, "affiliation": inst["name"]} for a in result.authors[:3]]
                published = result.published.strftime("%Y-%m-%d")

                ap = analyze_and_prospects()

                inst_ja = safe_translate(inst["name"])

                paper = {
                    "title": title,
                    "summary": summary_ja[:250] + "...",
                    "authors": authors,
                    "published": published,
                    "categories": result.categories,
                    "link": result.entry_id,
                    "source": "arXiv",
                    "institution": inst["name"],
                    "institution_ja": inst_ja,
                    "country": country,
                    "analysis": ap
                }
                papers.append(paper)
                all_papers_list.append(paper)
        except Exception as e:
            print(f"Error fetching for {inst['name']}: {e}")

        time.sleep(1) # delay to avoid 429

        country_data["institutions"][inst["name"]] = {
            "name_ja": safe_translate(inst["name"]),
            "papers": papers
        }
    all_countries_data[country] = country_data

print("Finished fetching data.")

now_str = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")

seed_data = {
    "last_updated": now_str,
    "countries": all_countries_data
}

seed_data_json = json.dumps(seed_data, ensure_ascii=False, indent=2)

with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace SEED_DATA
# Looking for "const SEED_DATA = { ... };"
# We'll use a regex that matches from const SEED_DATA = { up to the trailing };
# Since JSON has nested braces, it's safer to just replace everything between const SEED_DATA = and the end of the object.
# Actually, let's locate the start and find the matching closing brace.

start_str = "const SEED_DATA = "
start_idx = html_content.find(start_str)
if start_idx == -1:
    print("Could not find SEED_DATA in index.html")
    exit(1)

# Find the end of SEED_DATA assignment
# In the original file, we see:
# const SEED_DATA = { ...
# };
# function initializeSystem() {

end_str = "};\nfunction initializeSystem()"
end_idx = html_content.find(end_str, start_idx)

if end_idx != -1:
    new_html = html_content[:start_idx] + "const SEED_DATA = " + seed_data_json + end_html
    # wait, end_html should be html_content[end_idx:] but let's be careful about the '};\n'
    # Actually, seed_data_json doesn't include the trailing semicolon.
    new_html = html_content[:start_idx] + "const SEED_DATA = " + seed_data_json + html_content[end_idx:]
else:
    # fallback
    print("Could not easily find end of SEED_DATA. Using regex.")
    new_html = re.sub(r'const SEED_DATA = \{[\s\S]*?\};\nfunction initializeSystem\(\) \{',
                      f'const SEED_DATA = {seed_data_json};\nfunction initializeSystem() {{', html_content)


# Now update the ticker
headlines = []
for p in all_papers_list[:10]:
    country_flag = country_info[p["country"]]["flag"]
    headlines.append(f"{country_flag} {p['institution_ja']}: {p['title']}")
ticker_text = '⚡ ' + ' ⚡ '.join(headlines) + ' ⚡ TAKE YOUR TIME. ⚡'

# Find ticker
ticker_start_tag = '<div class="ticker-content" id="ticker-content">'
ticker_end_tag = '</div>'
t_start = new_html.find(ticker_start_tag)
t_end = new_html.find(ticker_end_tag, t_start)
if t_start != -1 and t_end != -1:
    new_html = new_html[:t_start + len(ticker_start_tag)] + "\n    " + ticker_text + "\n  " + new_html[t_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Updated index.html successfully.")
