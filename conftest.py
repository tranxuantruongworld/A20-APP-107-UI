import sys
from pathlib import Path

# Ensure the project root is on sys.path so `src` is importable
# when running `pytest` directly (without `python -m pytest`).
sys.path.insert(0, str(Path(__file__).resolve().parent))
