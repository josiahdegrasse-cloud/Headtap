// IndexedDB avoids localStorage's small quota for large music libraries.
async function database():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('headtap-local',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('data');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
export async function localRead<T>(key:string):Promise<T|undefined> {
  const db=await database();
  try { return await new Promise((resolve,reject)=>{const request=db.transaction('data').objectStore('data').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
  finally { db.close(); }
}
export async function localWrite(key:string,value:unknown) {
  const db=await database();
  try { await new Promise<void>((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}); }
  finally {db.close();}
}
export async function localScope(session:string) {
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(session));
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
