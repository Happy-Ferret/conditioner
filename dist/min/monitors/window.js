!function(e,n){"use strict";var t=function(){return e.innerWidth||n.documentElement.clientWidth},i=function(){return e.innerHeight||n.documentElement.clientHeight},r=function(e){return parseInt(e,10)},u={trigger:{resize:e},test:{"min-width":function(e){return r(e.expected)<=t()},"max-width":function(e){return r(e.expected)>=t()},"min-height":function(e){return r(e.expected)<=i()},"max-height":function(e){return r(e.expected)>=i()}}};"undefined"!=typeof module&&module.exports?module.exports=u:"function"==typeof define&&define.amd&&define(function(){return u})}(window,document);