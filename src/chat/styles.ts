import { C } from "../theme";

export const CHAT_STYLE_ID = "simply-chat-styles";

/* Stile del pannello chat predefinito. Se usi una tua UI con useChatComposer non ti serve. */
export const CHAT_CSS = `
.simply-chat{position:fixed;display:flex;flex-direction:column;background:#fff;color:${C.ink};border:2.5px solid ${C.ink};
  font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 12px 32px rgba(31,31,35,.18);
  transform-origin:100% 100%;animation:simply-chat-in .28s cubic-bezier(.34,1.56,.64,1) both;z-index:2147482000}
@keyframes simply-chat-in{from{opacity:0;transform:scale(.85) translateY(10px)}to{opacity:1;transform:none}}
/* nuvoletta compatta: solo il campo, con la codina verso Simply */
.simply-chat.fading{opacity:.45;transition:opacity 2.3s linear}
.simply-chat{transition:opacity .2s}
.simply-chat.compact{width:min(340px,calc(100vw - 24px));border-radius:24px;padding:8px}
.simply-chat.compact::after{content:"";position:absolute;right:var(--simply-tail-right,58px);bottom:-9px;width:14px;height:14px;background:#fff;
  border-right:2.5px solid ${C.ink};border-bottom:2.5px solid ${C.ink};transform:rotate(45deg)}
.simply-chat.compact.anchored::after{right:auto;left:calc(var(--simply-tail-x) - 7px)}
.simply-chat.compact.anchored.below::after{bottom:auto;top:-9px;transform:rotate(225deg)}
.simply-chat.full{width:min(400px,calc(100vw - 24px));height:min(560px,calc(100vh - 170px));border-radius:22px;overflow:hidden}
.simply-chat-head{display:flex;align-items:center;gap:4px;padding:10px 8px 10px 16px;background:${C.purple};color:#fff}
.simply-chat-head strong{font-size:16px}
.simply-chat-sub{font-size:12px;opacity:.8;flex:1;margin-left:6px}
.simply-hbtn{all:unset;cursor:pointer;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:inherit}
.simply-hbtn:hover,.simply-hbtn:focus-visible{background:rgba(255,255,255,.18)}
.simply-chat.compact .simply-hbtn{color:${C.ink};width:36px;height:36px;flex:0 0 auto;margin-bottom:5px}
.simply-hbtn svg{display:block}
.simply-chat.compact .simply-hbtn:hover,.simply-chat.compact .simply-hbtn:focus-visible{background:#F1ECF8}
.simply-chat-list{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#FAF7FF;
  scrollbar-width:thin;scrollbar-color:#D9D0E6 transparent}
.simply-chat-list::-webkit-scrollbar{width:6px}
.simply-chat-list::-webkit-scrollbar-thumb{background:#D9D0E6;border-radius:3px}
.simply-chat-empty{margin:auto;text-align:center;font-size:14px;opacity:.6;max-width:240px}
.simply-msg{max-width:82%;padding:8px 12px;border-radius:16px;font-size:14px;white-space:pre-wrap;word-break:break-word;display:flex;flex-direction:column;gap:6px}
.simply-msg.me{align-self:flex-end;background:${C.purple};color:#fff;border-bottom-right-radius:4px}
.simply-msg.bot{align-self:flex-start;background:${C.cream};border-bottom-left-radius:4px}
.simply-msg img{max-width:100%;max-height:180px;border-radius:10px;display:block}
.simply-msg audio{max-width:220px;height:36px}
.simply-msg-att{display:flex;flex-wrap:wrap;gap:6px}
.simply-steps{display:flex;flex-direction:column;gap:4px;min-width:210px}
.simply-step{display:flex;align-items:center;gap:8px;font-size:13px;padding:5px 9px;border-radius:10px;background:#fff;border:1.5px solid #E7DFF2;white-space:normal}
.simply-step .lbl{flex:1}
.simply-step small{display:block;font-size:11.5px;opacity:.75}
.simply-step.error{border-color:#F3B4A6;background:#FFF5F2;color:#B23A22}
.simply-step.done .st{color:#1E9C6A}
.simply-step .st{font-weight:800;flex:0 0 auto}
.simply-spin{display:block;width:12px;height:12px;border:2px solid #D9D0E6;border-top-color:${C.purple};border-radius:50%;animation:simply-spin .8s linear infinite}
@keyframes simply-spin{to{transform:rotate(360deg)}}
.simply-file{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.2);font-size:13px}
.simply-msg.bot .simply-file{background:#fff}
.simply-chat-tray{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:none}
.simply-chat-tray::-webkit-scrollbar{display:none}
.simply-chat.full .simply-chat-tray{padding:10px 12px 0;border-top:1.5px solid #EEE9F5}
.simply-chip{position:relative;flex:0 0 auto;display:flex;align-items:center;gap:8px;border:2px solid ${C.ink};border-radius:12px;padding:6px 26px 6px 8px;font-size:12.5px;max-width:200px;background:#fff}
.simply-chip img{width:40px;height:40px;object-fit:cover;border-radius:8px}
.simply-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.simply-chip small{opacity:.6}
.simply-chip audio{width:150px;height:32px}
.simply-chip-x{all:unset;cursor:pointer;position:absolute;top:2px;right:4px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:15px}
.simply-chip-x:hover{background:#EEE9F5}
.simply-chat-err{margin:0 4px 8px;padding:8px 10px;border-radius:10px;background:#FFF0ED;color:#B23A22;font-size:13px}
.simply-chat.full .simply-chat-err{margin:8px 12px 0}
.simply-chat-bottom{display:flex;align-items:flex-end;gap:4px}
.simply-chat.full .simply-chat-bottom{padding:10px 12px 12px}
/* campo moderno: graffetta e microfono/invio dentro la pillola */
.simply-input{flex:1;display:flex;align-items:flex-end;gap:2px;min-width:0;border:2px solid ${C.ink};border-radius:24px;padding:3px;background:#fff;transition:border-color .15s,box-shadow .15s}
.simply-input:focus-within{border-color:${C.purpleLight};box-shadow:0 0 0 3px rgba(122,63,181,.16)}
.simply-input textarea{flex:1;min-width:0;resize:none;border:0;outline:none;background:transparent;color:${C.ink};font:inherit;
  padding:7px 4px;max-height:140px;line-height:1.4;overflow-y:hidden;scrollbar-width:none}
.simply-input textarea::-webkit-scrollbar{display:none}
.simply-input textarea::placeholder{color:#8C8696}
.simply-ico{all:unset;cursor:pointer;flex:0 0 auto;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#5B5566;transition:background .15s,color .15s}
.simply-ico:hover,.simply-ico:focus-visible{background:#F1ECF8;color:${C.ink}}
.simply-ico.primary{background:${C.purple};color:#fff}
.simply-ico.primary:hover,.simply-ico.primary:focus-visible{background:${C.purpleLight};color:#fff}
.simply-ico.danger{color:#B23A22}
.simply-mic-wrap{position:relative;flex:0 0 auto}
.simply-ico.active{background:#F1ECF8;color:${C.ink}}
.simply-mic-menu{position:absolute;right:-4px;bottom:calc(100% + 10px);z-index:5;display:flex;flex-direction:column;gap:2px;min-width:230px;
  padding:6px;background:#fff;border:2px solid ${C.ink};border-radius:16px;box-shadow:0 10px 24px rgba(31,31,35,.18);
  animation:simply-chat-in .2s cubic-bezier(.34,1.56,.64,1) both;transform-origin:100% 100%}
.simply-mic-menu button{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:11px;color:${C.ink}}
.simply-mic-menu button:hover,.simply-mic-menu button:focus-visible{background:#F1ECF8}
.simply-mic-menu span{display:flex;flex-direction:column;line-height:1.25}
.simply-mic-menu strong{font-size:14px}
.simply-mic-menu small{font-size:12px;opacity:.65}
/* microfono: niente menu/selezione del browser sulla pressione lunga, anello che si riempie mentre tieni premuto */
.simply-mic{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.simply-mic.holding::after{content:"";position:absolute;inset:-3px;border-radius:50%;
  background:conic-gradient(${C.coral} calc(var(--p,0)*1turn), transparent 0);
  -webkit-mask:radial-gradient(circle, transparent 58%, #000 60%);mask:radial-gradient(circle, transparent 58%, #000 60%);
  animation:simply-hold var(--hold-ms,420ms) linear forwards}
@property --p{syntax:"<number>";inherits:false;initial-value:0}
@keyframes simply-hold{from{--p:0}to{--p:1}}
.simply-mic.holding{background:#FFF0ED;color:${C.coral}}
.simply-mic-hint{position:absolute;right:-6px;bottom:calc(100% + 10px);z-index:5;width:max-content;max-width:220px;padding:7px 10px;border-radius:10px;
  background:${C.ink};color:#fff;font-size:12.5px;font-weight:600;line-height:1.3;animation:simply-chat-in .25s cubic-bezier(.34,1.56,.64,1) both;
  transform-origin:100% 100%;pointer-events:none}
.simply-mic-hint::after{content:"";position:absolute;right:18px;top:100%;border:6px solid transparent;border-top-color:${C.ink}}
.simply-ico.listening{animation:simply-listen 1.2s ease-in-out infinite}
@keyframes simply-listen{0%,100%{box-shadow:0 0 0 0 rgba(122,63,181,.45)}50%{box-shadow:0 0 0 6px rgba(122,63,181,0)}}
.simply-ico[disabled]{opacity:.4;cursor:default}
.simply-rec{flex:1;display:flex;align-items:center;gap:10px;height:36px;padding:0 8px;font-weight:600;font-size:14px}
.simply-rec i{width:10px;height:10px;border-radius:50%;background:${C.coral};animation:simply-rec 1s ease-in-out infinite}
@keyframes simply-rec{50%{opacity:.25}}
.simply-chat-drop{position:absolute;inset:0;border-radius:inherit;display:grid;place-items:center;background:rgba(94,42,146,.88);color:#fff;font-weight:700;font-size:16px;pointer-events:none}

`;
