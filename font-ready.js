// Local font must load before generating canvas signage; fallback keeps startup usable.
if(globalThis.document?.fonts){await Promise.race([Promise.all([document.fonts.load('400 16px Cairo'),document.fonts.load('700 32px Cairo')]).catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]);}
export const fontReady=true;
