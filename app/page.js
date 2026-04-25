'use client';
import { useState } from 'react';

const ANIMALS = [
  {name:'Эрвээхэй', boxer:'Muhammad Ali', color:'#FFD700', icon:'🦋', move:'Хөнгөн тасралтгүй хөдөлгөөн. Өрсөлдөгч онилох боломжгүй болгодог.', info:'Muhammad Ali (1942–2016) — The Greatest. 3 удаа дэлхийн чемпион. Float like a butterfly, sting like a bee.'},
  {name:'Могой', boxer:'Willie Pep', color:'#00FF88', icon:'🐍', move:'Биеийг долгионтуулан цохилтоос зайлж дайрах боломж хайна.', info:'Willie Pep (1922–2006) — 230 ялалт. Dodge & weave мастер.'},
  {name:'Баавгай', boxer:'Joe Frazier', color:'#8D6E63', icon:'🐻', move:'Урагш дарж өрсөлдөгчийг шахаж завсаргүй дайрна.', info:'Joe Frazier (1944–2011) — Smokin Joe. Дэлхийн хүнд жингийн чемпион.'},
  {name:'Бүргэд', boxer:'Roy Jones Jr.', color:'#64B5F6', icon:'🦅', move:'Дээрээс доош хурдан нарийн цохилт.', info:'Roy Jones Jr. (1969–) — 4 жингийн дэлхийн чемпион.'},
  {name:'Барс', boxer:'Mike Tyson', color:'#FF6F00', icon:'🐯', move:'Эрч хүчтэй довтолгоо. Эрүү доогуур нугалж орж цохино.', info:'Mike Tyson (1966–) — Iron Mike. 50 ялалтын 44-ийг KO-оор авсан.'},
];

const BREATHING = [
  {name:'Хайрцаг амьсгал', boxer:'Vasyl Lomachenko', color:'#00E5FF', steps:['4 сек ав','4 сек барь','4 сек гарга','4 сек барь'], use:'Тэмцлийн өмнө тайвшрах'},
  {name:'Хүчний амьсгал', boxer:'Mike Tyson', color:'#E8002D', steps:['Нударга зангид','Hss! гарга','Хэвлий чангар','Хурдан ав'], use:'Цохилтын хүч нэмэгдүүлэх'},
  {name:'Хэмнэлт амьсгал', boxer:'Floyd Mayweather', color:'#76FF03', steps:['Хөдөлгөөнтэй ав','Тогтмол хэм барь','Ядрахад хурдасгуй','Хамраар амьсгал'], use:'Урт раундад тэсвэр хадгалах'},
  {name:'Нөхөн амьсгал', boxer:'Manny Pacquiao', color:'#E040FB', steps:['Амаар гүнзгий ав','Хамраар удаан гарга','Хэвлий ашигла','8-10 удаа давт'], use:'Раундын завсарт нөхөн сэргэх'},
];

const FAQ = [
  {q:'Хэдэн насанд бокс эхлэж болох вэ?', a:'Ямар ч насанд эхлэж болно. 6 наснаас хүүхдийн бокс байдаг.'},
  {q:'Эхлэгчид ямар тоног төхөөрөмж хэрэгтэй вэ?', a:'Бороо, бокс бээлий (16oz), хоолой хамгаалагч, толгой хамгаалагч. 80,000-150,000 төгрөг.'},
  {q:'Нударга хэрхэн зөв зангидах вэ?', a:'4 хурууг нугала, эрхий хурууг дээрээс тав. Бугуй шулуун байх ёстой.'},
  {q:'Хамгийн чухал цохилт аль нь вэ?', a:'Жаб — зайг хянах, хурд, довтолгооны эхлэл. Мэргэжлийн боксчид 60-70% жаб ашигладаг.'},
  {q:'Өдөрт хэдэн цаг дасгал хийх вэ?', a:'Эхлэгч: 1-1.5 цаг, 7 хоногт 3-4 удаа. Дунд: 1.5-2 цаг, 4-5 удаа.'},
  {q:'Спарринг хэзээ эхлэх вэ?', a:'3-6 сарын дасгалын дараа. Байрлал, хамгаалалт эзэмшсэн байх хэрэгтэй.'},
  {q:'Бокс яагаад жин буурдаг вэ?', a:'Нэг цагт 600-1000 калори шатаадаг. Кардио болон булчингийн дасгал хосолдог.'},
  {q:'Бокс сэтгэл зүйд хэрхэн нөлөөлдөг вэ?', a:'Стрессийг бууруулж, өөртөө итгэх итгэлийг нэмэгдүүлдэг.'},
];

