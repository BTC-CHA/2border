from pathlib import Path

path = Path('app/verifyx/student/page.js')
text = path.read_text(encoding='utf-8')
old = "<div style={{display:'grid',gap:3,marginTop:6,fontSize:13,color:'#705b50'}}><div><b>School Code :</b> {profile.institution_code}</div><div><b>ชื่อ :</b> {profile.full_name}</div><div><b>รหัสนักศึกษา :</b> {profile.student_code}</div></div>"
new = "<div style={{display:'grid',gap:3,marginTop:6,fontSize:13,color:'#705b50'}}><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap'}}><b>School Code :</b><span>{profile.institution_code}</span></div><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap'}}><b>ชื่อ :</b><span>{profile.full_name}</span></div><div style={{display:'flex',gap:4,alignItems:'baseline',whiteSpace:'nowrap',fontSize:12.5}}><b>รหัสนักศึกษา :</b><span>{profile.student_code}</span></div></div>"
if new in text:
    print('already applied')
    raise SystemExit(0)
if old not in text:
    raise SystemExit('target block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('applied student identity nowrap')
