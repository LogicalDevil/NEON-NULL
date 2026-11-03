'use strict';
const assert = require('node:assert/strict');
const Audio = require('./immersion-audio.js');

class Param {
  constructor() { this.value = 0; this.events = []; }
  cancelScheduledValues(time) { this.events.push(['cancel', time]); }
  setValueAtTime(value, time) { assert(Number.isFinite(value) && Number.isFinite(time)); this.value = value; this.events.push(['set', value, time]); }
  setTargetAtTime(value, time, speed) { assert(value >= 0 && Number.isFinite(value) && speed > 0); this.value = value; this.events.push(['target', value, time, speed]); }
  linearRampToValueAtTime(value, time) { this.setValueAtTime(value, time); }
  exponentialRampToValueAtTime(value, time) { assert(value > 0); this.setValueAtTime(value, time); }
}
class Node {
  constructor(ac, kind) { this.ac = ac; this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.disconnected = false; }
  connect() {}
  disconnect() { this.disconnected = true; }
  start(time) { assert(time >= this.ac.currentTime - .001); this.startTime = time; }
  stop(time) { this.stopTime = time == null ? this.ac.currentTime : time; }
}
const ac = {
  currentTime: 0, sampleRate: 8000, state: 'running', nodes: [],
  createGain() { const node = new Node(this, 'gain'); this.nodes.push(node); return node; },
  createOscillator() { const node = new Node(this, 'oscillator'); this.nodes.push(node); return node; },
  createBufferSource() { const node = new Node(this, 'buffer'); this.nodes.push(node); return node; },
  createBiquadFilter() { const node = new Node(this, 'filter'); this.nodes.push(node); return node; },
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
};
let callback, intervals = 0, clears = 0;
let state = { active: false }, theme = { transpose: 0, rotation: 0, wave: 'triangle' };
const destination = ac.createGain();
const score = Audio.create({context: ac, destination, getState: () => state, getTheme: () => theme,
  setInterval: fn => { callback = fn; intervals++; return 3; },
  clearInterval: id => { assert.equal(id, 3); clears++; callback = null; }
});
function advance(seconds) {
  for (let t = 0; t < seconds; t += .025) {
    ac.currentTime += .025;
    for (const node of ac.nodes) if (!node.ended && node.stopTime != null && node.stopTime <= ac.currentTime) {
      node.ended = true; if (node.onended) node.onended();
    }
    if (callback) callback();
    assert(score.stats().voices <= 48);
  }
}
score.start(); score.start();
assert.equal(intervals, 1, 'Starting twice must keep one scheduler.');
advance(3);
assert.equal(score.stats().mode, 'menu');
state = { active: true, enemies: 6, operation: 'relay' };
advance(4);
assert.equal(score.stats().mode, 'combat');
state.enemies = 20; advance(4); assert.equal(score.stats().mode, 'pressure');
state.boss = true; advance(.1); assert.equal(score.stats().mode, 'boss');
state.paused = true;
const pausedStep = score.stats().step;
advance(3);
assert.equal(score.stats().step, pausedStep, 'Pause must freeze the musical position.');
state.paused = false; advance(.6); assert.notEqual(score.stats().step, pausedStep);
const beforeSuspension = score.stats().scheduledNotes;
ac.state = 'suspended'; advance(15);
assert.equal(score.stats().scheduledNotes, beforeSuspension);
ac.state = 'running'; advance(.1);
assert(score.stats().scheduledNotes - beforeSuspension < 20, 'Resume must not schedule a backlog.');
ac.currentTime += 60; const beforeGap = score.stats().scheduledNotes;
callback(); assert(score.stats().scheduledNotes - beforeGap < 20);
theme = {transpose: 999, wave: 'invalid', rotation: -200};
state = {active: true, operation: 'archive', enemies: 0, powered: true};
advance(5); assert.equal(score.stats().operation, 'archive');
assert.equal(intervals, 1, 'Cosmetics and operation changes must retain one timeline.');
state = {active: false, status: 'results'}; advance(4);
assert.equal(score.stats().mode, 'menu');
assert.equal(score.stats().lastFault, '');
score.stop(); assert.equal(clears, 1); assert.equal(score.stats().voices, 0);
score.start(); assert.equal(intervals, 2);
score.destroy(); score.destroy(); assert.equal(clears, 2);
assert.equal(score.stats().running, false); assert.equal(score.stats().voices, 0);
score.start(); assert.equal(intervals, 2, 'Destroyed controller cannot restart.');
assert(ac.nodes.filter(n => n.kind !== 'gain').every(n => n.disconnected), 'Every scheduled voice must disconnect.');
console.log('Immersion audio: single scheduler, layered modes, cosmetic changes, pause, suspension, long gaps, voice cap and cleanup passed.');
