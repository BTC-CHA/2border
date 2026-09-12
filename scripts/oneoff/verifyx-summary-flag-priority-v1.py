from pathlib import Path

path = Path('app/verifyx/student/assignment/[id]/page.js')
text = path.read_text(encoding='utf-8')
old = "function itemState(item){const saved=!!answers[item.item_id]?.saved;if(!saved)return 'unanswered';if(item.is_flagged)return 'flagged';return 'answered'}"
new = "function itemState(item){const saved=!!answers[item.item_id]?.saved;if(item.is_flagged)return 'flagged';if(!saved)return 'unanswered';return 'answered'}"
if old not in text:
    if new in text:
        print('already applied')
        raise SystemExit(0)
    raise SystemExit('target itemState implementation not found')
path.write_text(text.replace(old,new,1), encoding='utf-8')
print('applied VERIFYX_SUMMARY_FLAG_PRIORITY_V1')
