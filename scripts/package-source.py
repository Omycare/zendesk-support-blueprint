from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root/'frontend/support-blueprint-source.zip'
ignore={'.git','node_modules','dist','.next','.sites-runtime','.wrangler','pages-dist','__pycache__'}
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(root.rglob('*')):
        rel=file.relative_to(root)
        if not file.is_file() or any(part in ignore for part in rel.parts): continue
        if rel.parts[:2]==('public','blueprint'): continue
        if file.suffix in {'.zip','.tsbuildinfo','.log'}: continue
        if file.name.startswith('.env') and file.name!='.env.example': continue
        z.write(file,Path('omycare-support-blueprint')/rel)
print(f'Source package: {out} ({out.stat().st_size} bytes)')
