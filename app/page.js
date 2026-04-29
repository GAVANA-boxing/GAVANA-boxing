"use client";

import { useState, useEffect } from "react";

import { auth, db } from "@/lib/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const ANIMALS = [
  {name:'Эрвээхэй', boxer:'Muhammad Ali', color:'#FFD700', icon:'🦋', move:'Хөнгөн тасралтгүй хөдөлгөөн. Өрсөлдөгч онилох боломжгүй болгодог.', info:'Muhammad Ali (1942–2016) — The Greatest. 3 удаа дэлхийн чемпион. Float like a butterfly, sting like a bee.'},
  {name:'Могой', boxer:'Willie Pep', color:'#00FF88', icon:'🐍', move:'Биеийг долгионтуулан цохилтоос зайлж дайрах боломж хайна.', info:'Willie Pep (1922–2006) — 230 ялалт. Dodge & weave мастер.'},
  {name:'Баавгай', boxer:'Joe Frazier', color:'#8D6E63', icon:'🐻', move:'Урагш дарж өрсөлдөгчийг шахаж завсаргүй дайрна.', info:'Joe Frazier (1944–2011) — Smokin Joe. Дэлхийн хүнд жингийн чемпион.'},
  {name:'Бүргэд', boxer:'Roy Jones Jr.', color:'#64B5F6', icon:'🦅', move:'Дээрээс доош хурдан нарийн цохилт.', info:'Roy Jones Jr. (1969–) — 4 жингийн дэлхийн чемпион.'},
  {name:'Барс', boxer:'Mike Tyson', color:'#FF6F00', icon:'🐯', move:'Эрч хүчтэй довтолгоо. Эрүү доогуур нугалж орж цохино.', info:'Mike Tyson (1966–) — Iron Mike. 50 ялалтын 44-ийг KO-оор авсан.'},
];
 
const BREATHING = [
  {name:'Хайрцаг амьсгал', boxer:'Vasyl Lomachenko', color:'#00E5FF', steps:['4 сек ав','4 сек барь','4 сек гарга','4 сек барь'], use:'Тэмцлийн өмнө тайвшрах', info:'Vasyl Lomachenko (1988–) — Hi-Tech. Олимпийн 2 удаагийн алтан медальт. 3 жингийн дэлхийн чемпион.'},
  {name:'Хүчний амьсгал', boxer:'Mike Tyson', color:'#E8002D', steps:['Нударга зангид','Hss! гарга','Хэвлий чангар','Хурдан ав'], use:'Цохилтын хүч нэмэгдүүлэх', info:'Mike Tyson (1966–) — Цохих мөчид Hss! гэж амьсгал гаргах нь цохилтын хүчийг 10-20% нэмэгдүүлдэг.'},
  {name:'Хэмнэлт амьсгал', boxer:'Floyd Mayweather', color:'#76FF03', steps:['Хөдөлгөөнтэй ав','Тогтмол хэм барь','Ядрахад хурдасгуй','Хамраар амьсгал'], use:'Урт раундад тэсвэр хадгалах', info:'Floyd Mayweather Jr. (1977–) — Money. 50-0. 5 жингийн дэлхийн чемпион.'},
  {name:'Нөхөн амьсгал', boxer:'Manny Pacquiao', color:'#E040FB', steps:['Амаар гүнзгий ав','Хамраар удаан гарга','Хэвлий ашигла','8-10 удаа давт'], use:'Раундын завсарт нөхөн сэргэх', info:'Manny Pacquiao (1978–) — Pac-Man. 8 жингийн дэлхийн чемпион.'},
];
 
