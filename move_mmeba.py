import shutil
from pathlib import Path
root = Path(r"c:\Users\ousma\Desktop\parfumerie")
src = root / "mmeba"
frontend = root / "frontend"
backend = root / "backend"
frontend.mkdir(exist_ok=True)
backend.mkdir(exist_ok=True)
frontend_items = [
    "src",
    "public",
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "package-lock.json",
    ".env.example",
    ".gitignore",
    "bunfig.toml",
    "eslint.config.js",
    ".prettierignore",
    ".prettierrc",
    ".lovable",
]
backend_items = ["scripts", "database"]
for name in frontend_items:
    p = src / name
    if not p.exists():
        continue
    d = frontend / name
    if d.exists():
        if d.is_dir():
            shutil.rmtree(d)
        else:
            d.unlink()
    shutil.move(str(p), str(d))
for name in backend_items:
    p = src / name
    if not p.exists():
        continue
    d = backend / name
    if d.exists():
        if d.is_dir():
            shutil.rmtree(d)
        else:
            d.unlink()
    shutil.move(str(p), str(d))
root_env = src / ".env"
if root_env.exists():
    dest_env = backend / ".env"
    if dest_env.exists():
        dest_env.unlink()
    shutil.move(str(root_env), str(dest_env))
frontend_env = frontend / ".env"
frontend_env.write_text("VITE_API_URL=http://localhost:5000/api\n", encoding="utf-8")
print("move complete")
