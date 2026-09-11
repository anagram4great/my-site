// Weather widget script (moved from inline in index.html)
(function(){
  const widget=document.getElementById('weather-widget');
  const card=document.getElementById('w-card');
  const emoji=document.getElementById('w-emoji');
  const tempE=document.getElementById('w-temp');
  const desc=document.getElementById('w-desc');
  const src=document.getElementById('w-source');
  const loc=document.getElementById('w-location');
  const handle=document.getElementById('w-handle');

  function codeToEmoji(code){
    if(code===0) return {e:'☀️',t:'Clear'};
    if(code>=1&&code<=3) return {e:'🌤️',t:'Partly cloudy'};
    if([45,48].includes(code)) return {e:'🌫️',t:'Fog'};
    if([51,53,55,56,57].includes(code)) return {e:'🌦️',t:'Drizzle'};
    if([61,63,65,80,81,82].includes(code)) return {e:'🌧️',t:'Rain'};
    if([66,67].includes(code)) return {e:'🌧️',t:'Freezing rain'};
    if([71,73,75,77,85,86].includes(code)) return {e:'❄️',t:'Snow'};
    if([95,96,99].includes(code)) return {e:'⛈️',t:'Thunderstorm'};
    return {e:'☁️',t:'Cloudy'};
  }

  async function fetchWeather(lat,lon){
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;
      const r=await fetch(url); if(!r.ok) throw new Error('weather');
      const data=await r.json(); const cw=data.current_weather; if(!cw) throw new Error('no current');
      const t=Math.round(cw.temperature); const m=codeToEmoji(cw.weathercode);
      emoji.textContent = m.e;
      tempE.textContent = `${t}°F`;
      desc.textContent = `${m.t} • Wind ${Math.round(cw.windspeed)} ${data.hourly_units?data.hourly_units.windspeed||'km/h':'km/h'}`;
      try{
        const gurl=`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&count=1`;
        const gr=await fetch(gurl);
        if(gr.ok){
          const gd=await gr.json();
          if(gd.results&&gd.results.length){
            const r0=gd.results[0];
            loc.textContent=[r0.name,r0.admin1,r0.country].filter(Boolean).join(', ');
          }
        }
      }catch(e){}
    }catch(e){desc.textContent='';src.textContent=''}
  }

  function useFallback(){loc.textContent='New York, US';src.textContent='';fetchWeather(40.7128,-74.0060)}

  let dragging=false,startX=0,startY=0,startLeft=0,startTop=0;
  function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
  function applyPos(l,t){widget.style.left=l+'px';widget.style.top=t+'px';widget.style.right='auto';widget.style.bottom='auto'}
  function savePos(){try{localStorage.setItem('weather.pos',JSON.stringify({left:widget.style.left,top:widget.style.top}))}catch(e){}}

  handle.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;widget.classList.add('dragging');startX=e.clientX;startY=e.clientY;const r=widget.getBoundingClientRect();startLeft=r.left;startTop=r.top;handle.setPointerCapture(e.pointerId)});
  window.addEventListener('pointermove',e=>{if(!dragging) return;const dx=e.clientX-startX,dy=e.clientY-startY;let left=startLeft+dx,top=startTop+dy;const vw=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0);const vh=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);const w=widget.offsetWidth,h=widget.offsetHeight;left=clamp(left,8,vw-w-8);top=clamp(top,8,vh-h-8);applyPos(left,top)});
  window.addEventListener('pointerup',e=>{if(!dragging) return;dragging=false;widget.classList.remove('dragging');try{handle.releasePointerCapture&&handle.releasePointerCapture(e.pointerId)}catch(e){};savePos()});

  // init
  try{const pos=JSON.parse(localStorage.getItem('weather.pos')||'null');if(pos&&pos.left&&pos.top){widget.style.left=pos.left;widget.style.top=pos.top;widget.style.right='auto';widget.style.bottom='auto'}}catch(e){}
  if('geolocation' in navigator){navigator.geolocation.getCurrentPosition(p=>{src.textContent='';fetchWeather(p.coords.latitude,p.coords.longitude)},()=>{useFallback()},{timeout:10000})}else{useFallback()}
})();
