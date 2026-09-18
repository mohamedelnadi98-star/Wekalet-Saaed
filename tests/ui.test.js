import {StoryUI} from '../ui-story.js';
import {DevelopmentUI} from '../ui-development.js';
import {LogisticsUI} from '../ui-logistics.js';import {installMobileUI} from '../mobile.js';
import {CloudUI} from '../ui-cloud.js';import {EditorUI} from '../ui-editor.js';import {VoiceUI} from '../voice.js';
import {ExpansionUI} from '../ui-expansion.js';import {GuideUI} from '../guide.js';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as Agency from '../economy.js';import {AgencyUI} from '../ui-v4.js';import {installFeatureUI} from '../ui-features.js';import {AgencyNetwork} from '../network.js';import {SaveSlots} from '../save-slots.js';
const elements=new Map();const listeners={};const el=()=>({style:{},dataset:{},value:'محمد',hidden:false,innerHTML:'',textContent:'',tagName:'BODY',classList:{toggle(){},add(){},remove(){}},focus(){},appendChild(child){if(child?.id)elements.set('#'+child.id,child)},addEventListener(type,fn){(this.listeners??={})[type]=fn},setAttribute(){},querySelector:()=>el(),querySelectorAll:()=>[],remove(){}});const get=s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s)};
const document={querySelector:get,querySelectorAll:()=>[],createElement:()=>el(),body:el(),getElementById:get,activeElement:el(),addEventListener:(type,fn)=>{listeners[type]=fn}};
class World{constructor(){this.active=false;this.player={position:{set(){}}};this.keys={}}sync(){}quality(){}setView(){}goTo(){}update(){}beginStory(){}setStoryShot(){}endStory(){}}
let animationFrame=null;
globalThis.document=document;
globalThis.window={addEventListener(){}};
const context={StoryUI,DevelopmentUI,LogisticsUI,installMobileUI,CloudUI,EditorUI,VoiceUI,structuredClone,ExpansionUI,GuideUI,AgencyNetwork:class extends AgencyNetwork{constructor(g,s,l){super(g,s,l,()=>{})}},Agency,AgencyUI,installFeatureUI,SaveSlots,registerPWA(){},notifyLocal(){},AgencyWorld:World,document,window:{addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},console,performance:{now:()=>0},requestAnimationFrame(fn){animationFrame=fn},setTimeout(){},URL,Blob};vm.createContext(context);let source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/\}\)\(\);\s*$/, 'window.testUI={panels,open,close,start,story,getSim:()=>sim};})();');vm.runInContext(source,context);let api=context.window.testUI;assert(api);api.start(true);let s=api.getSim().s;
for(const name of Object.keys(api.panels)){const view=api.panels[name]();assert.equal(view.length,3);assert(!view[2].includes('undefined'),'Unresolved UI value in '+name);}
api.getSim().sign('تاجر');api.getSim().inventory();api.getSim().repair();s.delivered=5;s.mission=11;api.getSim().hire('driver');api.getSim().contract('bakery');api.getSim().generateOrder(true);const order=s.orders[0];api.getSim().accept(order.id);api.getSim().buy('bread',10);api.getSim().tick(9);api.getSim().receive(s.incoming[0].id);api.getSim().pack(order.id);api.getSim().load();
for(const name of Object.keys(api.panels)){const view=api.panels[name]();assert.equal(typeof view[2],'string');assert(!view[2].includes('undefined'),'Unresolved UI value in '+name);api.open(name);assert.equal(get('#panel-title').textContent,view[1]);api.close();}
console.log('PASS: UI startup and all panels, including expansion and guide render for new and active games (non-visual smoke test)');

globalThis.document=document;
api.getSim().enableStory(false);
let frameTime=0;const runFrames=n=>{for(let i=0;i<n;i++){frameTime+=100;animationFrame(frameTime)}};
api.open('guide');const pausedElapsed=api.getSim().s.elapsed;runFrames(120);assert.equal(api.getSim().s.elapsed,pausedElapsed);
api.close();runFrames(100);assert(Math.abs(api.getSim().s.elapsed-pausedElapsed-10)<1e-6);
assert(get('#panel-content').innerHTML!==undefined);console.log('PASS: guide pauses actual game frame loop; closing resumes orders and clock');

api.close();api.getSim().enableStory(true);api.story.handle({dataset:{action:'storyPresent'}});assert(api.story.active);const storyElapsed=api.getSim().s.elapsed;runFrames(100);assert.equal(api.getSim().s.elapsed,storyElapsed);const overlay=get('#story-overlay');assert(overlay.innerHTML.includes('assets/portraits/rabie.png'));const click=dataset=>overlay.listeners.click({target:{closest:()=>({dataset})},stopPropagation(){}});click({story:'next'});click({story:'next'});const trust=api.getSim().s.clients[0].trust;click({storyChoice:'people'});assert.equal(api.getSim().s.clients[0].trust,Math.min(100,trust+3));click({storyChoice:'people'});assert.equal(api.getSim().s.clients[0].trust,Math.min(100,trust+3));assert(api.story.active);click({story:'finish'});assert(!api.story.active);runFrames(10);assert(api.getSim().s.elapsed>storyElapsed);assert.doesNotThrow(()=>Agency.Simulation.validate(api.getSim().s));console.log('PASS: actual frame loop pauses during story, portrait/choices render, double click cannot reward twice, finish resumes');
