import importlib.util
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

spec = importlib.util.spec_from_file_location('updater', Path(__file__).parents[1] / 'scripts/update_papers.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


def feed(items=True, category='cs.AI'):
    return f'''<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
<title>arXiv updates</title><link>https://rss.arxiv.org/rss/{category}</link>
<lastBuildDate>Mon, 05 Oct 2026 04:00:00 +0000</lastBuildDate>
{('<item><title>Test &amp; science</title><link>https://arxiv.org/abs/2610.00001v2</link>'
  '<description>arXiv:2610.00001v2 Announce Type: new Abstract: A measured result.</description>'
  '<category>cs.AI</category><dc:creator>Alice, Bob</dc:creator>'
  '<pubDate>Mon, 05 Oct 2026 00:00:00 -0400</pubDate></item>') if items else ''}
</channel></rss>'''.encode()


class DailyArchive(unittest.TestCase):
    def test_parse_and_deduplicate_cross_listings(self):
        delays = []
        papers, dates = updater.collect(fetch=lambda _: feed(), pause=delays.append)
        self.assertEqual(len(papers), 1)
        self.assertEqual(papers[0]['id'], '2610.00001')
        self.assertEqual(papers[0]['summary'], 'A measured result.')
        self.assertEqual(papers[0]['country'], 'UNKNOWN')
        self.assertEqual(set(papers[0]['categories']), set(updater.FEEDS))
        self.assertEqual(delays, [3] * (len(updater.FEEDS) - 1))

    def test_failure_leaves_catalog_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            papers, date = updater.parse_feed(feed(), 'cs.AI')
            updater.save_snapshot(papers, [date], datetime(2026, 10, 4, tzinfo=timezone.utc), root)
            before = (root / 'data/manifest.json').read_bytes()
            with self.assertRaises(ValueError):
                updater.collect(fetch=lambda _: b'<html>upstream error</html>', pause=lambda _: None)
            self.assertEqual((root / 'data/manifest.json').read_bytes(), before)

    def test_one_calendar_year_deduplication_and_jst_day(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            papers, date = updater.parse_feed(feed(), 'cs.AI')
            first = updater.save_snapshot(papers, [date], datetime(2025, 10, 4, tzinfo=timezone.utc), root)
            removed = root / first['days'][0]['path']
            changed = [dict(papers[0], title='New title')]
            updater.save_snapshot(changed, [date], datetime(2025, 10, 5, tzinfo=timezone.utc), root)
            result = updater.save_snapshot(changed, [date], datetime(2026, 10, 4, 16, tzinfo=timezone.utc), root)
            self.assertEqual([d['date'] for d in result['days']], ['2026-10-05', '2025-10-05'])
            self.assertFalse(removed.exists())
            self.assertEqual(len(list((root / 'data/snapshots').glob('*.json'))), 1)
            self.assertEqual(updater.year_ago(datetime(2024, 2, 29).date()).isoformat(), '2023-02-28')

    def test_empty_valid_feed_keeps_last_listing(self):
        self.assertEqual(updater.parse_feed(feed(False), 'cs.AI')[0], [])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            papers, date = updater.parse_feed(feed(), 'cs.AI')
            first = updater.save_snapshot(papers, [date], datetime(2026, 10, 4, tzinfo=timezone.utc), root)
            result = updater.save_snapshot([], [date], datetime(2026, 10, 5, tzinfo=timezone.utc), root)
            self.assertEqual(result['days'][0]['path'], first['days'][0]['path'])
            self.assertEqual(result['days'][0]['announcements'], 0)
            self.assertEqual(result['days'][0]['count'], 1)


if __name__ == '__main__':
    unittest.main()
