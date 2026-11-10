import {mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const at=p=>new URL(p,root);
await rm(at('dist/'),{recursive:true,force:true});
await mkdir(at('dist/'),{recursive:true});
await cp(at('assets/'),at('dist/assets/'),{recursive:true,filter:source=>!source.endsWith('case-assets.json')&&!source.endsWith('production-assets.json')});
await cp(at('index.html'),at('dist/index.html'));
await cp(at('style.css'),at('dist/style.css'));
const slugs={spruit:'spruit','royal-floraholland':'royal-flora-holland','nefit-bosch':'nefit-bosch',gitp:'gitp',bna:'bna'};
const pages={};
for(const [slug,file] of Object.entries(slugs)) pages['/proof-of-work/'+slug]=await readFile(at('cases/'+file+'.html'),'utf8');
// Case HTML is bundled into the Worker, never into public static assets.
await writeFile(at('worker/content.mjs'),'export const pages='+JSON.stringify(pages)+';\nexport const login='+JSON.stringify(await readFile(at('login.html'),'utf8'))+';\n');
console.log('Built homepage, public assets and five server-protected cases.');
