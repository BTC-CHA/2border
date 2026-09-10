from pathlib import Path

p=Path('app/verifyx/verifyx-round2.css')
s=p.read_text(encoding='utf-8')
marker='/* VERIFYX_STUDENT_EXAM_CONTROLS_CENTER_V1 */'
if marker not in s:
    s += '''\n\n/* VERIFYX_STUDENT_EXAM_CONTROLS_CENTER_V1 */\n@media(min-width:701px){\n .vx-cad-save-btn{margin:10px auto 0!important;justify-content:center!important;}\n .vx-exam-footer{justify-content:center!important;}\n .vx-exam-navcluster{flex:0 0 auto;}\n .vx-exam-flag-btn{margin-left:0!important;}\n}\n'''
    p.write_text(s,encoding='utf-8')
