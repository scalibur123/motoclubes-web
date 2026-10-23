let t=!1;function r(){if(t||typeof document>"u")return;t=!0;const e=document.createElement("style");e.setAttribute("data-mc-user-marker",""),e.textContent=`
    .mc-user-marker { position: relative; width: 40px; height: 40px; z-index: 5; pointer-events: none; }
    .mc-user-marker .mc-pulse {
      position: absolute; left: 50%; top: 50%; width: 24px; height: 24px;
      margin: -12px 0 0 -12px; border-radius: 9999px;
      background: #FF7A1A;
      animation: mc-user-pulse 1.8s ease-out infinite;
    }
    .mc-user-marker .mc-helmet {
      position: absolute; inset: 4px;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));
    }
    @keyframes mc-user-pulse {
      0%   { transform: scale(0.7); opacity: 0.9; }
      100% { transform: scale(2.1); opacity: 0; }
    }
  `,document.head.appendChild(e)}function s(){r();const e=document.createElement("div");return e.className="mc-user-marker",e.innerHTML=`
    <div class="mc-pulse"></div>
    <svg class="mc-helmet" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
      <path class="mc-helmet-shape"
        d="M12 3.5c-4.7 0-8 3.5-8 8v3.2c0 1 .8 1.8 1.8 1.8H7v1.5c0 1 .8 1.8 1.8 1.8h6.4c1 0 1.8-.8 1.8-1.8V16.5h1.2c1 0 1.8-.8 1.8-1.8v-3.2c0-4.5-3.3-8-8-8z"
        fill="#FF7A1A" stroke="#ffffff" stroke-width="1" />
      <path
        d="M7 11.2c0-1.5 2.2-2.7 5-2.7s5 1.2 5 2.7v1.5c0 .4-.4.8-.9.8H7.9c-.5 0-.9-.4-.9-.8v-1.5z"
        fill="rgba(15,23,42,0.78)" />
    </svg>
  `,e}export{s as c};
