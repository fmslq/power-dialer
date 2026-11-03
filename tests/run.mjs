import {runDialerTests} from './dialer.tests.js';
import {runZoomTests} from './zoom.tests.js';
import * as L from './legacy.tests.js';
import {runMetaTests} from '../core/meta.js';
import {runAchvTests} from '../core/achv.js';
import {runMissionTests} from '../core/missions.js';
import {runDialer2Tests} from './dialer2.tests.js';
import {run as runStats} from './stats.tests.js';
const all=[];for(const [n,f] of Object.entries({...L})){if(typeof f==='function'&&n.startsWith('run'))all.push(...f())}
all.push(...(await runDialer2Tests()),...runZoomTests(),...runMetaTests(),...runAchvTests(),...runMissionTests(),...runStats(),...runDialerTests());
let bad=0;for(const [n,ok] of all){if(!ok){bad++;console.log('FAIL',n)}}
console.log(all.length-bad+'/'+all.length+' тестов проходит');process.exit(bad?1:0);
