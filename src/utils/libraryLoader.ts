// Follow every page, publishing partial results without claiming completion.
export async function loadSavedLibrary(getPage: (offset:number)=>Promise<any>, onPage:(tracks:any[],total:number,nextOffset:number|null)=>void|Promise<void>, seed:{tracks:any[];nextOffset:number|null} = {tracks:[],nextOffset:0}) {
  const tracks:any[] = [...seed.tracks];
  let offset:number|null = seed.nextOffset;
  while (offset !== null) {
    const data = await getPage(offset);
    if (!('nextOffset' in data)) throw new Error('Full-library loading requires the updated backend to be deployed.');
    if (!Array.isArray(data.items)) throw new Error('Invalid library response. Please retry.');
    if (data.nextOffset !== null && (!Number.isSafeInteger(data.nextOffset) || data.nextOffset <= offset)) throw new Error('Invalid library page. Please retry.');
    tracks.push(...data.items);
    await onPage([...tracks], data.total, data.nextOffset);
    offset = data.nextOffset;
  }
  return tracks;
}
