// Время последнего реального набора: не используем таймер серии, он может сдвигаться движком.
export function idleMinutes(root,now,onCall=false){if(onCall)return 0;const t=root.lastDialAt;return Number.isFinite(t)&&t>0&&t<=now?(now-t)/60000:null}