const PUNCHES = [
  {name:'Жаб', clock:'12:00', angle:0, color:'#E8002D', desc:'Шулуун урагш. Хамгийн хурдан цохилт. Зайг хянах үндсэн зэвсэг.'},
  {name:'Кросс', clock:'12-1', angle:8, color:'#FF6D00', desc:'Арын гараас хүчтэй шулуун цохилт. Эрүүг онилно.'},
  {name:'Жаб Боди', clock:'1-2 доош', angle:20, color:'#FFC107', desc:'Хэвлий рүү чиглэсэн жаб. Хамгаалалт буулгана.'},
  {name:'Хук', clock:'3:00', angle:90, color:'#76FF03', desc:'Хажуугаас нугалсан цохилт. Эрүү болон хажуу нүүрийг онилно.'},
  {name:'Апперкат', clock:'6:00', angle:270, color:'#00E5FF', desc:'Доороос дээш цохилт. Эрүүг онилно. Дотоод тулалдаанд.'},
  {name:'Оверхэнд', clock:'1-2 нум', angle:45, color:'#E040FB', desc:'Нуман замаар цохих хүчтэй цохилт. Хамгаалалт давна.'},
];
 
const WEIGHT_DIST = [
  {label:'Тайван (Neutral)', front:50, rear:50, color:'#76FF03'},
  {label:'Довтолгоо (Attack)', front:60, rear:40, color:'#E8002D'},
  {label:'Хамгаалалт (Defense)', front:40, rear:60, color:'#00E5FF'},
  {label:'Хук цохих үед', front:70, rear:30, color:'#FFC107'},
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
 
const TABS = ['Нүүр','Байрлал','Амьтад','Амьсгал','Дасгал','Хоол','Шинжилгээ','AI Чат','FAQ'];
const ICONS = ['🏠','🥊','🦋','💨','💪','🥗','📊','🤖','❓'];
 
function ClockDial({ angle, color }) {
  const cx = 50, cy = 50, r = 38;
  const rad = (angle - 90) * Math.PI / 180;
  const x2 = cx + r * 0.72 * Math.cos(rad);
  const y2 = cy + r * 0.72 * Math.sin(rad);
  return (
    <svg viewBox="0 0 100 100" style={{width:80, height:80, flexShrink:0}}>
      <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" stroke="#333" strokeWidth="1.5"/>
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
        const tr = (a-90)*Math.PI/180;
        const ri = r-5, ro = i%3===0?r:r-2;
        return <line key={i} x1={cx+ri*Math.cos(tr)} y1={cy+ri*Math.sin(tr)} x2={cx+ro*Math.cos(tr)} y2={cy+ro*Math.sin(tr)} stroke={i%3===0?"#555":"#333"} strokeWidth={i%3===0?1.5:0.8}/>;
      })}
      {['12','3','6','9'].map((n,i) => {
        const a = (i*90-90)*Math.PI/180;
        return <text key={n} x={cx+27*Math.cos(a)} y={cy+27*Math.sin(a)+3.5} textAnchor="middle" fill="#666" fontSize="9" fontFamily="sans-serif">{n}</text>;
      })}
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="4" fill={color}/>
      <circle cx={x2} cy={y2} r="5" fill={color} opacity="0.85"/>
    </svg>
  );
}
 
