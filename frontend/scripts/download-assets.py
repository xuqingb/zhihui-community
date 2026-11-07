"""Fetch the presentation photos once. Images are bundled locally at runtime."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parents[1] / "public" / "images"
ASSETS = {
    "mountains.jpg": ("photo-1470770841072-f978cf4d019e", 1600),
    "forest.jpg": ("photo-1441974231531-c6227db76b6e", 850),
    "architecture.jpg": ("photo-1487958449943-2429e8be8625", 850),
    "reading.jpg": ("photo-1481627834876-b7833e8f5570", 850),
    "sea.jpg": ("photo-1518837695005-2083093ee35b", 850),
}

def download(entry):
    filename, (photo, width) = entry
    target = ROOT / filename
    if not target.exists():
        urlretrieve(f"https://images.unsplash.com/{photo}?auto=format&fit=crop&w={width}&q=85", target)
    return f"{filename}: {target.stat().st_size} bytes"

if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(download, ASSETS.items()):
            print(result)
