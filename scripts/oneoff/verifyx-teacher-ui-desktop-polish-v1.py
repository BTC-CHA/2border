from pathlib import Path

path = Path('app/verifyx/teacher/teacher-ui.css')
text = path.read_text(encoding='utf-8')
marker = 'VERIFYX_TEACHER_DESKTOP_POLISH_V1'
if marker in text:
    print('already applied')
    raise SystemExit(0)

block = r'''

/* VERIFYX_TEACHER_DESKTOP_POLISH_V1
   Desktop/NB visual polish only. No workflow, scoring, data, or behavior changes. */
@media (min-width:901px){
  /* Top teacher navigation: easier to read without changing navigation structure */
  .vx-teacherbar-inner{min-height:72px!important;gap:18px!important}
  .vx-shell-mark{width:40px!important;height:40px!important;font-size:14px!important}
  .vx-shell-brand b{font-size:16px!important;color:#352821!important}
  .vx-shell-brand small{font-size:10.5px!important;color:#755f53!important}
  .vx-shell-nav{gap:5px!important}
  .vx-shell-nav a{font-size:12.5px!important;padding:10px 12px!important;gap:7px!important;color:#59463c!important;font-weight:800!important}
  .vx-shell-nav a svg{width:17px!important;height:17px!important}
  .vx-shell-nav a.active{background:#f28f57!important;color:#fff!important;box-shadow:0 6px 14px rgba(217,123,69,.15)!important}
  .vx-shell-nav a:hover{background:#fff0e6!important;color:#a9562d!important}
  .vx-shell-logout{font-size:12px!important;padding:9px 12px!important;color:#9c542e!important}

  /* Readability / contrast inside teacher cards */
  .vx-card{color:#3d3029!important}
  .vx-card h2,.vx-card h3,.vx-item h3,.vx-assignment-title-row h3{color:#332720!important}
  .vx-card p,.vx-item p,.vx-assignment-copy>p,.vx-assignment-note{color:#705b50!important}
  .vx-overview-strip small{font-size:10.5px!important;color:#6f5a4f!important}
  .vx-assignment-meta span,.vx-tags span{color:#674b3b!important;background:#fff3ea!important;border-color:#efd8c8!important}

  /* Form labels and controls: readable, compact and not stretched across the page */
  .vx-card .vx-form label,.vx-card .vx-form-row label{font-size:12.5px!important;line-height:1.35!important;color:#403129!important;font-weight:850!important}
  .vx-card .vx-form input:not([type="checkbox"]):not([type="radio"]),
  .vx-card .vx-form textarea,
  .vx-card .vx-form select,
  .vx-card .vx-form-row input:not([type="checkbox"]):not([type="radio"]),
  .vx-card .vx-form-row textarea,
  .vx-card .vx-form-row select{
    min-height:42px!important;
    padding:9px 11px!important;
    font-size:14px!important;
    color:#342821!important;
    background:#fffdfa!important;
    border-color:#dfc8ba!important;
  }
  .vx-card .vx-form input::placeholder,.vx-card .vx-form textarea::placeholder{color:#a38d80!important}
  .vx-card .vx-form-row{grid-template-columns:repeat(auto-fit,minmax(240px,380px))!important;justify-content:start!important;gap:12px 14px!important}

  /* Teacher buttons: content-sized instead of oversized */
  .vx-page .vx-btn,.vx-page .vx-link{min-height:38px;padding:8px 13px;font-size:12px}
  .vx-card>.vx-btn,.vx-card>.vx-link,.vx-toolbar .vx-btn,.vx-toolbar .vx-link{width:auto!important;min-width:0!important}
  .vx-create-btn{min-width:155px!important;width:auto!important}
  .vx-assignment-actions .vx-link{min-height:34px!important;padding:7px 10px!important;font-size:11px!important}

  /* Create Assignment: use a controlled working width */
  .vx-create-panel{padding:20px 22px!important}
  .vx-create-panel>.vx-form{max-width:1080px!important}
  .vx-create-panel .vx-form>.vx-form-row{grid-template-columns:repeat(2,minmax(260px,420px))!important;justify-content:start!important;gap:12px 16px!important}
  .vx-create-panel textarea[name="description"]{max-width:856px!important}
  .vx-create-panel .vx-form>.vx-card{max-width:980px!important;padding:16px!important}
  .vx-create-panel .vx-form>.vx-card .vx-form-row{grid-template-columns:repeat(2,minmax(220px,350px))!important;justify-content:start!important;gap:10px 14px!important}
  .vx-create-panel .vx-checkline{max-width:520px!important}
  .vx-create-panel .vx-form>button[type="submit"]{width:auto!important;min-width:180px!important;justify-self:start!important}

  /* Scoring card: four balanced columns instead of giant inputs/buttons */
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top){max-width:940px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>.vx-top{align-items:center!important;margin-bottom:8px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>.vx-top p{max-width:620px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>.vx-top button{width:auto!important;min-height:36px!important;padding:7px 11px!important;font-size:11.5px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div{
    grid-template-columns:minmax(190px,1.5fr) 160px 120px 150px!important;
    gap:10px 14px!important;
    align-items:center!important;
    padding:10px 0!important;
  }
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div label{max-width:160px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div input[type="number"]{max-width:150px!important;min-height:38px!important}
  .vx-create-panel .vx-form>.vx-card:has(>.vx-top)>div:nth-child(2)>div button{width:auto!important;min-width:140px!important;min-height:36px!important;padding:7px 10px!important;font-size:11px!important}
}

/* Keep the existing responsive structure on smaller screens; only improve legibility slightly. */
@media (max-width:900px){
  .vx-shell-nav a{font-size:10.5px!important}
  .vx-card .vx-form label,.vx-card .vx-form-row label{font-size:12px!important}
}
'''

path.write_text(text.rstrip() + block.rstrip() + '\n', encoding='utf-8')
print('applied', marker)
