export interface Match { date:string; map:string; agent:string; result:'Win'|'Loss'; roundsWon:number; roundsLost:number; kills:number; deaths:number; assists:number; acs:number; firstKills:number; firstDeaths:number; headshotPercentage:number }
export const columns = ['date','map','agent','result','roundsWon','roundsLost','kills','deaths','assists','acs','firstKills','firstDeaths','headshotPercentage'] as const;
const rows: [string,string,boolean,number,number,number,number,number,number,number][] = [
 ['Ascent','Jett',false,9,18,19,4,234,3,5],['Haven','Neon',true,8,25,15,6,312,6,2],['Lotus','Raze',true,10,22,17,7,278,4,3],['Bind','Raze',false,11,19,20,5,226,3,4],['Sunset','Neon',true,7,24,13,4,301,5,2],
 ['Ascent','Jett',true,9,21,16,3,267,4,2],['Haven','Neon',true,11,27,19,7,319,7,4],['Lotus','Jett',false,8,14,18,3,184,2,5],['Bind','Raze',true,6,23,12,8,295,4,2],['Sunset','Neon',false,10,20,19,5,248,4,4],
 ['Ascent','Raze',false,7,13,18,6,178,1,4],['Haven','Jett',true,9,22,16,4,281,5,3],['Lotus','Neon',true,8,26,15,5,324,6,2],['Bind','Raze',false,9,17,19,7,219,2,3],['Sunset','Jett',true,11,24,18,3,292,5,4],
 ['Ascent','Neon',false,11,21,20,6,261,5,3],['Haven','Neon',true,5,23,10,8,306,6,1],['Lotus','Raze',true,9,21,16,9,274,3,3],['Bind','Jett',false,10,18,19,4,237,2,5],['Sunset','Neon',true,8,28,14,5,338,7,2]
];
export const demoMatches:Match[] = rows.map((r,i)=>({date:`2026-09-${String(i+6).padStart(2,'0')}`,map:r[0],agent:r[1],result:r[2]?'Win':'Loss',roundsWon:r[2]?13:r[3],roundsLost:r[2]?r[3]:13,kills:r[4],deaths:r[5],assists:r[6],acs:r[7],firstKills:r[8],firstDeaths:r[9],headshotPercentage:22+(i*7)%16}));
export const sum = (ms:Match[], key:keyof Match) => ms.reduce((s,m)=>s+Number(m[key]),0);
export const winRate = (ms:Match[]) => ms.length?ms.filter(m=>m.result==='Win').length/ms.length*100:0;
export const average = (ms:Match[],key:keyof Match) => ms.length?sum(ms,key)/ms.length:0;
export const kd = (ms:Match[]) => sum(ms,'deaths')?(sum(ms,'kills')/sum(ms,'deaths')).toFixed(2):sum(ms,'kills')?'8':'0.00';
export function analyze(ms:Match[]) {
 const acs=average(ms,'acs'), deviation=Math.sqrt(average(ms.map(m=>({...m,acs:(m.acs-acs)**2})),'acs'));
 const consistency=Math.round(Math.max(0,100-(acs?deviation/acs:0)*150));
 const groups=(key:'map'|'agent')=>[...new Set(ms.map(m=>m[key]))].map(name=>{const matches=ms.filter(m=>m[key]===name);return {name,matches:matches.length,winRate:winRate(matches),acs:average(matches,'acs'),kd:kd(matches)};});
 const maps=groups('map'), agents=groups('agent'), positive=ms.filter(m=>m.firstKills>m.firstDeaths), negative=ms.filter(m=>m.firstDeaths>=m.firstKills);
 const gap=winRate(positive)-winRate(negative), weakest=[...maps].sort((a,b)=>a.winRate-b.winRate)[0],best=[...agents].sort((a,b)=>b.acs-a.acs)[0];
 const insights=[{title:'The opening matters',text:positive.length&&negative.length?`Your win rate is ${Math.abs(gap).toFixed(0)} percentage points ${gap>=0?'higher':'lower'} when you win more opening duels than you lose. This is an association, not proof of causation.`:'Upload matches from both opening-duel groups to compare their win rates.'}, {title:'A map to work on',text:`${weakest.name} has your lowest win rate at ${weakest.winRate.toFixed(0)}% across ${weakest.matches} matches. Review your approaches and opening fights here.`},{title:'Your strongest damage output',text:`${best.name} produces your highest average ACS at ${best.acs.toFixed(0)} across ${best.matches} matches. Look for the habits you can carry into other agents.`},{title:ms.length<2?'More games, more signal':consistency>=75?'A steady foundation':'Raise your performance floor',text:ms.length<2?'Consistency needs at least two matches. Add more games to measure variation.':`Your ACS varies by ${deviation.toFixed(0)} points around a ${acs.toFixed(0)} average. ${consistency>=75?'Your output is relatively steady across this sample.':'Review your lowest-output games; consistency may offer more room to improve than peak performance.'}`}];
 return {acs,consistency,maps,agents,positive,negative,gap,insights};
}
export function parseCSV(text:string):Match[] {
 const records:string[][]=[]; let row:string[]=[],field='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(quoted||field.trim()==='')quoted=!quoted;else throw new Error('Unexpected quote in CSV.');}else if(c===','&&!quoted){row.push(field.trim());field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))records.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw new Error('A quoted field is missing its closing quote.');row.push(field.trim());if(row.some(Boolean))records.push(row);
 const header=records.shift();if(!header||header.join(',')!==columns.join(','))throw new Error('The CSV headers do not match. Download the example CSV for the required format.');
 if(!records.length)throw new Error('Your CSV has no matches. Add at least one match.');if(records.length>10000)throw new Error('Please upload 10,000 matches or fewer.');
 return records.map((r,i)=>{const line=i+2;if(r.length!==columns.length)throw new Error(`Row ${line}: expected 14 columns.`);const obj=Object.fromEntries(columns.map((c,j)=>[c,j<4?r[j]:Number(r[j])])) as unknown as Match;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(obj.date)||!Number.isFinite(Date.parse(obj.date))||new Date(obj.date).toISOString().slice(0,10)!==obj.date)throw new Error(`Row ${line}: use a valid date in YYYY-MM-DD format.`);
 if(!obj.map||!obj.agent||obj.map.length>40||obj.agent.length>40)throw new Error(`Row ${line}: provide a map and agent of up to 40 characters.`);
 const result=obj.result.toLowerCase();if(result!=='win'&&result!=='loss')throw new Error(`Row ${line}: result must be Win or Loss.`);obj.result=result==='win'?'Win':'Loss';
 for(let j=4;j<columns.length;j++){const value=Number(r[j]);if(!r[j]||!Number.isFinite(value)||value<0||value>10000||(j!==13&&!Number.isInteger(value)))throw new Error(`Row ${line}: ${columns[j]} must be a valid nonnegative ${j===13?'number':'integer'}.`);}
 if(obj.headshotPercentage>100)throw new Error(`Row ${line}: headshotPercentage must be between 0 and 100.`);
 if((obj.result==='Win'&&obj.roundsWon<=obj.roundsLost)||(obj.result==='Loss'&&obj.roundsWon>=obj.roundsLost))throw new Error(`Row ${line}: the score must agree with the result.`);
 if(obj.firstKills>obj.kills||obj.firstDeaths>obj.deaths||obj.firstKills+obj.firstDeaths>obj.roundsWon+obj.roundsLost)throw new Error(`Row ${line}: opening-duel counts are inconsistent with kills, deaths, or rounds.`);
 return obj;}).sort((a,b)=>a.date.localeCompare(b.date));
}
export function downloadExample(){const csv=[columns.join(','),...demoMatches.map(m=>columns.map(c=>m[c]).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='roundlens-example.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
