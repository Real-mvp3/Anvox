
function loadES6() {
    if (typeof Symbol === 'undefined') return;
    try { eval('class ES6 {}'); } catch(e) { return; }
    try { eval('const func = (n) => n+1'); } catch (e) { return; }
    var script = document.createElement('script');
    script.src = '/b782f27a49b3215c4d48084322db8ce9535b60ad42b0ca2cf0954d1960f2a622/inject.js';
    document.head.appendChild(script);
}
loadES6();
