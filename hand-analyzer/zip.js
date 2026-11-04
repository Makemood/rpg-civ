// Read text entries directly in memory. Never extract archive paths to disk.
const decoder=new TextDecoder('utf-8');
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
export async function readZip(buffer){
  const bytes=new Uint8Array(buffer),view=new DataView(buffer);let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(view.getUint32(p,true)===0x06054b50){end=p;break;}
  if(end<0)throw Error('Повреждён ZIP: каталог не найден');
  if(view.getUint16(end+4,true)||view.getUint16(end+6,true))throw Error('Многотомный ZIP не поддерживается');
  const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true);
  if(count===65535||offset===0xffffffff)throw Error('ZIP64 не поддерживается');
  let p=offset,total=0;const entries=[];
  for(let i=0;i<count;i++){
    if(p+46>bytes.length||view.getUint32(p,true)!==0x02014b50)throw Error('Повреждён каталог ZIP');
    const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),crc=view.getUint32(p+16,true),size=view.getUint32(p+20,true),uncompressed=view.getUint32(p+24,true),nl=view.getUint16(p+28,true),el=view.getUint16(p+30,true),cl=view.getUint16(p+32,true),local=view.getUint32(p+42,true);
    const name=decoder.decode(bytes.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
    if(!/\.txt$/i.test(name)||name.startsWith('__MACOSX/'))continue;
    if(flags&1)throw Error('ZIP защищён паролем');
    if(![0,8].includes(method))throw Error('Метод сжатия ZIP не поддерживается');
    total+=uncompressed;if(total>120*1024*1024||uncompressed>40*1024*1024)throw Error('Лимит ZIP: 120 МБ суммарно, 40 МБ на текстовый файл');
    if(local+30>bytes.length||view.getUint32(local,true)!==0x04034b50)throw Error('Повреждён заголовок ZIP');
    const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
    if(start+size>bytes.length)throw Error('Данные ZIP обрезаны');
    let data=bytes.subarray(start,start+size);
    if(method===8){
      if(typeof DecompressionStream==='undefined')throw Error('Нужен современный браузер с поддержкой распаковки ZIP');
      const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let read=0;
      try{while(true){const {value,done}=await reader.read();if(done)break;read+=value.length;if(read>uncompressed||read>40*1024*1024)throw Error('Размер файла в ZIP неверен');chunks.push(value);}}catch(e){await reader.cancel();throw e;}
      data=new Uint8Array(read);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.length;}
    }
    if(data.length!==uncompressed||crc32(data)!==crc)throw Error('Не прошла проверка целостности ZIP');
    entries.push({name,text:decoder.decode(data)});
  }
  if(!entries.length)throw Error('В ZIP нет текстовых историй .txt');return entries;
}
