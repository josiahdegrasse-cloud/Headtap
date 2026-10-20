// Run once. Keep the generated private key stable: rotation requires resubscription.
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const pub=publicKey.export({format:'jwk'}), priv=privateKey.export({format:'jwk'});
const publicValue=Buffer.concat([Buffer.from([4]),Buffer.from(pub.x,'base64url'),Buffer.from(pub.y,'base64url')]).toString('base64url');
const path='.env.push';
writeFileSync(path,`VAPID_PUBLIC_KEY=${publicValue}\nVAPID_PRIVATE_KEY=${priv.d}\nSHOW_ALERTS_CRON_SECRET=${randomBytes(32).toString('base64url')}\n`,{flag:'wx',mode:0o600});
console.log(`Created ${path} (gitignored). Add VAPID_SUBJECT=mailto:your-real-contact-address before uploading secrets. No keys printed.`);
