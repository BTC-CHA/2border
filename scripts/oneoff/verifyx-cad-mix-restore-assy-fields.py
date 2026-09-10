from pathlib import Path

p = Path('app/verifyx/teacher/teacher-ui.css')
s = p.read_text(encoding='utf-8')

old = ".vx-create-panel .vx-form>.vx-card .vx-form-row{grid-template-columns:1fr!important}.vx-create-panel .vx-form>.vx-card .vx-form-row>label:nth-child(2){display:none!important}"
new = ".vx-create-panel .vx-form>.vx-card .vx-form-row{grid-template-columns:repeat(2,minmax(0,1fr))!important}.vx-create-panel .vx-form>.vx-card .vx-form-row>label{display:grid!important}"

if old not in s:
    raise SystemExit('CAD MIX hidden-field CSS anchor not found')
s = s.replace(old, new, 1)

marker = '@media(max-width:700px){'
mobile = '@media(max-width:700px){.vx-create-panel .vx-form>.vx-card .vx-form-row{grid-template-columns:1fr!important}'
if mobile not in s:
    if marker not in s:
        raise SystemExit('700px media anchor not found')
    s = s.replace(marker, mobile, 1)

p.write_text(s, encoding='utf-8')
print('VERIFYX_CAD_MIX_RESTORE_ASSY_FIELDS_OK')
