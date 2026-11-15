/* Shared bounded perception and steering for local and authoritative combat. */
(function(root) {
  'use strict';

  const ordinarySpeedMultiplier = 1.12;
  const memorySeconds = 2.2;
  const reactionSeconds = .22;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function seedFor(enemy) {
    const text = String(enemy.id || enemy.phase || enemy.type?.id || enemy.type || 'enemy');
    let value = 0;
    for (let index = 0; index < text.length; index++) value = (value * 31 + text.charCodeAt(index)) >>> 0;
    return value;
  }

  function roleFor(enemy) {
    const name = enemy.type?.id || enemy.type;
    if (['ranger', 'drone'].includes(name)) return 'ranged';
    if (['support', 'support-drone'].includes(name)) return 'support';
    if (['minelayer', 'mine-layer'].includes(name)) return 'area';
    if (['charger', 'dasher', 'bomber'].includes(name)) return 'assault';
    return 'pursuer';
  }

  function solid(obstacle) {
    const physical = obstacle.solid === true || obstacle.solid === undefined && obstacle.hp > 0;
    return physical && !obstacle.done && !obstacle.destroyed && (obstacle.hp === undefined || obstacle.hp > 0);
  }

  function intersects(ax, ay, bx, by, obstacle, padding = 0) {
    if (!solid(obstacle)) return false;
    const dx = bx - ax, dy = by - ay;
    if (!Number.isFinite(obstacle.w) || !Number.isFinite(obstacle.h)) {
      const fraction = clamp(((obstacle.x - ax) * dx + (obstacle.y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      return Math.hypot(ax + dx * fraction - obstacle.x, ay + dy * fraction - obstacle.y) < (obstacle.r || 20) + padding;
    }
    let enter = 0, leave = 1;
    for (const [origin, velocity, lower, upper] of [[ax, dx, obstacle.x - padding, obstacle.x + obstacle.w + padding], [ay, dy, obstacle.y - padding, obstacle.y + obstacle.h + padding]]) {
      if (Math.abs(velocity) < 1e-8) {
        if (origin < lower || origin > upper) return false;
        continue;
      }
      const first = (lower - origin) / velocity, second = (upper - origin) / velocity;
      enter = Math.max(enter, Math.min(first, second));
      leave = Math.min(leave, Math.max(first, second));
      if (enter > leave) return false;
    }
    return true;
  }

  function lineClear(from, to, obstacles = [], padding = 0) {
    return !obstacles.some(obstacle => intersects(from.x, from.y, to.x, to.y, obstacle, padding));
  }

  function waypoint(enemy, destination, obstacles, width, height) {
    const radius = (enemy.r || 14) + 6;
    const obstruction = obstacles.find(obstacle => intersects(enemy.x, enemy.y, destination.x, destination.y, obstacle, radius));
    if (!obstruction) { enemy.nnWaypoint = null; enemy.nnWaypointVisited = null; return destination; }
    const previous = enemy.nnWaypoint;
    if (previous && Math.hypot(previous.x-enemy.x,previous.y-enemy.y)>1.5 && lineClear(enemy,previous,obstacles,radius-2)) return previous;
    if (previous) enemy.nnWaypointVisited = previous;
    const left = obstruction.x - radius - 4 - (obstruction.w === undefined ? obstruction.r || 20 : 0);
    const right = obstruction.x + (obstruction.w === undefined ? obstruction.r || 20 : obstruction.w) + radius + 4;
    const top = obstruction.y - radius - 4 - (obstruction.h === undefined ? obstruction.r || 20 : 0);
    const bottom = obstruction.y + (obstruction.h === undefined ? obstruction.r || 20 : obstruction.h) + radius + 4;
    const candidates = [{x:left,y:top}, {x:right,y:top}, {x:left,y:bottom}, {x:right,y:bottom}];
    let best = null, bestCost = Infinity;
    for (const candidate of candidates) {
      if (enemy.nnWaypointVisited && Math.hypot(candidate.x-enemy.nnWaypointVisited.x,candidate.y-enemy.nnWaypointVisited.y)<5) continue;
      if (candidate.x < radius || candidate.y < radius || candidate.x > width - radius || candidate.y > height - radius) continue;
      if (!lineClear(enemy, candidate, obstacles, radius - 2)) continue;
      const cost = Math.hypot(candidate.x - enemy.x, candidate.y - enemy.y) + Math.hypot(destination.x - candidate.x, destination.y - candidate.y);
      if (cost < bestCost) { best = candidate; bestCost = cost; }
    }
    enemy.nnWaypoint = best;
    return best || {x:enemy.x, y:enemy.y};
  }

  function decide(enemy, context) {
    const now = context.time;
    const previous = enemy.nnTactical;
    if (previous && now < previous.nextDecision) return previous;
    const seed = enemy.nnTacticalSeed ?? (enemy.nnTacticalSeed = seedFor(enemy));
    const role = roleFor(enemy), obstacles = context.obstacles || [];
    const target = context.target;
    const distance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    const visible = context.objective === true || distance <= 980 && lineClear(enemy, target, obstacles, 2);
    const firstSeen = visible ? previous?.visible ? previous.firstSeen : now : -1;
    const seen = visible ? {x:target.x,y:target.y,vx:target.vx || 0,vy:target.vy || 0} : previous?.seen;
    const lastSeenAt = visible ? now : previous?.lastSeenAt ?? -Infinity;
    const remembered = seen && now - lastSeenAt <= memorySeconds;
    const observation = remembered ? seen : {x:enemy.x,y:enemy.y,vx:0,vy:0};
    let state = visible ? 'pursuit' : 'search';
    let destination = {x:observation.x,y:observation.y};
    if (!remembered) {
      const patrolAngle = seed % 360 * Math.PI / 180 + Math.floor(now / 4) % 4 * Math.PI / 2;
      const searchCenter = seen || {x:context.width / 2,y:context.height / 2};
      destination = {x:searchCenter.x + Math.cos(patrolAngle) * 140,y:searchCenter.y + Math.sin(patrolAngle) * 140};
    }
    let vulnerable = false;
    if (visible && now - firstSeen >= reactionSeconds) {
      vulnerable = (target.hp ?? target.hull ?? 10) <= 3 || target.reloading === true;
    }
    const angle = Math.atan2(observation.y - enemy.y, observation.x - enemy.x);
    if (visible && !context.objective && ['ranged', 'area', 'support'].includes(role)) {
      const preferred = role === 'support' ? 260 : role === 'ranged' ? vulnerable ? 155 : (enemy.nnPreferredRange || 210) : 155;
      if (distance < preferred - 30) {
        destination = {x:enemy.x - Math.cos(angle) * 100,y:enemy.y - Math.sin(angle) * 100};
        state = 'retreat';
      } else if (distance < preferred + 40) {
        const side = seed % 2 ? 1 : -1;
        destination = {x:enemy.x + Math.cos(angle + side * Math.PI / 2) * 75,y:enemy.y + Math.sin(angle + side * Math.PI / 2) * 75};
        state = vulnerable ? 'pressure' : 'strafe';
      }
    }
    if (visible && role === 'pursuer' && !vulnerable && !context.objective && distance > 140 && distance < 550 && seed % 3 === 0) {
      const side = seed % 2 ? 1 : -1;
      destination.x += Math.cos(angle + Math.PI / 2) * side * 95;
      destination.y += Math.sin(angle + Math.PI / 2) * side * 95;
      state = 'flank';
    }
    if (role === 'support') {
      let injured = null, ratio = 1;
      for (const ally of context.allies || []) {
        if (ally === enemy || ally.dead || ally.boss || ally.type?.id === 'signal-core') continue;
        const health = ally.hp / (ally.max || 1);
        if (health < ratio && Math.hypot(ally.x-enemy.x,ally.y-enemy.y) < 340 && lineClear(enemy,ally,obstacles,2)) { injured=ally;ratio=health; }
      }
      if (injured) { destination={x:injured.x-35,y:injured.y-30};state='support'; }
    }
    destination.x = clamp(destination.x, (enemy.r || 14) + 8, context.width - (enemy.r || 14) - 8);
    destination.y = clamp(destination.y, (enemy.r || 14) + 8, context.height - (enemy.r || 14) - 8);
    const steering = waypoint(enemy,destination,obstacles,context.width,context.height);
    const plan = {state, role, visible, seen, firstSeen, lastSeenAt, target:observation, steering,
      canAttack:visible && now-firstSeen >= reactionSeconds,
      vulnerable, nextDecision:now + .22 + (seed % 7) * .017};
    enemy.nnTactical = plan;
    return plan;
  }

  function allowMajor(enemy, allies, zones = []) {
    const others = allies.filter(ally => ally !== enemy && !ally.dead && (ally.warning > 0 || ally.aimWarning || ally.chargeWarned || ally.chargeLeft > 0 || ally.dash > 0 || ally.bombFuse > 0 || ally.bossWarning));
    const ownerZones = new Set(zones.filter(zone => zone.left > 0 && ['blast','charge','lane','shockwave'].includes(zone.kind)).map(zone => zone.owner));
    for (const ally of others) ownerZones.add(ally.id || ally);
    ownerZones.delete(enemy.id || enemy);
    return ownerZones.size < 3;
  }

  const api = {ordinarySpeedMultiplier, memorySeconds, reactionSeconds, roleFor, lineClear, waypoint, decide, allowMajor};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonTacticalAI = api;
})(typeof window === 'object' ? window : globalThis);
