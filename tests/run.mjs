// Все тесты: node tests/run.mjs (список групп — tests/groups.js, он же в Debug браузера).
import {runGroups} from './groups.js';
const R=await runGroups();let bad=0,all=0;
for(const g of R){all+=g.all;for(const n of g.fail){bad++;console.log('FAIL ['+g.n+']',n)}}
console.log(all-bad+'/'+all+' тестов проходит');process.exit(bad?1:0);
