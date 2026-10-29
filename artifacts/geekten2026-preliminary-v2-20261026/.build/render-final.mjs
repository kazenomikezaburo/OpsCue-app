import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
process.env.RUNTIME_NODE_MODULES='C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {importRuntimeModule}=await import(pathToFileURL('C:/Users/user/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations/container_tools/runtime_helpers.mjs').href);
const {PresentationFile,FileBlob}=await importRuntimeModule('@oai/artifact-tool');
const base='C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-v2-20261026';
const presentation=await PresentationFile.importPptx(await FileBlob.load(`${base}/output/OpsCue_GeekTen2026_Preliminary_v2.pptx`));
for(const [i,slide] of presentation.slides.items.entries()){
 const png=await presentation.export({slide,format:'png',scale:1.5});
 await fs.writeFile(`${base}/output/previews/slide-${i+1}.png`,new Uint8Array(await png.arrayBuffer()));
}
const montage=await presentation.export({format:'png',montage:true});
await fs.writeFile(`${base}/output/previews/overview.png`,new Uint8Array(await montage.arrayBuffer()));
console.log(JSON.stringify({slideCount:presentation.slides.items.length,renderedFromFinalPptx:true}));
