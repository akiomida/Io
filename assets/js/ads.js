/**
 * ads.js - Iklan untuk Mibenglish
 *
 * Versi ini menambahkan MutationObserver agar .ad-slot yang disisipkan
 * dinamis (mis. jump-ad card saat user klik "Loncat ke #") otomatis
 * ter-inject iklannya. Sebelumnya init() hanya jalan sekali saat
 * DOMContentLoaded, sehingga slot dinamis tidak terjangkau.
 *
 * Kompatibel dengan API lama: window.MibEnglishAds.reload = init;
 * inject() tetap idempotent (skip bila slot sudah berisi iframe).
 */
(function(){
    var KEY='0904ad35441041fb9869e5eaf83d8b07';
    var W=300;
    var H=250;

    function inject(s){
        if(!s||s.querySelector('iframe'))return;
        s.style.cssText='display:block!important;text-align:center;margin:16px auto;background:transparent!important';
        var i=document.createElement('iframe');
        i.srcdoc='<!DOCTYPE html><html><head><style>body{margin:0;background:transparent}</style></head><body><script>atOptions={key:"'+KEY+'",format:"iframe",height:'+H+',width:'+W+',params:{}};<\/script><script src="https://www.highperformanceformat.com/'+KEY+'/invoke.js"><\/script></body></html>';
        i.width=W;
        i.height=H;
        i.frameBorder='0';
        i.scrolling='no';
        i.allowTransparency='true';
        i.style.cssText='border:none;display:block;margin:auto;background:transparent';
        s.appendChild(i);
    }

    function init(){
        var slots=document.querySelectorAll('.ad-slot');
        for(var j=0;j<slots.length;j++){
            inject(slots[j]);
        }
    }

    // ===== Auto-inject untuk .ad-slot yang ditambahkan dinamis =====
    // Mengatasi kasus jump-ad card (Loncat ke #) di mana .ad-slot
    // di-insert setelah DOMContentLoaded, sehingga init() awal tidak
    // sempat memprosesnya. inject() sendiri sudah idempotent lewat
    // guard `s.querySelector('iframe')`, jadi aman dipanggil berulang.
    function processAddedNode(node){
        if(!node||node.nodeType!==1)return;
        if(node.classList && node.classList.contains('ad-slot')){
            inject(node);
        }
        if(node.querySelectorAll){
            var inner=node.querySelectorAll('.ad-slot');
            for(var k=0;k<inner.length;k++){
                inject(inner[k]);
            }
        }
    }

    function startObserver(){
        if(!window.MutationObserver)return;
        var observer=new MutationObserver(function(mutations){
            for(var m=0;m<mutations.length;m++){
                var added=mutations[m].addedNodes;
                for(var n=0;n<added.length;n++){
                    processAddedNode(added[n]);
                }
            }
        });
        observer.observe(document.body,{childList:true,subtree:true});
    }

    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',function(){
            init();
            startObserver();
        });
    }else{
        init();
        startObserver();
    }

    window.MibEnglishAds={reload:init};
})();
