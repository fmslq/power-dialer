function idleMinutes(root,now,onCall=!1){if(onCall)return 0;const t=root.lastDialAt;return Number.isFinite(t)&&t>0&&t<=now?(now-t)/6e4:null}export{idleMinutes};
