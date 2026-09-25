export function tripStatus(s,t=s.trip){
 if(!t)return 'العربية موجودة في الوكالة';
 const leg=t.legs?.[t.legIndex],event=t.vehicleId===s.selectedVehicle?s.tripEvent:t.event,delay=t.vehicleId===s.selectedVehicle?s.tripDelay:t.delay;
 if(event)return event.kind==='breakdown'?'العربية تنتظر قرار إصلاح أو إنقاذ':'العميل رفض الاستلام — اختر قرارًا';
 if(delay>0)return 'انتظار الطريق · '+Math.ceil(delay)+' ث';
 if(!leg)return 'إنهاء الرحلة';
 if(leg.yard==='out')return t.legElapsed<(leg.hold||0)?'تجهيز السائق وانتظار خلو البوابة':'الخروج من الجراج';
 if(leg.yard==='in')return 'الدخول إلى الجراج والركن';
 if(leg.returning)return t.cargo.length?'رجوع بالمرتجع إلى الوكالة':'رجوع إلى الوكالة — العربية فاضية';
 const name=s.clients[leg.client]?.name||'العميل';
 if(leg.kind==='unload')return t.legElapsed<(leg.windowWait||0)?'انتظار موعد استلام '+name+' · '+Math.ceil(leg.windowWait-t.legElapsed)+' ث':'تفريغ عند '+name;
 return 'في الطريق إلى '+name;
}
