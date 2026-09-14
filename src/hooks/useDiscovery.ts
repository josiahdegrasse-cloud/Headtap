import {useEffect,useRef,useState} from 'react';
import {defaultPreferences, type Preferences} from '../utils/discovery';
import {localRead,localScope,localWrite} from '../utils/localStore';
export function useDiscovery(session:string) {
  const [preferences,setPreferences]=useState<Preferences>(defaultPreferences);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const key=useRef('');
  const writes=useRef(Promise.resolve());
  useEffect(()=>{
    let active=true;
    setReady(false);
    (async()=>{
      try {
        const scope=await localScope(session);
        const saved=await localRead<Preferences>(`preferences:${scope}`);
        if(active){key.current=`preferences:${scope}`;setPreferences(saved?.feedback && saved?.saved ? saved : defaultPreferences);}
      } catch {if(active)setError('Browser storage unavailable. Preferences will last for this visit only.');}
      finally {if(active)setReady(true);}
    })();
    return()=>{active=false;};
  },[session]);
  useEffect(()=>{
    if(!ready || !key.current)return;
    const destination=key.current;
    writes.current=writes.current.then(()=>localWrite(destination,preferences)).catch(()=>setError('Could not save preferences on this browser.'));
  },[preferences,ready]);
  return {preferences,setPreferences,ready,error};
}
