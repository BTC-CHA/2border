from pathlib import Path

path = Path('app/verifyx/teacher/teacher-ui.css')
text = path.read_text(encoding='utf-8')
marker = 'VERIFYX_ASSIGNMENT_CENTER_PANEL_V1'
if marker in text:
    print('already applied')
    raise SystemExit(0)

block = r'''/* VERIFYX_ASSIGNMENT_CENTER_PANEL_V1
   Center the Create Assignment card on desktop/NB and remove the oversized empty right side. UI-only. */
@media (min-width:901px){
  .vx-create-panel{
    width:min(920px,100%)!important;
    max-width:920px!important;
    margin:0 auto 14px!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel>.vx-kicker,
  .vx-create-panel>h2,
  .vx-create-panel>.vx-form{
    width:min(856px,100%)!important;
    max-width:856px!important;
    margin-left:auto!important;
    margin-right:auto!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel>.vx-form{
    min-width:0!important;
  }
}'''

path.write_text(text.rstrip() + '\n\n' + block.strip() + '\n', encoding='utf-8')
print('applied', marker)
