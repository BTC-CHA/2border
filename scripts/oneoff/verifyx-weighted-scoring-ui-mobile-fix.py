from pathlib import Path
p=Path('app/verifyx/teacher/page.js')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
 global s
 if old not in s: raise SystemExit(f'MISSING {label}')
 s=s.replace(old,new,1)

rep("function setCadCategoryCount(category,value){setCadCounts(x=>({...x,[category]:Math.max(0,Number(value)||0)}))}",
    "function setCadCategoryCount(category,value){const n=Math.max(0,Number(value)||0);setCadCounts(x=>({...x,[category]:n}));if(!scoreAuto&&n===0)setScorePoints(x=>({...x,[category]:0}))}\n function setMcqQuestionCount(value){const n=Math.max(0,Number(value)||0);setMcqCount(n);if(!scoreAuto&&n===0)setScorePoints(x=>({...x,mcq:0}))}",
    'count handlers')

rep("onChange={e=>setMcqCount(Math.max(0,Number(e.target.value)||0))}",
    "onChange={e=>setMcqQuestionCount(e.target.value)}",
    'mcq handler')

old="<div key={k} style={{display:'grid',gridTemplateColumns:'minmax(76px,1fr) minmax(92px,1fr) minmax(92px,1fr) auto',gap:8,alignItems:'end'}}><label>{label}<input value={count} readOnly type=\"number\"/></label><label>คะแนนรวมหมวด<input value={points} onChange={e=>setScoreCategory(k,e.target.value)} type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" disabled={count===0}/></label><label>คะแนน / ข้อ<input value={count>0?per.toFixed(2):'0.00'} readOnly/></label><button type=\"button\" className=\"vx-link secondary\" style={{width:'auto',minHeight:42,padding:'8px 10px'}} disabled={count===0||scoreRemaining<=0} onClick={()=>fillScoreRemaining(k)}>เติมที่เหลือ</button></div>"
new="<div key={k} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:8,alignItems:'end',padding:'9px 0',borderBottom:'1px solid #f2e4db'}}><div><b>{label}</b><div style={{fontSize:11,color:'#927667',marginTop:3}}>{count} ข้อ · {count>0?`${per.toFixed(2)} คะแนน/ข้อ`:'ไม่มีโจทย์'}</div></div><label>คะแนนรวมหมวด<input value={points} onChange={e=>setScoreCategory(k,e.target.value)} type=\"number\" min=\"0\" max=\"100\" step=\"0.01\"/></label><div style={{fontSize:12}}>คะแนน/ข้อ <b>{count>0?per.toFixed(2):'0.00'}</b></div><button type=\"button\" className=\"vx-link secondary\" style={{width:'100%',minHeight:40,padding:'8px 10px'}} disabled={count===0||scoreRemaining<=0} onClick={()=>fillScoreRemaining(k)}>เติมคะแนนที่เหลือ</button></div>"
rep(old,new,'mobile scoring row')

p.write_text(s,encoding='utf-8')
print('VERIFYX_WEIGHTED_SCORING_UI_MOBILE_FIX_OK')
