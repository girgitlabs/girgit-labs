"""Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver)."""
import urllib.request
import json
import sys

KEY = "c83a71b29d4e41f0b65a8e23f901c5d7"
HOST = "www.girgitlabs.design"
URLS = [
    "https://www.girgitlabs.design/",
    "https://www.girgitlabs.design/work/clay-and-glaze/",
    "https://www.girgitlabs.design/work/ld-screw/",
    "https://www.girgitlabs.design/work/moshi/",
]

def submit():
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": URLS,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"IndexNow submission response: {resp.status} ({resp.reason})")
            if resp.status in (200, 202):
                print("IndexNow successfully accepted the URL list for instant indexing.")
    except urllib.error.HTTPError as e:
        print(f"IndexNow HTTP error: {e.code} - {e.read().decode('utf-8', errors='ignore')}")
    except Exception as e:
        print(f"IndexNow request error: {e}")

if __name__ == "__main__":
    submit()
