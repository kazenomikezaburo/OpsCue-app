import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
process.env.RUNTIME_NODE_MODULES='C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const workspaceDir='C:/Users/user/OpsCue/OpsCue-team-main/artifacts/geekten2026-preliminary-20261026';
const skill='C:/Users/user/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
await fs.mkdir(path.join(workspaceDir,'output','previews'),{recursive:true});
// The managed Windows filesystem rejects hard links. Retain every validator and
// no-overwrite behavior, using an exclusive byte copy only for this new output.
const nativeLink=fs.link.bind(fs);
let publicationFallback=false;
fs.link=async (source,destination)=>{
 try { return await nativeLink(source,destination); }
 catch(error){
  const folder=path.resolve(workspaceDir,'output');
  if(error.code!=='EPERM' || path.dirname(path.resolve(source))!==folder ||
     path.resolve(destination)!==path.join(folder,'OpsCue_GeekTen2026_Preliminary.pptx') ||
     !path.basename(source).endsWith('.validated')) throw error;
  await fs.copyFile(source,destination,constants.COPYFILE_EXCL);
  publicationFallback=true;
 }
};
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 workspaceDir,
 candidatePath:path.join(workspaceDir,'.build/candidate-v3.pptx'),
 finalPath:path.join(workspaceDir,'output','OpsCue_GeekTen2026_Preliminary.pptx'),
 pythonExecutable:'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 explicitTotalSlideCount:7,
 requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:['Noto Sans JP']},
 verifyArtifactToolImport:true,
 receiptPath:path.join(workspaceDir,'.build/final-validation.json')
});
await fs.writeFile(path.join(workspaceDir,'.build/finalizer-result.json'),JSON.stringify({...result,publicationFallback},null,2),'utf8');
console.log(JSON.stringify({finalPath:result.finalPath,receiptPath:result.receiptPath,sha256:result.finalSha256,bytes:result.byteCount,packageIntegrity:result.packageIntegrity,presentationLayout:result.presentationLayout,firstPartyImport:result.firstPartyImport,publicationFallback}));
