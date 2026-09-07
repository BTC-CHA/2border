from pathlib import Path

path = Path('app/verifyx/teacher/question-bank/page.js')
text = path.read_text(encoding='utf-8')
old = "function prefixForCategory(category){return category==='assembly'?'ASM':category==='drawing'?'DRAW':category==='sheet_metal'?'SHEET':category==='surface'?'SURF':'PART'}"
new = "function prefixForCategory(category){return category==='assembly'?'ASSY':category==='drawing'?'DRAW':category==='sheet_metal'?'SHEET':category==='surface'?'SURF':'PART'}"
if old not in text:
    raise SystemExit('prefixForCategory target not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patched', path)
