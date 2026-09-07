from pathlib import Path

page = Path('app/verifyx/teacher/results/page.js')
css = Path('app/verifyx/teacher/teacher-ui.css')

text = page.read_text(encoding='utf-8')
marker = 'vx-result-student-main'
if marker not in text:
    old_article = '<article className="vx-card" key={g.key}'
    new_article = '<article className="vx-card vx-result-student-card" key={g.key}'
    if old_article not in text:
        raise SystemExit('results card article anchor not found')
    text = text.replace(old_article, new_article, 1)

    old_grid = "<div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:14,alignItems:'center'}}>"
    new_grid = "<div className=\"vx-result-student-main\" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:14,alignItems:'center'}}>"
    if old_grid not in text:
        raise SystemExit('results card grid anchor not found')
    text = text.replace(old_grid, new_grid, 1)
    page.write_text(text, encoding='utf-8')

css_text = css.read_text(encoding='utf-8')
css_marker = 'VERIFYX_RESULTS_RESPONSIVE_V1'
if css_marker not in css_text:
    css_text += """
/* VERIFYX_RESULTS_RESPONSIVE_V1 */
.vx-result-student-card,.vx-result-student-main{min-width:0}
@media(max-width:700px){
  .vx-result-student-card{padding:12px!important}
  .vx-result-student-main{grid-template-columns:minmax(0,1fr)!important;gap:11px!important;align-items:stretch!important}
  .vx-result-student-main>div{min-width:0}
  .vx-result-student-main>div:first-child{width:100%}
  .vx-result-student-main>div:last-child{width:100%;justify-content:space-between;flex-wrap:wrap;gap:8px!important}
  .vx-result-student-card .vx-tags{gap:5px}
  .vx-result-student-card .vx-tags span{max-width:100%;overflow-wrap:anywhere}
  .vx-result-student-card b,.vx-result-student-card div{overflow-wrap:anywhere}
  .vx-shell-nav{scroll-padding-inline:8px;padding-inline:4px;box-sizing:border-box}
  .vx-shell-nav a{flex:0 0 auto}
}
@media(max-width:430px){
  .vx-result-student-main>div:last-child{display:grid!important;grid-template-columns:minmax(0,1fr) auto;align-items:center!important}
  .vx-result-student-main>div:last-child>div{justify-self:start;max-width:100%}
  .vx-result-student-main>div:last-child>button{justify-self:end;margin:0!important}
}
"""
    css.write_text(css_text, encoding='utf-8')

print('VerifyX teacher Results responsive card patch applied')
