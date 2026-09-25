export const CITY_CLIENTS=[
{id:0,name:'ماركت الأمانة',area:'دمياط',trust:55,credit:8000,type:'grocery',district:'حي السوق',contact:'عم أمين',persona:'النقدية والالتزام أهم عندي من الخصم.',unlock:0,x:235,y:100},
{id:1,name:'سوبرماركت التقوى',area:'دمياط',trust:50,credit:6500,type:'super',district:'حي السوق',contact:'أحمد',persona:'توافر الصنف بانتظام هو اللي يخليني أكمل معاك.',unlock:0,x:375,y:85},
{id:2,name:'أسواق المدينة',area:'دمياط',trust:50,credit:7000,type:'super',district:'حي النخيل',contact:'سارة',persona:'براجع الكمية والصلاحية قبل أي استلام.',unlock:0,x:340,y:230},
{id:3,name:'هايبر الأمل',area:'الدقهلية',trust:45,credit:13000,type:'chain',district:'حي التوسع',contact:'مدير مشتريات الأمل',persona:'حجم الشغل كبير، لكن الحساب آجل والتسليم في ميعاده.',unlock:0,x:640,y:405},
{id:4,name:'أسواق مكة',area:'الدقهلية',trust:45,credit:12000,type:'super',district:'حي التوسع',contact:'الحاج ياسر',persona:'السرعة مفيدة، لكن مش على حساب سلسلة التبريد.',unlock:0,x:795,y:350},
{id:5,name:'ميني ماركت البركة',area:'دمياط',trust:50,credit:6000,type:'grocery',district:'حي النخيل',contact:'مدام هدى',persona:'طلبات صغيرة ونقدي، بس متنساش المحل وسط الكبار.',unlock:0,x:190,y:275},
{id:6,name:'مطعم حارة الشام',area:'دمياط',trust:60,credit:12000,type:'restaurant',district:'حي المطاعم',contact:'الشيف عمر',persona:'الخبز لازم يوصل قبل تجهيز الوجبات. غياب صنف يوقف المطبخ.',unlock:3,x:1020,y:210},
{id:7,name:'كافيه المرسى',area:'دمياط',trust:60,credit:12000,type:'restaurant',district:'حي المطاعم',contact:'ندى',persona:'اللبن المبرد أساس الشغل عندنا، مش بديل عن اللبن الموجود على الرف.',unlock:8,x:1180,y:270},
{id:8,name:'مطعم سفرة العيلة',area:'دمياط',trust:60,credit:16000,type:'restaurant',district:'حي المطاعم',contact:'الشيف حسن',persona:'وقت الغدا مزدحم؛ رتّب عربيتك واستلامي من بدري.',unlock:15,x:1390,y:220},
{id:9,name:'سلسلة توفير — الفرع الرئيسي',area:'الدقهلية',trust:65,credit:30000,type:'chain',district:'حي السلاسل',contact:'أستاذة مريم',persona:'محتاجة مورد ثابت. المقابل حجم مبيعات منتظم، والدفع بعد خمسة أيام.',unlock:25,x:1040,y:640},
{id:10,name:'سلسلة توفير — فرع الجامعة',area:'الدقهلية',trust:65,credit:30000,type:'chain',district:'حي الجامعة',contact:'أستاذ إيهاب',persona:'الطلاب بيشتروا كل يوم. النقص المتكرر عندي مشكلة كبيرة.',unlock:35,x:1230,y:710},
{id:11,name:'هايبر النخبة',area:'الدقهلية',trust:65,credit:30000,type:'chain',district:'حي السلاسل',contact:'مدير مشتريات النخبة',persona:'المجمدات تستلزم نقل سليم ومواعيد ثابتة. هنراجع أداء كل دورة.',unlock:60,x:1410,y:620}
];
export const CITY_WIDTH=1500,CITY_HEIGHT=800;
export const careFor=c=>({type:c.type,loyalty:55,late:0,shortages:0,lostUntil:0,creditLimit:c.credit,visitHour:8,remindedDay:0});
