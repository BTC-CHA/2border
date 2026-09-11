from pathlib import Path

path = Path('app/verifyx/teacher/teacher-ui.css')
text = path.read_text(encoding='utf-8')
marker = 'VERIFYX_ASSIGNMENT_WIDTH_ALIGN_V1'
if marker in text:
    print('already applied')
    raise SystemExit(0)

block = r'''

/* VERIFYX_ASSIGNMENT_WIDTH_ALIGN_V1
   Keep Create Assignment sections on one desktop working-width line. UI-only. */
@media (min-width:901px){
  .vx-create-panel>.vx-form{
    width:min(856px,100%)!important;
    max-width:856px!important;
    min-width:0!important;
  }
  .vx-create-panel .vx-form>.vx-form-row{
    width:100%!important;
    max-width:100%!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    justify-content:stretch!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel textarea[name="description"]{
    width:100%!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>.vx-card{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>.vx-card .vx-form-row{
    width:100%!important;
    max-width:100%!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>.vx-card input,
  .vx-create-panel .vx-form>.vx-card select,
  .vx-create-panel .vx-form>.vx-card textarea{
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }

  /* Scoring rows must stay inside the scoring card. */
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div{
    width:100%!important;
    max-width:100%!important;
    grid-template-columns:minmax(160px,1.45fr) minmax(120px,150px) minmax(95px,115px) minmax(120px,145px)!important;
    gap:10px 12px!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div>*{
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div button{
    width:100%!important;
    min-width:0!important;
    white-space:normal!important;
  }

  /* Target section follows the same working width and long names wrap safely. */
  .vx-create-panel .vx-form>div:has(>.vx-kicker){
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>div:has(>.vx-kicker)>.vx-list{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
  }
  .vx-create-panel .vx-form>div:has(>.vx-kicker)>.vx-list>label{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
  }
  .vx-create-panel .vx-form>div:has(>.vx-kicker)>.vx-list>label span{
    min-width:0!important;
    overflow-wrap:anywhere!important;
  }

  .vx-create-panel .vx-form>button[type="submit"]{
    width:fit-content!important;
    max-width:100%!important;
    min-width:180px!important;
    justify-self:start!important;
  }
}
'''

path.write_text(text.rstrip() + block.rstrip() + '\n', encoding='utf-8')
print('applied', marker)
