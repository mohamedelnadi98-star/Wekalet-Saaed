import webpush from 'web-push';
const keys=webpush.generateVAPIDKeys();
console.log('Keep the private key on your server. Never commit it.');
console.log('VAPID_PUBLIC_KEY='+keys.publicKey);
console.log('VAPID_PRIVATE_KEY='+keys.privateKey);
