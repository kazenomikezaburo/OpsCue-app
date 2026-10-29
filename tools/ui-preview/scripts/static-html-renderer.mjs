import postcss from 'postcss';
import values from 'postcss-value-parser';
const tags=new Set(['main','section','article','div','h1','h2','h3','p','span','small','dl','dt','dd']);
const attributes=new Set(['className','role','id']);
function plain(value) {
 if(!value || Object.getPrototypeOf(value)!==Object.prototype ||
    Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>!Object.hasOwn(d,'value')))throw new Error('opaque display object');
}
export function escapeHtml(text) {
 return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
export function createHtmlRenderer({components=[],isComponent=()=>false}={}) {
 if(components.some(fn=>typeof fn!=='function' || !isComponent(fn)))throw new Error('unverified component');
 const allowed=new Set(components);
 function render(node,depth=0) {
  if(depth>80)throw new Error('display depth exceeded');
  if(typeof node==='string')return escapeHtml(node);
  if(typeof node==='number' && Number.isFinite(node))return escapeHtml(node);
  if(Array.isArray(node)) {
   let text='';for(let i=0;i<node.length;i++){
    const d=Object.getOwnPropertyDescriptor(node,String(i));
    if(!d || !Object.hasOwn(d,'value'))throw new Error('opaque children');
    text+=render(d.value,depth+1);
   }return text;
  }
  plain(node);if(Object.keys(node).some(key=>!['type','props'].includes(key)))throw new Error('unknown display field');
  plain(node.props);
  if(typeof node.type==='function') {
   if(!allowed.has(node.type) || !isComponent(node.type))throw new Error('unknown component');
   if(Object.keys(node.props).some(key=>key!=='children'))throw new Error('unknown component prop');
   return render(node.type(node.props),depth+1);
  }
  if(!tags.has(node.type))throw new Error('unknown or prohibited tag');
  let attrs='';
  for(const [name,value]of Object.entries(node.props)) {
   if(name==='children')continue;
   if(!attributes.has(name) || typeof value!=='string')throw new Error('unknown attribute');
   if(name==='role' && !['alert','status'].includes(value))throw new Error('unknown role');
   if(name==='id' && !/^[a-z][a-z0-9-]*$/.test(value))throw new Error('unknown id');
   attrs+=' '+(name==='className'?'class':name)+'="'+escapeHtml(value)+'"';
  }
  const children=Object.hasOwn(node.props,'children')?render(node.props.children,depth+1):'';
  return '<'+node.type+attrs+'>'+children+'</'+node.type+'>';
 }
 return render;
}
const properties=new Set(['box-sizing','margin','margin-top','color','background','font-family',
 'max-width','min-width','padding','font-size','display','grid-template-columns','gap',
 'border','border-radius','text-align','flex','flex-wrap','font-weight','line-height',
 'overflow-wrap','align-items']);
export function checkStaticCss(text) {
 if(typeof text!=='string' || /\\|javascript\s*:|(?:https?|data|file)\s*:|<\/style/i.test(text))throw new Error('opaque CSS');
 if(/sourceMappingURL|sourceURL/i.test(text))throw new Error('source-map annotation refused');
 const ast=postcss.parse(text,{map:false}); // Parser only: no process(), plugins or file loader.
 ast.walkAtRules(rule=>{
  if(rule.name!=='media' || !/^\(max-width:\s*\d+px\)$/.test(rule.params))throw new Error('unapproved CSS at-rule');
 });
 ast.walkRules(rule=>{
  if(!/^[a-zA-Z0-9.*# ,>_-]+$/.test(rule.selector))throw new Error('unapproved selector');
 });
 ast.walkDecls(decl=>{
  if(!properties.has(decl.prop))throw new Error('unapproved CSS property');
  values(decl.value).walk(node=>{
   if(node.type==='function' && !['repeat','minmax','oklch'].includes(node.value))throw new Error('unapproved CSS function');
   if(node.type==='word' && /[:\\]/.test(node.value))throw new Error('unapproved CSS reference');
  });
 });
 return text;
}
