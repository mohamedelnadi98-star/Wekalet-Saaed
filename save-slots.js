export class SaveSlots{
 constructor(storage=localStorage){this.storage=storage;this.active=['1','2','3'].includes(storage.getItem('saeed_active_slot'))?storage.getItem('saeed_active_slot'):'1';if(!storage.getItem(this.key('1'))&&!storage.getItem('saeed_legacy_migrated')&&storage.getItem('saeed_agency_v3')){storage.setItem(this.key('1'),storage.getItem('saeed_agency_v3'));storage.setItem('saeed_legacy_migrated','1');}}
 key(slot=this.active){return 'saeed_agency_v3_slot_'+slot}
 load(){const raw=this.storage.getItem(this.key());return raw?JSON.parse(raw):null}
 save(state){this.storage.setItem(this.key(),JSON.stringify(state))}
 select(slot){if(!['1','2','3'].includes(String(slot)))throw Error('خانة حفظ غير صالحة');this.active=String(slot);this.storage.setItem('saeed_active_slot',this.active)}
 summary(slot){try{const s=JSON.parse(this.storage.getItem(this.key(slot)));return s?'اليوم '+s.day+' · '+String(s.name).slice(0,30):'خانة فارغة'}catch{return 'حفظ يحتاج مراجعة'}}
}
