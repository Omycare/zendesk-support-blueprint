import assert from 'node:assert/strict';
import {taskDefinitions,freshTracking,normalizeTracking,metrics,safeTrainingURL} from '../frontend/tracking-data.js';
assert.equal(taskDefinitions.length,27);assert.equal(new Set(taskDefinitions.map(t=>t.id)).size,27);assert.equal(taskDefinitions[0].id,'KAN-548');assert.equal(taskDefinitions.at(-1).id,'KAN-574');
const t=freshTracking();assert.equal(t.meetings.length,8);t.tasks[0].status='done';t.tasks[0].hours=2.5;t.tasks[1].status='excluded';t.meetings[0].done=true;
const m=metrics({sections:{company:{reviewed:true},fields:{reviewed:false},review:{reviewed:true}},tracking:t});assert.equal(m.tasksDone,1);assert.equal(m.tasksTotal,26);assert.equal(m.hours,2.5);assert.equal(m.meetingsDone,1);assert.equal(m.meetingMinutes,30);assert.equal(m.documentsDone,1);assert.equal(m.documentsTotal,2);
t.meetings.push({id:9,done:true});assert.equal(normalizeTracking(t).meetings.length,8);t.tasks[0].hours=-3;assert.equal(normalizeTracking(t).tasks[0].hours,0);t.tasks[0].status='hacked';assert.equal(normalizeTracking(t).tasks[0].status,'todo');
assert.equal(safeTrainingURL('javascript:alert(1)'),'');assert.equal(safeTrainingURL('https://user:pass@example.com'),'');assert.equal(safeTrainingURL('https://training.example.com/course'),'https://training.example.com/course');assert.equal(normalizeTracking(null).trainingIncluded,false);
console.log('PASS: 27 Jira tasks, progress denominators, 8-meeting cap, hours separate from meetings, migration defaults, training URL validation.');
