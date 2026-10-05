"""Collect official daily arXiv RSS listings; keep a rolling calendar year.

One connection, >=3s between requests per https://info.arxiv.org/help/api/tou.html.
No LLM, key, paid API, browser-side upstream fetch, or invented affiliation.
"""
import hashlib
import html
import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from email.utils import parsedate_to_datetime
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
FEEDS = ('cs.AI', 'cs.LG', 'cs.CL', 'cs.CV', 'physics', 'hep-th', 'hep-ph',
         'hep-ex', 'hep-lat', 'astro-ph', 'q-bio', 'quant-ph', 'cond-mat', 'eess')


def plain(value):
    return ' '.join(re.sub(r'<[^>]*>', '', html.unescape(value or '')).split())


def parse_feed(raw, category):
    root = ET.fromstring(raw)
    channel = root.find('channel')
    if root.tag != 'rss' or channel is None:
        raise ValueError(f'{category}: not an RSS feed')
    if not channel.findtext('title') or not channel.findtext('link'):
        raise ValueError(f'{category}: missing channel metadata')
    papers = []
    for item in channel.findall('item'):
        link = item.findtext('link', '').replace('http://', 'https://')
        match = re.fullmatch(r'https://arxiv.org/abs/([\w./-]+)', link)
        if not match:
            raise ValueError(f'{category}: invalid paper link: {link}')
        description = plain(item.findtext('description'))
        # RSS prepends the arXiv announcement identifier/type to the abstract.
        description = re.sub(r'^arXiv:.*?Announce Type:.*?Abstract:\s*', '', description)
        cats = [plain(el.text) for el in item.findall('category') if plain(el.text)]
        if category not in cats:
            cats.append(category)
        authors = plain(item.findtext('{http://purl.org/dc/elements/1.1/}creator'))
        title = plain(item.findtext('title'))
        if not title or not description:
            raise ValueError(f'{category}: missing title/abstract')
        papers.append({
            'id': re.sub(r'v\d+$', '', match[1]), 'title': title,
            'summary': description,
            'authors': [{'name': authors}] if authors else [],
            'published': item.findtext('pubDate', '')[:],
            'categories': cats, 'link': link, 'source': 'arXiv RSS',
            'institution': 'Unverified', 'institution_ja': '所属情報未確認',
            'country': 'UNKNOWN',
            'analysis': {'analysis': '原文要旨を掲載（未翻訳・未評価）',
                         'prospects': '詳しい結果と制約は原論文をご確認ください'}
        })
    return papers, channel.findtext('lastBuildDate', '')


def year_ago(day):
    try:
        return day.replace(year=day.year - 1)
    except ValueError:  # Feb 29 -> Feb 28
        return day.replace(year=day.year - 1, day=28)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(path)


def save_snapshot(papers, feed_dates, now, root=ROOT):
    data_dir = root / 'data'
    manifest_path = data_dir / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'days': []}
    # No announcements (e.g. weekend): retain latest available listing, mark check separately.
    if not papers and manifest['days']:
        data_path = manifest['days'][0]['path']
        count = manifest['days'][0]['count']
    else:
        snapshot = {'dated': max(parsedate_to_datetime(d) for d in feed_dates).isoformat() if feed_dates else '', 'countries': {
            'UNKNOWN': {'flag': '🌐', 'name_ja': '所属・国未確認', 'name_en': 'Unverified affiliation',
                        'institutions': {'Unverified': {'name': 'Unverified', 'papers': papers}}}}}
        encoded = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')).encode()
        digest = hashlib.sha256(encoded).hexdigest()
        data_path = f'data/snapshots/{digest}.json'
        if not (root / data_path).exists():
            write_json(root / data_path, snapshot)
        count = len(papers)
    day = now.astimezone(ZoneInfo('Asia/Tokyo')).date()
    entry = {'date': day.isoformat(), 'path': data_path, 'count': count,
             'checked_at': now.isoformat(), 'feed_dates': feed_dates, 'announcements': len(papers)}
    cutoff = year_ago(day).isoformat()
    days = [entry] + [d for d in manifest['days'] if cutoff <= d['date'] < entry['date']]
    manifest = {'version': 1, 'updated_at': now.isoformat(), 'retention': '1 calendar year',
                'days': sorted(days, key=lambda d: d['date'], reverse=True)}
    # Publish catalog last. Failed acquisition never calls this function.
    write_json(manifest_path, manifest)
    referenced = {d['path'] for d in days}
    for path in (data_dir / 'snapshots').glob('*.json'):
        if path.relative_to(root).as_posix() not in referenced:
            path.unlink()
    return manifest


def collect(fetch=None, pause=time.sleep):
    def download(url):
        request = urllib.request.Request(url, headers={'User-Agent':
            'ResearchPhantom/1.0 (+https://github.com/howly23v/ResearchPhantom)'})
        with urllib.request.urlopen(request) as response:
            return response.read()
    fetch = fetch or download
    unique, dates = {}, []
    for index, category in enumerate(FEEDS):
        if index:
            pause(3)  # official arXiv minimum interval, no concurrent requests
        papers, updated = parse_feed(fetch(f'https://rss.arxiv.org/rss/{category}'), category)
        if updated:
            dates.append(updated)
        for paper in papers:
            if paper['id'] in unique:
                previous = unique[paper['id']]
                previous['categories'] = sorted(set(previous['categories'] + paper['categories']))
            else:
                unique[paper['id']] = paper
        print(f'{category}: {len(papers)} listings', flush=True)
    return list(unique.values()), sorted(set(dates))


if __name__ == '__main__':
    papers, dates = collect()
    manifest = save_snapshot(papers, dates, datetime.now(timezone.utc))
    print(f"Saved {len(papers)} unique announcements; {len(manifest['days'])} archive days")
