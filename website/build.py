"""Builds index.html from src/index.template.html by inlining the logo paths.
Run after replacing the artwork:  python build.py"""
import json, pathlib
root = pathlib.Path(__file__).parent
a = root / 'src/logo-data'
t = (root / 'src/index.template.html').read_text(encoding='utf-8')
word = json.loads((a / '_logo_raw.json').read_text())['word']
t = (t.replace('{{BODY}}', (a / '_body.txt').read_text().strip())
      .replace('{{PUPIL}}', (a / '_pupil.txt').read_text().strip())
      .replace('{{WORDMARK}}', ''.join(p[1] for p in word[2])))
(root / 'index.html').write_text(t, encoding='utf-8')
print('index.html built')