export default function Home() {
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
  const [analysis, setAnalysis] = useState('');
  const [lastWorkout, setLastWorkout] = useState(null);
  const [anaLoad, setAnaLoad] = useState(false);
  const [streak, setStreak] = useState(3);
  const [doneDay, setDoneDay] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setStreak(data.streak || 0);
        setLastWorkout(data.lastWorkout || null);
      } else {
        await setDoc(userRef, {
          email: currentUser.email,
          streak: 0,
          lastWorkout: null
        });
        setStreak(0);
        setLastWorkout(null);
      }
    }
  });

  return () => {
    unsubscribe();
  };
}, []);
 
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
    const prompt = 'Боксчдод зориулсан хоол тэжээлийн төлөвлөгөө гарга. Жин: ' + weight + 'кг. Зорилго: ' + goals[nutGoal] + '. Дараах зүйл заавал оруул: 1) Өдрийн нийт калори 2) Уураг/нүүрс ус/өөх тос гр 3) Өглоо/өдөр/орой/дасгалын өмнө/дараа хоол 4) Монголд байдаг хоол. Монгол хэлээр товч.';
    const txt = await callAI(prompt);
    setNutPlan(txt);
    setNutLoad(false);
  };
 
  const genWork = async () => {
    setWorkLoad(true);
    setWorkPlan('');
    const prompt = 'Боксчдод зориулсан 7 хоногийн дасгалын хуваарь гарга. Өдөр бүр: дасгалын нэр, хугацаа, давталт. Боксод зориулсан дасгал гол болго. Монгол хэлээр, товч.';
    const txt = await callAI(prompt);
    setWorkPlan(txt);
    setWorkLoad(false);
  };
 
  const genAnalysis = async () => {
    setAnaLoad(true);
    setAnalysis('');
    const prompt = 'Боксын техникийн дүн шинжилгээ хийж зөвлөгөө өг. Эхлэгч боксч: жаб болон кросс голчлон ашигладаг, хамгаалалт сул, хөдөлгөөн удаан. Дутагдалыг олж тодорхой зөвлөгөө өг. Дасгалын төлөвлөгөө нэмж гарга. Монгол хэлээр.';
    const txt = await callAI(prompt);
    setAnalysis(txt);
    setAnaLoad(false);
  };
  const register = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};

const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
};

const logout = async () => {
  await signOut(auth);
};