const TABS = ['Нүүр','Амьтад','Амьсгал','Дасгал','Хоол','AI Чат','FAQ'];
const ICONS = ['🏠','🦋','💨','💪','🥗','🤖','❓'];

export default function Home() {
  const [tab, setTab] = useState(0);
  const [msgs, setMsgs] = useState([{role:'assistant',content:'Сайн байна уу! Би GAVANA Boxing AI дасгалжуулагч 🥊'}]);
  const [inp, setInp] = useState('');
  const [load, setLoad] = useState(false);
  const [modal, setModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [weight, setWeight] = useState(70);
  const [nutGoal, setNutGoal] = useState(0);
  const [nutPlan, setNutPlan] = useState('');
  const [nutLoad, setNutLoad] = useState(false);
  const [workPlan, setWorkPlan] = useState('');
  const [workLoad, setWorkLoad] = useState(false);

  const callAI = async (prompt) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({messages: [{role: 'user', content: prompt}]})
    });
    const data = await res.json();
    return data.content ? data.content[0].text : 'Алдаа гарлаа';
  };

  const send = async () => {
    if (!inp.trim() || load) return;
    const newMsgs = [...msgs, {role: 'user', content: inp}];
    setMsgs(newMsgs);
    setInp('');
    setLoad(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({messages: newMsgs})
      });
      const data = await res.json();
      const text = data.content ? data.content[0].text : 'Алдаа';
      setMsgs(p => [...p, {role: 'assistant', content: text}]);
    } catch(e) {
      setMsgs(p => [...p, {role: 'assistant', content: 'Алдаа гарлаа'}]);
    }
    setLoad(false);
  };

  const genNut = async () => {
    setNutLoad(true);
    setNutPlan('');
    const goals = ['Жин бууруулах', 'Жин хадгалах', 'Булчин нэмэх'];
    const prompt = 'Боксчдод зориулсан хоол: жин ' + weight + 'кг, зорилго: ' + goals[nutGoal] + '. Өдрийн калори, уураг/нүүрс ус/өөх тос гр, өглөо/өдөр/орой хоол. Монгол хэлээр товч.';
    const txt = await callAI(prompt);
    setNutPlan(txt);
    setNutLoad(false);
  };

  const genWork = async () => {
    setWorkLoad(true);
    setWorkPlan('');
    const prompt = 'Боксчдод зориулсан 7 хоногийн дасгалын хуваарь гарга. Өдөр бүр: дасгалын нэр, хугацаа, давталт. Монгол хэлээр, товч.';
    const txt = await callAI(prompt);
    setWorkPlan(txt);
    setWorkLoad(false);
  };

  const red = '#E8002D';

  return (
    <div style={{minHeight:'100vh', background:'#080808', color:'#fff', fontFamily:'sans-serif', maxWidth:480, margin:'0 auto'}}>
      
      <div style={{background:'#0f0f0f', borderBottom:'2px solid #E8002D', padding:'14px 16px', textAlign:'center'}}>
        <h1 style={{color:'#E8002D', fontSize:26, fontWeight:900, letterSpacing:6, margin:0}}>GAVANA BOXING</h1>
        <p style={{color:'#555', fontSize:10, letterSpacing:4, margin:0}}>AI ДАСГАЛЖУУЛАГЧ</p>
      </div>

      <div style={{display:'flex', overflowX:'auto', padding:'8px 12px', gap:6, background:'#0a0a0a', borderBottom:'1px solid #1a1a1a'}}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flexShrink:0, padding:'6px 12px',
            background: tab === i ? '#E8002D' : 'transparent',
            border: tab === i ? '1px solid #E8002D' : '1px solid #222',
            color: tab === i ? '#fff' : '#666',
            borderRadius:20, fontSize:11, cursor:'pointer', whiteSpace:'nowrap'
          }}>
            {ICONS[i]} {t}
          </button>
        ))}
      </div>

      <div style={{padding:'16px 14px 80px'}}>

        {tab === 0 && (
          <div>
            <div style={{background:'linear-gradient(135deg,#1a0000,#111)', border:'1px solid #E8002D22', borderRadius:14, padding:20, marginBottom:12, textAlign:'center'}}>
              <div style={{fontSize:60, marginBottom:8}}>🥊</div>
              <div style={{fontSize:20, color:'#E8002D', fontWeight:900, letterSpacing:3}}>АНХАН СУРАЛЦАГЧААС</div>
              <div style={{fontSize:20, fontWeight:900, letterSpacing:3}}>МЭРГЭЖЛИЙН БОКСЧ БОЛТОЛ</div>
              <div style={{color:'#555', fontSize:12, marginTop:8}}>Байрлал · Дасгал · Хоол · Амьтдын техник</div>
            </div>
            {[
              {icon:'🦋', t:'Амьтдын хөдөлгөөн', d:'Бодит анимэйшн зурагтай', i:1},
              {icon:'💨', t:'Амьсгалын техник', d:'4 арга + мастер боксчид', i:2},
              {icon:'💪', t:'Дасгалын хуваарь', d:'AI хуваарь гаргана', i:3},
              {icon:'🥗', t:'Хоол тэжээл', d:'AI хоол тооцоолно', i:4}
            ].map(c => (
              <div key={c.i} onClick={() => setTab(c.i)} style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:10, display:'flex', gap:14, alignItems:'center', cursor:'pointer'}}>
                <div style={{fontSize:32}}>{c.icon}</div>
                <div>
                  <div style={{fontWeight:700, marginBottom:2}}>{c.t}</div>
                  <div style={{color:'#555', fontSize:12}}>{c.d}</div>
                </div>
              </div>
            ))}
            <div style={{background:'linear-gradient(135deg,#0a1200,#111)', border:'1px solid #76FF0333', borderRadius:14, padding:16}}>
              <div style={{color:'#76FF03', fontWeight:700, fontSize:14, marginBottom:8}}>⭐ PREMIUM — САРД 15,000₮</div>
              {['AI дасгалын хуваарь', 'AI хоол тэжээлийн менюг', 'Хязгааргүй AI чат'].map((f, i) => (
                <div key={i} style={{color:'#888', fontSize:13, padding:'3px 0'}}>✓ {f}</div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>🦋 АМЬТДЫН ХӨДӨЛГӨӨН</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>Нэр дарахад боксчийн тухай мэдэх</div>
            {ANIMALS.map((a, i) => (
              <div key={i} style={{background:'#111', border:'1px solid ' + a.color + '33', borderRadius:14, padding:16, marginBottom:12}}>
                <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:10}}>
                  <span style={{fontSize:28}}>{a.icon}</span>
                  <div>
                    <div style={{color:a.color, fontWeight:700, fontSize:16}}>{a.name}</div>
                    <div style={{color:'#555', fontSize:11}}>Боксч: {a.boxer}</div>
                  </div>
                </div>
                <div style={{color:'#888', fontSize:13, marginBottom:10, lineHeight:1.6}}>{a.move}</div>
                <button onClick={() => setModal(a)} style={{width:'100%', padding:'10px', background:a.color + '22', border:'1px solid ' + a.color + '44', color:a.color, borderRadius:10, cursor:'pointer', fontSize:13}}>
                  🥊 {a.boxer} — Дэлгэрэнгүй
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 2 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>💨 АМЬСГАЛЫН ТЕХНИК</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>Нэр дарахад боксчийн тухай мэдэх</div>
            {BREATHING.map((b, i) => (
              <div key={i} style={{background:'#111', border:'1px solid ' + b.color + '33', borderRadius:14, padding:16, marginBottom:12}}>
                <div style={{color:b.color, fontWeight:700, fontSize:16, marginBottom:4}}>{b.name}</div>
                <div style={{color:'#555', fontSize:11, marginBottom:10}}>Мастер: {b.boxer}</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10}}>
                  {b.steps.map((st, j) => (
                    <div key={j} style={{background:'#1a1a1a', border:'1px solid ' + b.color + '33', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#ccc'}}>
                      <span style={{color:b.color, fontWeight:700}}>{j+1}. </span>{st}
                    </div>
                  ))}
                </div>
                <div style={{color:'#555', fontSize:11, marginBottom:8}}>📌 {b.use}</div>
                <button onClick={() => setModal(b)} style={{width:'100%', padding:'10px', background:b.color + '22', border:'1px solid ' + b.color + '44', color:b.color, borderRadius:10, cursor:'pointer', fontSize:13}}>
                  🥊 {b.boxer} — Дэлгэрэнгүй
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:16}}>💪 ДАСГАЛЫН ХУВААРЬ</div>
            <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:12}}>
              <div style={{color:'#888', fontSize:13, marginBottom:8}}>AI-аар 7 хоногийн хуваарь гарга</div>
              <button onClick={genWork} style={{width:'100%', padding:'14px', background:'linear-gradient(135deg,#E8002D,#FF6D00)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:16, fontWeight:700}}>
                {workLoad ? 'Боловсруулж байна...' : '🥊 AI ХУВААРЬ ГАРГАХ'}
              </button>
            </div>
            {workPlan && (
              <div style={{background:'#111', border:'1px solid #E8002D33', borderRadius:14, padding:16, marginBottom:12}}>
                <div style={{color:'#E8002D', fontWeight:700, marginBottom:8}}>🤖 AI ДАСГАЛЫН ХУВААРЬ</div>
                <div style={{color:'#ccc', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap'}}>{workPlan}</div>
              </div>
            )}
            <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16}}>
              <div style={{fontWeight:700, marginBottom:12}}>⚡ ШУУРХАЙ ЗӨВЛӨГӨӨ</div>
              {['🥊 Нударга нүүрийн өндөрт байлга','👣 Хөлний зай мөрний өргөнтэй','💨 Цохих бүрт амьсгал гарга','👁️ Өрсөлдөгчийн нүдийг хар','🦵 Өвдөг зөөлөн нугарсан байлга'].map((t, i) => (
                <div key={i} style={{color:'#777', fontSize:13, padding:'7px 0', borderBottom: i < 4 ? '1px solid #1a1a1a' : 'none'}}>{t}</div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:16}}>🥗 ХООЛ ТЭЖЭЭЛ</div>
            <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                <span style={{color:'#888', fontSize:13}}>Биеийн жин</span>
                <span style={{color:'#E8002D', fontWeight:700, fontSize:20}}>{weight}кг</span>
              </div>
              <input type="range" min="40" max="120" value={weight} onChange={e => setWeight(+e.target.value)} style={{width:'100%', accentColor:'#E8002D', marginBottom:12}}/>
              <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:12}}>
                {['Жин бууруулах', 'Жин хадгалах', 'Булчин нэмэх'].map((g, i) => (
                  <button key={i} onClick={() => setNutGoal(i)} style={{
                    padding:'10px', cursor:'pointer', fontSize:13, textAlign:'left', borderRadius:8,
                    background: nutGoal === i ? '#E8002D22' : '#1a1a1a',
                    border: nutGoal === i ? '1px solid #E8002D' : '1px solid #222',
                    color: nutGoal === i ? '#E8002D' : '#666'
                  }}>
                    {nutGoal === i ? '✓ ' : ''}{g}
                  </button>
                ))}
              </div>
              <button onClick={genNut} style={{width:'100%', padding:'14px', background:'linear-gradient(135deg,#1a4400,#76FF03)', color:'#000', border:'none', borderRadius:10, cursor:'pointer', fontSize:16, fontWeight:700}}>
                {nutLoad ? 'Тооцоолж байна...' : '🥗 AI ХООЛ ТООЦООЛОХ'}
              </button>
            </div>
            {nutPlan && (
              <div style={{background:'#111', border:'1px solid #76FF0333', borderRadius:14, padding:16}}>
                <div style={{color:'#76FF03', fontWeight:700, marginBottom:8}}>🤖 AI ХООЛ ТЭЖЭЭЛИЙН ТӨЛӨВЛӨГӨӨ</div>
                <div style={{color:'#ccc', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap'}}>{nutPlan}</div>
              </div>
            )}
          </div>
        )}

        {tab === 5 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>🤖 AI ДАСГАЛЖУУЛАГЧ</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>Боксын талаар ямар ч асуулт асуу</div>
            <div style={{display:'flex', flexDirection:'column', height:'60vh', background:'#111', borderRadius:16, padding:16}}>
              <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, marginBottom:12}}>
                {msgs.map((m, i) => (
                  <div key={i} style={{display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'}}>
                    <div style={{maxWidth:'82%', padding:'10px 14px', borderRadius:14, background: m.role === 'user' ? '#E8002D' : '#222', fontSize:14, lineHeight:1.6}}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {load && <div style={{padding:'10px 14px', background:'#222', borderRadius:14, width:'fit-content', color:'#555'}}>Бодож байна...</div>}
              </div>
              <div style={{display:'flex', gap:8}}>
                <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Асуулт бичнэ үү..." style={{flex:1, background:'#222', border:'1px solid #333', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:14, outline:'none'}}/>
                <button onClick={send} style={{padding:'10px 18px', background:'#E8002D', border:'none', borderRadius:10, color:'#fff', fontSize:18, cursor:'pointer'}}>➤</button>
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>❓ ТҮГЭЭМЭЛ АСУУЛТУУД</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>Хамгийн их асуусан асуултууд</div>
            {FAQ.map((f, i) => (
              <div key={i} style={{background:'#111', border: openFaq === i ? '1px solid #E8002D' : '1px solid #1f1f1f', borderRadius:12, marginBottom:8, overflow:'hidden'}}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{width:'100%', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:14, textAlign:'left'}}>
                  <span>{f.q}</span>
                  <span style={{color:'#E8002D', fontSize:20}}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div style={{padding:'0 16px 14px', color:'#777', fontSize:13, lineHeight:1.8}}>{f.a}</div>}
              </div>
            ))}
          </div>
        )}

      </div>

      {modal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:200, display:'flex', alignItems:'flex-end'}} onClick={() => setModal(null)}>
          <div style={{width:'100%', maxWidth:480, margin:'0 auto', background:'#111', border:'1px solid #222', borderRadius:'20px 20px 0 0', padding:24}} onClick={e => e.stopPropagation()}>
            <div style={{width:40, height:4, background:'#333', borderRadius:2, margin:'0 auto 20px'}}/>
            <div style={{color:modal.color, fontWeight:700, fontSize:22, marginBottom:8}}>{modal.boxer || modal.name}</div>
            <div style={{color:'#888', fontSize:14, lineHeight:1.85, marginBottom:14}}>{modal.info}</div>
            {modal.move && <div style={{background:'#1a1a1a', borderRadius:10, padding:14, color:'#aaa', fontSize:13, lineHeight:1.7}}>🥊 {modal.move}</div>}
            <button onClick={() => setModal(null)} style={{width:'100%', padding:'12px', background:'#1a1a1a', border:'1px solid #222', color:'#666', borderRadius:10, cursor:'pointer', fontSize:14, marginTop:16}}>Хаах</button>
          </div>
        </div>
      )}
    </div>
  );
}