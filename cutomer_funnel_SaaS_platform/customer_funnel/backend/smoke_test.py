import json
from datetime import datetime, timezone

import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8000'


def post(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            print('POST', url, 'status=', resp.status)
            print(body)
            return resp.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print('POST HTTPError', e.code, body)
        return e.code, body
    except Exception as e:
        print('POST Error', e)
        return None, None


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            print('GET', url, 'status=', resp.status)
            print(body)
    except urllib.error.HTTPError as e:
        print('GET HTTPError', e.code, e.read().decode('utf-8'))
    except Exception as e:
        print('GET Error', e)


if __name__ == '__main__':
    status, body = post(f"{BASE}/api/projects", {'name': 'Smoke Test Project'})
    project = json.loads(body) if status and body else {}

    event = {
        'api_key': project.get('api_key', ''),
        'user_id': 'smoke-user',
        'anonymous_id': 'smoke-anon',
        'event_name': 'product_view',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'properties': {'product_id': 'SMOKE-001'},
    }

    if not event['api_key']:
        raise RuntimeError('Smoke test could not read an API key from /api/projects')

    post(f"{BASE}/api/events/track", event)
    print('\n--- Funnel ---')
    get(f"{BASE}/api/analytics/funnel")
    print('\n--- Events (filter smoke-user) ---')
    get(f"{BASE}/api/events?page=1&page_size=5&user_id=smoke-user")
