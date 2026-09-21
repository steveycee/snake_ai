const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startBtn = document.getElementById('start');

const gridSize = 20; // 20x20 cells
const tileSize = canvas.width / gridSize;

let snake, dir, food, score, running, lastMoveTime, speed;

function init(){
  snake = [{x: Math.floor(gridSize/2), y: Math.floor(gridSize/2)}];
  dir = {x:0,y:0};
  placeFood();
  score = 0;
  running = false;
  speed = 8; // moves per second
  scoreEl.textContent = 'Score: 0';
}

function placeFood(){
  do{
    food = {x: Math.floor(Math.random()*gridSize), y: Math.floor(Math.random()*gridSize)};
  } while(snake.some(s => s.x === food.x && s.y === food.y));
}

function start(){
  init();
  dir = {x:1,y:0};
  running = true;
  lastMoveTime = 0;
  window.requestAnimationFrame(loop);
}

function loop(timestamp){
  if(!running) return;
  if(!lastMoveTime) lastMoveTime = timestamp;
  const interval = 1000 / speed;
  if(timestamp - lastMoveTime > interval){
    update();
    lastMoveTime = timestamp;
  }
  draw();
  window.requestAnimationFrame(loop);
}

function update(){
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wrap around edges
  if(head.x < 0) head.x = gridSize - 1;
  if(head.x >= gridSize) head.x = 0;
  if(head.y < 0) head.y = gridSize - 1;
  if(head.y >= gridSize) head.y = 0;

  // collision with self
  if(snake.some(s => s.x === head.x && s.y === head.y)){
    running = false;
    setTimeout(()=> alert('Game over! Score: ' + score), 50);
    return;
  }

  snake.unshift(head);

  // eating food
  if(head.x === food.x && head.y === food.y){
    score++;
    scoreEl.textContent = 'Score: ' + score;
    placeFood();
    if(score % 5 === 0) speed += 1; // gradually speed up
  } else {
    snake.pop();
  }
}

function draw(){
  // clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // subtle grid
  ctx.fillStyle = '#0a0a0a';
  for(let x=0;x<gridSize;x++){
    for(let y=0;y<gridSize;y++){
      ctx.fillRect(x*tileSize, y*tileSize, tileSize - 1, tileSize - 1);
    }
  }

  // snake
  snake.forEach((s,i)=>{
    ctx.fillStyle = i===0 ? '#7CFC00' : '#32CD32';
    ctx.fillRect(s.x*tileSize, s.y*tileSize, tileSize - 1, tileSize - 1);
  });

  // food
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(food.x*tileSize, food.y*tileSize, tileSize - 1, tileSize - 1);
}

// controls
window.addEventListener('keydown', e=>{
  const key = e.key;
  if((key === 'ArrowUp' || key === 'w') && dir.y !== 1) dir = {x:0,y:-1};
  if((key === 'ArrowDown' || key === 's') && dir.y !== -1) dir = {x:0,y:1};
  if((key === 'ArrowLeft' || key === 'a') && dir.x !== 1) dir = {x:-1,y:0};
  if((key === 'ArrowRight' || key === 'd') && dir.x !== -1) dir = {x:1,y:0};
});

startBtn.addEventListener('click', start);

// initial draw
init();
draw();