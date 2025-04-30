(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode("#ninja-notify{color:#6495ed;font-family:sans-serif;position:fixed;top:1rem;right:1rem;padding:1em 2em;border:1px solid cornflowerblue;border-radius:.5em}")),document.head.appendChild(e)}}catch(o){console.error("vite-plugin-css-injected-by-js",o)}})();
(function(n,e){typeof exports=="object"&&typeof module<"u"?e(exports):typeof define=="function"&&define.amd?define(["exports"],e):(n=typeof globalThis<"u"?globalThis:n||self,e(n.ThreeDiagram={}))})(this,function(n){"use strict";const e=`<h1 id="ninja-notify">\r
  <span>Your ninja is: </span>\r
  <span id="name"></span>\r
</h1>\r
`,d="",t=["Kakashi","Itachi","Shikamaru"];function o(){return t[Math.floor(Math.random()*t.length)]}function a(){const i=document.createElement("div");i.innerHTML=e,document.body.appendChild(i),document.getElementById("name").innerText=o()}n.notifyNinja=a,Object.defineProperty(n,Symbol.toStringTag,{value:"Module"})});
