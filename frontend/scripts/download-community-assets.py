"""Download the bundled demonstration portraits and article photographs."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parents[1] / "public"
PHOTOS = {
    "avatars/100.jpg": "photo-1535713875002-d1d0cf377fde",
    "avatars/101.jpg": "photo-1472099645785-5658abf4ff4e",
    "avatars/102.jpg": "photo-1494790108377-be9c29b29330",
    "avatars/103.jpg": "photo-1506794778202-cad84cf45f1d",
    "avatars/104.jpg": "photo-1534528741775-53994a69daeb",
    "avatars/105.jpg": "photo-1500648767791-00dcc994a43e",
    "avatars/106.jpg": "photo-1517841905240-472988babdf9",
    "avatars/107.jpg": "photo-1508214751196-bcfd4ca60f91",
    "avatars/108.jpg": "photo-1524504388940-b1c1722653e1",
    "avatars/109.jpg": "photo-1519085360753-af0119f7cbe7",
    "avatars/110.jpg": "photo-1544005313-94ddf0286df2",
    "images/coding.jpg": "photo-1498050108023-c5249f4df085",
    "images/workspace.jpg": "photo-1499750310107-5fef28a66643",
    "images/city.jpg": "photo-1449824913935-59a10b8d2000",
    "images/coffee.jpg": "photo-1442512595331-e89e73853f31",
    "images/notes.jpg": "photo-1455390582262-044cdead277a",
}

def download(item):
    filename, photo = item
    target = ROOT / filename
    if target.exists() and target.stat().st_size:
        return f"{filename}: already bundled"
    target.parent.mkdir(parents=True, exist_ok=True)
    portrait = filename.startswith("avatars/")
    options = "w=160&h=160&crop=faces" if portrait else "w=850"
    url = f"https://images.unsplash.com/{photo}?auto=format&fit=crop&{options}&q=85"
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as response:
        if not response.headers.get("Content-Type", "").startswith("image/"):
            raise ValueError(f"{filename}: response is not an image")
        payload = response.read()
    target.write_bytes(payload)
    return f"{filename}: {len(payload)} bytes"

if __name__ == "__main__":
    failures = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(download, item): item[0] for item in PHOTOS.items()}
        for future in as_completed(futures):
            try:
                print(future.result(), flush=True)
            except Exception as error:
                failures.append(futures[future])
                print(f"FAILED {futures[future]}: {error}", flush=True)
    if failures:
        raise SystemExit(f"Missing assets: {', '.join(failures)}")