const markWorkoutDone = async () => {
  if (!user) {
    alert("Эхлээд login хийнэ үү");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  if (lastWorkout === today) {
    alert("Өнөөдрийн дасгал аль хэдийн бүртгэгдсэн байна 🔥");
    return;
  }

  const newStreak = streak + 1;
  const userRef = doc(db, "users", user.uid);

  await updateDoc(userRef, {
    streak: newStreak,
    lastWorkout: today
  });

  setStreak(newStreak);
  setLastWorkout(today);

  alert(`🔥 Streak нэмэгдлээ: ${newStreak} өдөр`);
};
 
  return (
    <div style={{minHeight:'100vh', background:'#080808', color:'#fff', fontFamily:'sans-serif', maxWidth:480, margin:'0 auto'}}>
 
      <div style={{background:'#0c0c0c', borderBottom:'1px solid #1e1e1e', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, left:0, width:'100%', height:'2px', background:'linear-gradient(90deg, transparent, #E8002D, transparent)'}}/>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{width:36, height:36, borderRadius:10, background:'#E8002D18', border:'1px solid #E8002D44', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>🥊</div>
          <div>
            <div style={{color:'#fff', fontSize:18, fontWeight:900, letterSpacing:3, lineHeight:1}}>GAVANA</div>
            <div style={{color:'#E8002D', fontSize:9, letterSpacing:4, fontWeight:700}}>BOXING AI</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{color:'#E8002D', fontSize:20, fontWeight:900, lineHeight:1}}>🔥 {streak}</div>
          <div style={{color:'#333', fontSize:9, letterSpacing:2}}>STREAK</div>
        </div>
      </div>
      {user ? (
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', background:'#0d0d0d', borderBottom:'1px solid #1a1a1a'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:28, height:28, borderRadius:'50%', background:'#E8002D22', border:'1px solid #E8002D55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13}}>👤</div>
            <span style={{color:'#76FF03', fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.email}</span>
          </div>
          <button onClick={logout} style={{background:'transparent', border:'1px solid #333', padding:'6px 14px', color:'#666', borderRadius:8, cursor:'pointer', fontSize:12, fontFamily:'sans-serif'}}>
            Гарах
          </button>
        </div>
      ) : (
        <div style={{background:'#0d0d0d', borderBottom:'1px solid #1a1a1a', padding:'16px'}}>
          <div style={{fontSize:12, color:'#444', letterSpacing:2, textTransform:'uppercase', marginBottom:12, textAlign:'center'}}>Нэвтрэх / Бүртгүүлэх</div>
          <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:10}}>
            <input
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="И-мэйл хаяг"
              style={{padding:'11px 14px', background:'#161616', border:'1px solid #2a2a2a', borderRadius:10, color:'#fff', fontSize:13, outline:'none', fontFamily:'sans-serif'}}
            />
            <input
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Нууц үг"
              type="password"
              style={{padding:'11px 14px', background:'#161616', border:'1px solid #2a2a2a', borderRadius:10, color:'#fff', fontSize:13, outline:'none', fontFamily:'sans-serif'}}
            />
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={login} style={{flex:1, padding:'11px', background:'#1a1a1a', border:'1px solid #333', borderRadius:10, color:'#aaa', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'sans-serif'}}>
              Нэвтрэх
            </button>
            <button onClick={register} style={{flex:1, padding:'11px', background:'#E8002D', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'sans-serif'}}>
              Бүртгүүлэх
            </button>
          </div>
        </div>
      )}
 
      <div style={{display:'flex', overflowX:'auto', padding:'10px 12px', gap:6, background:'#080808', borderBottom:'1px solid #161616', scrollbarWidth:'none'}}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flexShrink:0, padding:'7px 14px',
            background: tab === i ? '#E8002D' : '#111',
            border: tab === i ? '1px solid #E8002D' : '1px solid #1e1e1e',
            color: tab === i ? '#fff' : '#555',
            borderRadius:22, fontSize:11, cursor:'pointer', whiteSpace:'nowrap',
            fontFamily:'sans-serif', fontWeight: tab === i ? 700 : 400,
            letterSpacing: tab === i ? 0.5 : 0,
            transition:'all 0.15s'
          }}>
            {ICONS[i]} {t}
          </button>
        ))}
      </div>
 
      <div style={{padding:'16px 14px 80px'}}>
 
        {tab === 0 && (
          <div>
            {/* HERO SECTION */}
            <div style={{position:'relative', background:'#0e0e0e', border:'1px solid #1c1c1c', borderRadius:20, padding:'32px 20px 24px', marginBottom:14, textAlign:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:0, right:0, height:120, background:'radial-gradient(ellipse at 50% -20%, #E8002D1a 0%, transparent 70%)', pointerEvents:'none'}}/>
              <div style={{position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent 10%, #E8002D66 50%, transparent 90%)'}}/>
              <div style={{fontSize:56, marginBottom:10, lineHeight:1}}>🥊</div>
              <div style={{fontSize:10, letterSpacing:5, color:'#E8002D', fontWeight:700, marginBottom:10, textTransform:'uppercase'}}>AI Boxing System</div>
              <div style={{fontSize:26, fontWeight:900, lineHeight:1.25, marginBottom:6, letterSpacing:0.5}}>
                Train like a boxer.<br/>
                <span style={{color:'#E8002D'}}>Think like a fighter.</span>
              </div>
              <div style={{color:'#444', fontSize:12, marginBottom:22, lineHeight:1.7}}>
                Хувийн дасгалжуулагч · AI тренинг · Боксын систем
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:20}}>
                <button onClick={() => setTab(4)} style={{padding:'12px 22px', background:'#E8002D', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', letterSpacing:0.5, fontFamily:'sans-serif'}}>
                  🥊 ДАСГАЛ ЭХЛЭХ
                </button>
                <button onClick={() => setTab(7)} style={{padding:'12px 18px', background:'#111', border:'1px solid #222', borderRadius:10, color:'#aaa', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif'}}>
                  🤖 AI Чат
                </button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                {[
                  {val:`🔥 ${streak}`, label:'Streak өдөр', color:'#E8002D'},
                  {val:'AI', label:'Дасгалжуулагч', color:'#00E5FF'},
                  {val:'9', label:'Модуль', color:'#76FF03'},
                ].map((s,i) => (
                  <div key={i} style={{background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:10, padding:'10px 6px'}}>
                    <div style={{fontSize:15, fontWeight:900, color:s.color}}>{s.val}</div>
                    <div style={{fontSize:9, color:'#333', marginTop:3, letterSpacing:1}}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
 
            {/* FEATURE CARDS */}
            <div style={{fontSize:10, fontWeight:700, color:'#333', letterSpacing:3, marginBottom:10, textTransform:'uppercase', paddingLeft:2}}>МОДУЛИУД</div>
            {[
              {icon:'🥊', t:'Гарны байрлал', d:'Цохилт цагийн зүүгээр + жингийн хуваарилалт', i:1, color:'#E8002D'},
              {icon:'🦋', t:'Амьтдын хөдөлгөөн', d:'Ali, Tyson, Frazier гэх мэт', i:2, color:'#FFD700'},
              {icon:'💨', t:'Амьсгалын техник', d:'4 арга + мастер боксчид', i:3, color:'#00E5FF'},
              {icon:'💪', t:'Дасгалын хуваарь', d:'AI-аар 7 хоногийн хуваарь гаргана', i:4, color:'#FF6D00'},
              {icon:'🥗', t:'Хоол тэжээл', d:'Калори + AI хоол тооцоолно', i:5, color:'#76FF03'},
              {icon:'📊', t:'Дүн шинжилгээ', d:'AI техник шинжилгээ + зөвлөгөө', i:6, color:'#E040FB'},
            ].map(c => (
              <div key={c.i} onClick={() => setTab(c.i)} style={{background:'#0e0e0e', border:'1px solid #181818', borderLeft:'3px solid '+c.color+'55', borderRadius:12, padding:'13px 14px', marginBottom:7, display:'flex', gap:13, alignItems:'center', cursor:'pointer'}}>
                <div style={{width:42, height:42, borderRadius:11, background:c.color+'12', display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, flexShrink:0}}>{c.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, marginBottom:2, fontSize:13, color:'#ddd'}}>{c.t}</div>
                  <div style={{color:'#3a3a3a', fontSize:11}}>{c.d}</div>
                </div>
                <div style={{color:c.color+'66', fontSize:16, fontWeight:300}}>›</div>
              </div>
            ))}
 
            {/* PREMIUM CARD */}
            <div style={{background:'#0d0d0d', border:'1px solid #76FF0322', borderRadius:14, padding:18, marginTop:8, position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, #76FF0366, transparent)'}}/>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
                <div>
                  <div style={{color:'#76FF03', fontWeight:900, fontSize:14, letterSpacing:1}}>⭐ PREMIUM</div>
                  <div style={{color:'#333', fontSize:10, marginTop:2}}>Бүх боломжийг нээ</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#76FF03', fontWeight:900, fontSize:20}}>15,000₮</div>
                  <div style={{color:'#333', fontSize:10}}>/сар</div>
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:14}}>
                {[
                  {icon:'🤖', t:'Хязгааргүй AI чат'},
                  {icon:'💪', t:'AI дасгалын хуваарь'},
                  {icon:'🥗', t:'AI хоол тэжээл'},
                  {icon:'📊', t:'Дэлгэрэнгүй шинжилгээ'},
                ].map((f, i) => (
                  <div key={i} style={{background:'#111', border:'1px solid #1a1a1a', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:7}}>
                    <span style={{fontSize:13}}>{f.icon}</span>
                    <span style={{color:'#555', fontSize:11}}>{f.t}</span>
                  </div>
                ))}
              </div>
              <button style={{width:'100%', padding:'13px', background:'#76FF03', color:'#000', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:900, letterSpacing:1, fontFamily:'sans-serif'}}>
                PREMIUM АВАХ →
              </button>
            </div>
          </div>
        )}
 
        {tab === 1 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>🥊 ГАРНЫ БАЙРЛАЛ</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>Цохилт бүрийн чиглэл цагийн зүүгээр</div>
            <div style={{background:'#111', border:'1px solid #E8002D33', borderRadius:14, padding:16, marginBottom:14}}>
              <div style={{fontWeight:700, marginBottom:10, color:'#E8002D'}}>🥊 ЗОГСОЛТЫН ДҮРЭМ</div>
              {['Нударга нүүрийн өндөрт — хацарны яс дэргэд','Тохой доош харсан — хэвлий хамгаалдаг','Мөр зөөлөн — хэт чангалах хэрэггүй','Эрүүг мөрний ард нуу','Урд хөл шулуун, хойд хөл 45 градус гадагш'].map((t, i) => (
                <div key={i} style={{display:'flex', gap:10, padding:'8px 0', borderBottom: i<4?'1px solid #1a1a1a':'none', alignItems:'flex-start'}}>
                  <div style={{width:22, height:22, borderRadius:'50%', background:'#E8002D22', border:'1px solid #E8002D55', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:'#E8002D', fontWeight:700}}>{i+1}</div>
                  <span style={{color:'#aaa', fontSize:13, lineHeight:1.5}}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{fontWeight:700, fontSize:16, marginBottom:12}}>⏰ ЦОХИЛТЫН ЧИГЛЭЛ</div>
            {PUNCHES.map((p, i) => (
              <div key={i} style={{background:'#111', border:'1px solid ' + p.color + '22', borderRadius:12, padding:14, marginBottom:10, display:'flex', gap:14, alignItems:'center'}}>
                <ClockDial angle={p.angle} color={p.color}/>
                <div style={{flex:1}}>
                  <div style={{color:p.color, fontWeight:700, fontSize:18, marginBottom:2}}>{p.name}</div>
                  <div style={{color:'#FF6D00', fontSize:12, marginBottom:6}}>{p.clock}</div>
                  <div style={{color:'#777', fontSize:13, lineHeight:1.5}}>{p.desc}</div>
                </div>
              </div>
            ))}
            <div style={{fontWeight:700, fontSize:16, marginBottom:12, marginTop:8}}>⚖️ ЖИНГИЙН ХУВААРИЛАЛТ</div>
            {WEIGHT_DIST.map((w, i) => (
              <div key={i} style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:10, padding:14, marginBottom:8}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                  <span style={{color:'#aaa', fontSize:13}}>{w.label}</span>
                  <span style={{color:w.color, fontWeight:700, fontSize:13}}>{w.front}% / {w.rear}%</span>
                </div>
                <div style={{height:8, background:'#222', borderRadius:4, display:'flex', overflow:'hidden'}}>
                  <div style={{width: w.front + '%', background:w.color}}/>
                  <div style={{flex:1, background:w.color + '44'}}/>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
                  <span style={{color:'#444', fontSize:10}}>Урд хөл</span>
                  <span style={{color:'#444', fontSize:10}}>Хойд хөл</span>
                </div>
              </div>
            ))}
          </div>
        )}
 
        {tab === 2 && (
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
 
        {tab === 3 && (
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
 
        {tab === 4 && (
  <div>
    <div style={{fontSize:22, fontWeight:900, marginBottom:16}}>💪 ДАСГАЛЫН ХУВААРЬ</div>

    <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:12}}>
      <div style={{color:'#888', fontSize:13, marginBottom:8}}>AI-аар 7 хоногийн хуваарь гарга</div>

      <button
        onClick={genWork}
        style={{width:'100%', padding:'14px', background:'linear-gradient(135deg,#E8002D,#FF6D00)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:16, fontWeight:700}}
      >
        {workLoad ? 'Боловсруулж байна...' : '🥊 AI ХУВААРЬ ГАРГАХ'}
      </button>

      <button
        onClick={markWorkoutDone}
        style={{
          width: "100%",
          padding: "14px",
          background: "#76FF03",
          color: "#000",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 800,
          marginTop: 10
        }}
      >
        ✅ ӨНӨӨДРИЙН ДАСГАЛ ХИЙСЭН
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
      {['🥊Гараа буулгах үед эрүү шууд ил гардаг. Жаб эсвэл кросс цохисны дараа гараа заавал нүүрний хамгаалалт руу буцаа.','👣 Хөл хөдөлгөөнгүй бол өрсөлдөгч зайгаа амархан тааруулна. Цохилт бүрийн дараа жижиг алхам эсвэл өнцөг солилт хий.','💨 Амьсгалаа барих нь хурд, хүч, тэсвэрийг хурдан унагадаг. Цохилт хийх бүрт богино “hss” амьсгал гарга.','👁️ Зөвхөн гар харах нь хуурамч хөдөлгөөнд хууртах эрсдэлтэй. Цээж, мөр, ташааны хөдөлгөөнөөс цохилтын чиглэлийг унш.','🦵 Өвдөг хөшүүн байвал хамгаалалт, дайралт удааширна. Өвдгөө сул нугалж, жингээ хоёр хөл дээр тэнцвэртэй хадгал.','🛡️ Довтлохдоо хамгаалалтаа мартвал counter авах магадлал өндөр. Combo бүрийн төгсгөлд guard, slip эсвэл step-out хий.','🎯 Хэт хүчтэй цохих гэж оролдох үед техник задардаг. Эхлээд зөв байрлал, timing, balance дээр төвлөр.'].map((t, i) => (
        <div key={i} style={{color:'#777', fontSize:13, padding:'7px 0', borderBottom: i < 4 ? '1px solid #1a1a1a' : 'none'}}>{t}</div>
      ))}
    </div>
  </div>
)}
 
        {tab === 5 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:16}}>🥗 ХООЛ ТЭЖЭЭЛ</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
              {[
                {label:'Уураг', val: Math.round(weight*1.8)  + 'г', color:'#E8002D', icon:'🥩'},
                {label:'Нүүрс ус', val: Math.round(weight*4) + 'г', color:'#FFC107', icon:'🍚'},
                {label:'Өөх тос', val: Math.round(weight*0.8)  + 'г', color:'#76FF03', icon:'🥑'},
                {label:'Калори', val: Math.round(weight*33) + '', color:'#00E5FF', icon:'🔥'},
              ].map((m, i) => (
                <div key={i} style={{background:'#111', border:'1px solid ' + m.color + '22', borderRadius:12, padding:14, textAlign:'center'}}>
                  <div style={{fontSize:26, marginBottom:4}}>{m.icon}</div>
                  <div style={{fontSize:24, color:m.color, fontWeight:900}}>{m.val}</div>
                  <div style={{color:'#555', fontSize:11}}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{color:'#444', fontSize:11, textAlign:'center', marginBottom:16}}>Тайван амьдралын үндсэн хэрэгцээ</div>
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
 
        {tab === 6 && (
          <div>
            <div style={{fontSize:22, fontWeight:900, marginBottom:4}}>📊 ДҮН ШИНЖИЛГЭЭ</div>
            <div style={{color:'#555', fontSize:12, marginBottom:16}}>AI техник шинжилгээ болон зөвлөгөө</div>
            <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:12}}>
              <div style={{color:'#888', fontSize:13, lineHeight:1.7, marginBottom:12}}>AI таны боксын техникийг шинжлэн дутагдал болон сайжруулах талбарыг тодорхойлно.</div>
              <button onClick={genAnalysis} style={{width:'100%', padding:'14px', background:'linear-gradient(135deg,#0a0a3a,#00E5FF)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:16, fontWeight:700}}>
                {anaLoad ? 'Шинжилж байна...' : '📊 AI ШИНЖИЛГЭЭ ХИЙХ'}
              </button>
            </div>
            {analysis && (
              <div style={{background:'#111', border:'1px solid #00E5FF33', borderRadius:14, padding:16, marginBottom:12}}>
                <div style={{color:'#00E5FF', fontWeight:700, marginBottom:8}}>🤖 AI ДҮГНЭЛТ</div>
                <div style={{color:'#ccc', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap'}}>{analysis}</div>
              </div>
            )}
            <div style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:14, padding:16}}>
              <div style={{fontWeight:700, marginBottom:10, color:'#FFC107'}}>⚡ ТҮГЭЭМЭЛ АЛДААНУУД</div>
              {[
                {a:'❌ Гараа буулгах', b:'✅ Нударга нүүрийн өндөрт байлга'},
                {a:'❌ Нэг газраа зогсох', b:'✅ Байнга хөдөл'},
                {a:'❌ Амьсгалаа барих', b:'✅ Цохих бүрт амьсгал гарга'},
                {a:'❌ Өрсөлдөгчийн гарыг хар', b:'✅ Нүдийг хар'},
              ].map((t, i) => (
                <div key={i} style={{marginBottom:10, padding:'8px', background:'#1a1a1a', borderRadius:8}}>
                  <div style={{color:'#E8002D', fontSize:12, marginBottom:4}}>{t.a}</div>
                  <div style={{color:'#76FF03', fontSize:12}}>{t.b}</div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {tab === 7 && (
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
                <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Асуулт бичнэ үү..." style={{flex:1, background:'#1a1a1a', border:'1px solid #252525', borderRadius:10, padding:'11px 14px', color:'#fff', fontSize:13, outline:'none', fontFamily:'sans-serif'}}/>
                <button onClick={send} style={{padding:'11px 16px', background:'#E8002D', border:'none', borderRadius:10, color:'#fff', fontSize:16, cursor:'pointer', fontFamily:'sans-serif'}}>➤</button>
              </div>
            </div>
          </div>
        )}
 
        {tab === 8 && (
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
          <div style={{width:'100%', maxWidth:480, margin:'0 auto', background:'#111', border:'1px solid #222', borderRadius:'20px 20px 0 0', padding:24, maxHeight:'80vh', overflowY:'auto'}} onClick={e => e.stopPropagation()}>
            <div style={{width:40, height:4, background:'#333', borderRadius:2, margin:'0 auto 20px'}}/>
            <div style={{color:modal.color, fontWeight:700, fontSize:22, marginBottom:8}}>{modal.boxer || modal.name}</div>
            <div style={{color:'#888', fontSize:14, lineHeight:1.85, marginBottom:14}}>{modal.info}</div>
            {modal.move && <div style={{background:'#1a1a1a', borderRadius:10, padding:14, color:'#aaa', fontSize:13, lineHeight:1.7, marginBottom:12}}>🥊 Техник: {modal.move}</div>}
            {modal.steps && (
              <div style={{background:'#1a1a1a', borderRadius:10, padding:14}}>
                {modal.steps.map((s, i) => (
                  <div key={i} style={{display:'flex', gap:10, alignItems:'center', marginBottom:8}}>
                    <div style={{width:22, height:22, borderRadius:'50%', background:modal.color+'22', border:'1px solid '+modal.color+'55', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:modal.color, fontWeight:700}}>{i+1}</div>
                    <span style={{color:'#ccc', fontSize:13}}>{s}</span>
                  </div>
                ))}
                {modal.use && <div style={{color:'#555', fontSize:12, marginTop:8}}>📌 {modal.use}</div>}
              </div>
            )}
            <button onClick={() => setModal(null)} style={{width:'100%', padding:'12px', background:'#1a1a1a', border:'1px solid #222', color:'#666', borderRadius:10, cursor:'pointer', fontSize:14, marginTop:16}}>Хаах</button>
          </div>
        </div>
      )}
    </div>
  );
}