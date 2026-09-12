from pathlib import Path

path = Path('app/verifyx/student/page.js')
text = path.read_text(encoding='utf-8')
old = "<p>{profile.institution_name} · {profile.full_name} · {profile.student_code}</p>"
new = "<div style={{display:'grid',gap:3,marginTop:6,fontSize:13,color:'#705b50'}}><div><b>School Code :</b> {profile.institution_code}</div><div><b>ชื่อ :</b> {profile.full_name}</div><div><b>รหัสนักศึกษา :</b> {profile.student_code}</div></div>"
if old not in text:
    raise SystemExit('target header profile line not found')
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patched student profile labels')
