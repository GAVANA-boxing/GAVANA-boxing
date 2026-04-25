'use client';
import { useState } from 'react';

export default function Home() {
  const [msgs, setMsgs] = useState([{role:'assistant',content:'Сайн байна уу! Би GAVANA Boxing AI дасгалжуулагч'}]);
  const [inp, setInp] = useState('');
  const [load, setLoad] = useState(false);

  const send = async () => {
    if (!inp.trim() || load) return;
    const newMsgs = [...msgs, {role:'user',content:inp}];
    setMsgs(newMsgs);
    setInp('');
    setLoad(true);
    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:newMsgs})
      });
      const data = await res.json();
      console.log('Response:', data);
      const text = data.content && data.content[0] ? data.content[0].text : JSON.stringify(data);
      setMsgs(p => [...p, {role:'assistant',content:text}]);
    } catch(e) {
      setMsgs(p => [...p, {role:'assistant',content:'Error: ' + e.message}]);
    }
    setLoad(false);
  };

  return (
    <main style={{minHeight:'100vh',background:'#080808',color:'#fff',maxWidth:480,margin:'0 auto',padding:16}}>
      <div style={{textAlign:'center',padding:'20px 0',borderBottom:'2px solid #E8002D',marginBottom:20}}>
        <h1 style={{color:'#E8002D',fontSize:28,letterSpacing:6,margin:0}}>GAVANA BOXING</h1>
        <p style={{color:'#555',fontSize:11,letterSpacing:4,margin:0}}>AI ДАСГАЛЖУУЛАГЧ</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',height:'70vh',background:'#111',borderRadius:16,padding:16}}>
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:10,marginBottom:12}}>
          {msgs.map((m,i) => (
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:14,background:m.role==='user'?'#E8002D':'#222',fontSize:14,lineHeight:1.6}}>
                {m.content}
              </div>
            </div>
          ))}
          {load && <div style={{padding:'10px 14px',background:'#222',borderRadius:14,width:'fit-content',color:'#888'}}>Бодож байна...</div>}
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Боксын талаар асуу..." style={{flex:1,background:'#222',border:'1px solid #333',borderRadius:10,padding:'10px 14px',color:'#fff',fontSize:14,outline:'none'}}/>
          <button onClick={send} style={{padding:'10px 18px',background:'#E8002D',border:'none',borderRadius:10,color:'#fff',fontSize:18,cursor:'pointer'}}>Send</button>
        </div>
      </div>
    </main>
  );
}