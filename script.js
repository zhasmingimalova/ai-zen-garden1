"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const statusEl = document.querySelector("#status");
const soundButton = document.querySelector("#sound-button");

const COLS = 10, ROWS = 15, CELL = 60;
let snake, food, direction, nextDirection, score, speed, timer, running = false, paused = false;
let best = Number(localStorage.getItem("rainbowSnakeBest") || 0);
let soundOn = false, audio;
bestEl.textContent = best;

function resetGame() {
  snake = [{ x: 5, y: 12 }, { x: 4, y: 12 }, { x: 3, y: 12 }, { x: 2, y: 12 }];
  direction = { x: 1, y: 0 }; nextDirection = direction;
  score = 0; speed = 165; food = placeFood();
  scoreEl.textContent = score; statusEl.textContent = "Score apples to go faster";
  draw();
}
function placeFood() {
  const free = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
  return free[Math.floor(Math.random() * free.length)];
}
function startGame() {
  clearInterval(timer); resetGame(); running = true; paused = false; overlay.classList.add("hidden"); pauseButton.textContent = "Pause"; timer = setInterval(step, speed);
}
function setDirection(name) {
  const moves = { up: {x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
  const candidate = moves[name];
  if (!candidate || (candidate.x === -direction.x && candidate.y === -direction.y)) return;
  nextDirection = candidate;
}
function step() {
  if (!running || paused) return;
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = head.x === food.x && head.y === food.y;
  const bodyToCheck = eating ? snake : snake.slice(0, -1);
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || bodyToCheck.some(s => s.x === head.x && s.y === head.y)) return endGame();
  snake.unshift(head);
  if (eating) { score++; scoreEl.textContent = score; food = placeFood(); beep(620, .08); if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem("rainbowSnakeBest", best); } const newSpeed = Math.max(72, 165 - Math.floor(score / 4) * 12); if (newSpeed !== speed) { speed = newSpeed; clearInterval(timer); timer = setInterval(step, speed); } }
  else snake.pop();
  draw();
}
function endGame() { running = false; clearInterval(timer); beep(120, .25); statusEl.textContent = `Game over — ${score} apple${score === 1 ? "" : "s"} eaten`;
  document.querySelector(".card h1").textContent = "Game over!"; document.querySelector(".card p").textContent = `You collected ${score} apple${score === 1 ? "" : "s"}. Can you beat ${best}?`; startButton.textContent = "Play again"; overlay.classList.remove("hidden"); }
function togglePause() { if (!running) return; paused = !paused; pauseButton.textContent = paused ? "Resume" : "Pause"; statusEl.textContent = paused ? "Paused" : "Score apples to go faster"; draw(); }
function roundedRect(x,y,w,h,r) { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
function draw() {
  // Checkerboard field
  for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) { ctx.fillStyle = (x+y)%2 ? "#a6d949" : "#addd4c"; ctx.fillRect(x*CELL,y*CELL,CELL,CELL); }
  drawApple(food.x * CELL + CELL/2, food.y * CELL + CELL/2);
  // Segments overlap slightly so the rainbow reads as one smooth snake.
  snake.slice().reverse().forEach((part, index) => drawSegment(part, snake.length - 1 - index));
  drawFace(snake[0]);
  if (paused) { ctx.fillStyle = "rgba(51, 107, 30, .55)"; ctx.fillRect(0,0,600,900); ctx.fillStyle = "white"; ctx.font = "bold 46px Arial"; ctx.textAlign = "center"; ctx.fillText("PAUSED", 300, 450); }
}
function drawSegment(part, index) {
  const x=part.x*CELL, y=part.y*CELL, hue=(205 + index*18)%360;
  const gradient=ctx.createLinearGradient(x,y,x+CELL,y+CELL); gradient.addColorStop(0,`hsl(${hue} 64% 53%)`); gradient.addColorStop(.5,`hsl(${(hue+55)%360} 74% 55%)`); gradient.addColorStop(1,`hsl(${(hue+110)%360} 74% 53%)`);
  ctx.save(); ctx.shadowColor="rgba(47,103,39,.36)"; ctx.shadowBlur=7; ctx.shadowOffsetY=4; roundedRect(x+2,y+2,CELL-4,CELL-4,23); ctx.fillStyle=gradient; ctx.fill(); ctx.restore();
}
function drawFace(head) {
  const x=head.x*CELL, y=head.y*CELL; let px=0,py=0; if(direction.x) py=9; else px=9;
  const positions = direction.x ? [[x+40,y+16],[x+40,y+44]] : [[x+16,y+25],[x+44,y+25]];
  positions.forEach(([ex,ey]) => { ctx.fillStyle="white"; ctx.beginPath(); ctx.ellipse(ex,ey,12,14,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#254bba"; ctx.beginPath(); ctx.arc(ex+(direction.x? direction.x*3:0),ey+(direction.y? direction.y*3:0),5,0,Math.PI*2); ctx.fill(); });
}
function drawApple(cx,cy) { ctx.save(); ctx.shadowColor="rgba(47,94,27,.45)"; ctx.shadowBlur=5; ctx.shadowOffsetY=4; ctx.fillStyle="#f1451e"; ctx.beginPath(); ctx.arc(cx,cy+5,18,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#ff8a69"; ctx.beginPath(); ctx.arc(cx-7,cy-3,5,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#765326"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx,cy-12); ctx.quadraticCurveTo(cx+1,cy-25,cx+8,cy-26); ctx.stroke(); ctx.fillStyle="#4fc52b"; ctx.beginPath(); ctx.ellipse(cx+9,cy-22,9,4,-.45,0,Math.PI*2); ctx.fill(); ctx.restore(); }
function beep(freq,duration) { if (!soundOn) return; audio ||= new AudioContext(); const osc=audio.createOscillator(), gain=audio.createGain(); osc.frequency.value=freq; gain.gain.setValueAtTime(.08,audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime+duration); }
document.addEventListener("keydown", e => { const key={ArrowUp:"up",w:"up",W:"up",ArrowDown:"down",s:"down",S:"down",ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"}[e.key]; if(key){e.preventDefault();setDirection(key);} if(e.code==="Space"){e.preventDefault();togglePause();} });
document.querySelectorAll("[data-direction]").forEach(btn => btn.addEventListener("click", () => setDirection(btn.dataset.direction)));
startButton.addEventListener("click", startGame); pauseButton.addEventListener("click", togglePause);
soundButton.addEventListener("click", () => { soundOn=!soundOn; soundButton.textContent=soundOn?"🔊":"🔇"; soundButton.setAttribute("aria-label", soundOn?"Turn sound off":"Turn sound on"); if(soundOn) beep(480,.06); });
let touchStart; canvas.addEventListener("pointerdown",e=>touchStart={x:e.clientX,y:e.clientY}); canvas.addEventListener("pointerup",e=>{if(!touchStart)return; const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>22)setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"));touchStart=null;});
resetGame();
