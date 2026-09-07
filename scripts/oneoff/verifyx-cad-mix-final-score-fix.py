from pathlib import Path
p=Path('scripts/oneoff/verifyx-cad-mix-final-score.py')
s=p.read_text(encoding='utf-8')
old='"  ));\\n  setLoading(false)\\n }",\n    "  ));\\n  if(xs[0]?.progress_status===\'final\'){const {data:summary}=await vx.rpc(\'vx_student_final_summary_auth\',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null)}else setFinalSummary(null);\\n  setLoading(false)\\n }",'
new='"  )));\\n  setLoading(false)\\n }",\n    "  )));\\n  if(xs[0]?.progress_status===\'final\'){const {data:summary}=await vx.rpc(\'vx_student_final_summary_auth\',{p_assignment_id:assignmentId});setFinalSummary(summary?.[0]||null)}else setFinalSummary(null);\\n  setLoading(false)\\n }",'
if old not in s:
    raise SystemExit('patch-script fix target not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('patch script corrected for setAnswers closing parenthesis')
