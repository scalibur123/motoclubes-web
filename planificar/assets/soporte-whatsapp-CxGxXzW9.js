import{e as n,A as e,t as r}from"./index-B_iNC7XH.js";const i="34653835720";async function s(){let o="web";try{o=n.getPlatform()}catch{}const a=o==="ios"?"iPhone":o==="android"?"Android":"web";let t="";if(o==="ios"||o==="android")try{t=(await e.getInfo())?.version??""}catch{}return t?`${t} · ${a}`:a}function c(o){return`https://wa.me/${i}?text=${encodeURIComponent(o)}`}async function f(){return r("Hola, necesito ayuda con MOTOCLUBes.")+`

(MOTOCLUBes ${await s()})`}function p(o){window.location.href=c(o)}export{p as a,f as t,s as v};
