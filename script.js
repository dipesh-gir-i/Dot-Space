var Spacedots = new function(){
  var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') != -1) || (navigator.userAgent.toLowerCase().indexOf('iphone') != -1);
  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;
  var canvas;
  var context;
  var status;
  var message;
  var title;
  var startButton;
  var enemies = [];
  var boosts = [];
  var particles = [];
  var player;
  var mouseX = (window.innerWidth - SCREEN_WIDTH);
  var mouseY = (window.innerHeight - SCREEN_HEIGHT);
  var mouseIsDown = false;
  var playing = false;
  var score = 0;
  var time = 0;
  var velocity = { x: -1.5, y: 1 };
  var difficulty = 1;

  this.init = function(){
    canvas = document.getElementById('world');
    status = document.getElementById('status');
    message = document.getElementById('message');
    title = document.getElementById('title');
    startButton = document.getElementById('startButton');

    if (canvas && canvas.getContext) {
      context = canvas.getContext('2d');
      document.addEventListener('mousemove', documentMouseMoveHandler, false);
      document.addEventListener('mousedown', documentMouseDownHandler, false);
      document.addEventListener('mouseup', documentMouseUpHandler, false);
      canvas.addEventListener('touchstart', documentTouchStartHandler, false);
      document.addEventListener('touchmove', documentTouchMoveHandler, false);
      document.addEventListener('touchend', documentTouchEndHandler, false);
      window.addEventListener('resize', windowResizeHandler, false);
      startButton.addEventListener('click', startButtonClickHandler, false);
      player = new Player();
      windowResizeHandler();
      setInterval(loop, 1000 / 70);
    }
  };

  function startButtonClickHandler(event){
    event.preventDefault();
    if (playing == false) {
      playing = true;
      enemies = [];
      boosts = [];
      score = 0;
      difficulty = 1;
      player.trail = [];
      player.position.x = mouseX;
      player.position.y = mouseY;
      player.boost = 0;
      message.style.display = 'none';
      status.style.display = 'block';
      time = new Date().getTime();
    }
  }

  function gameOver() {
    playing = false;
    message.style.display = 'block';
    title.innerHTML = 'Game Over! (' + Math.round(score) + ' points)';
  }

  function documentMouseMoveHandler(event){
    mouseX = event.clientX - (window.innerWidth - SCREEN_WIDTH) * .5 - 10;
    mouseY = event.clientY - (window.innerHeight - SCREEN_HEIGHT) * .5 - 10;
  }

  function documentMouseDownHandler(){ mouseIsDown = true; }
  function documentMouseUpHandler(){ mouseIsDown = false; }

  function documentTouchStartHandler(event) {
    if(event.touches.length == 1) {
      event.preventDefault();
      mouseX = event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * .5;
      mouseY = event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * .5;
      mouseIsDown = true;
    }
  }

  function documentTouchMoveHandler(event) {
    if(event.touches.length == 1) {
      event.preventDefault();
      mouseX = event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * .5;
      mouseY = event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * .5;
    }
  }

  function documentTouchEndHandler(){ mouseIsDown = false; }

  function windowResizeHandler() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    var cvx = (window.innerWidth - SCREEN_WIDTH) * .5;
    var cvy = (window.innerHeight - SCREEN_HEIGHT) * .5;
    canvas.style.position = 'absolute';
    canvas.style.left = cvx + 'px';
    canvas.style.top = cvy + 'px';
    message.style.left = cvx + 'px';
    message.style.top = cvy + 200 + 'px';
  }

  function createParticles(position, spread, color) {
    var q = 10 + (Math.random() * 15);
    while(--q >= 0) {
      var p = new Particle();
      p.position.x = position.x + (Math.sin(q) * spread);
      p.position.y = position.y + (Math.cos(q) * spread);
      p.velocity = { x: -4 + Math.random() * 8, y: -4 + Math.random() * 8 };
      p.alpha = 1;
      particles.push(p);
    }
  }

  function loop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    var svelocity = { x: velocity.x * difficulty, y: velocity.y * difficulty };
    var i, j, ilen;

    if(playing) {
      difficulty += 0.0008;
      var previousPosition = player.clonePosition();
      player.position.x += (mouseX - player.position.x) * 0.13;
      player.position.y += (mouseY - player.position.y) * 0.13;
      score += 0.4 * difficulty;
      score += player.distanceTo(previousPosition) * 0.1;
      player.boost = Math.max(player.boost - 1, 0);

      if(player.boost > 0 && (player.boost > 100 || player.boost % 3 != 0)) {
        context.beginPath();
        context.fillStyle = '#167a66';
        context.strokeStyle = 'yellow';
        context.arc(player.position.x, player.position.y, player.size * 2, 0, Math.PI * 2, true);
        context.fill();
        context.stroke();
      }

      player.trail.push(new Point(player.position.x, player.position.y));
      context.beginPath();
      context.strokeStyle = 'gold';
      context.lineWidth = 2;
      for(i = 0, ilen = player.trail.length; i < ilen; i++) {
        var trailPoint = player.trail[i];
        context.lineTo(trailPoint.position.x, trailPoint.position.y);
        trailPoint.position.x += svelocity.x;
        trailPoint.position.y += svelocity.y;
      }
      context.stroke();
      context.closePath();
      if(player.trail.length > 60) player.trail.shift();
      context.beginPath();
      context.fillStyle = 'orange';
      context.arc(player.position.x, player.position.y, player.size / 2, 0, Math.PI * 2, true);
      context.fill();
    }

    if(playing && (player.position.x < 0 || player.position.x > SCREEN_WIDTH || player.position.y < 0 || player.position.y > SCREEN_HEIGHT)) gameOver();

    for(i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if(playing) {
        if(player.boost > 0 && enemy.distanceTo(player.position) < ((player.size * 4) + enemy.size) * 0.5) {
          createParticles(enemy.position, 10);
          enemies.splice(i, 1);
          i--;
          score += 10;
          continue;
        } else if(enemy.distanceTo(player.position) < (player.size + enemy.size) * 0.5) {
          createParticles(player.position, 10);
          gameOver();
        }
      }
      context.beginPath();
      context.fillStyle = 'red';
      context.arc(enemy.position.x, enemy.position.y, enemy.size / 2, 0, Math.PI * 2, true);
      context.fill();
      enemy.position.x += svelocity.x * enemy.force;
      enemy.position.y += svelocity.y * enemy.force;
      if(enemy.position.x < 0 || enemy.position.y > SCREEN_HEIGHT) {
        enemies.splice(i, 1);
        i--;
      }
    }

    for(i = 0; i < boosts.length; i++) {
      var boost = boosts[i];
      if(boost.distanceTo(player.position) < (player.size + boost.size) * 0.5 && playing) {
        player.boost = 300;
        for(j = 0; j < enemies.length; j++) {
          var nearbyEnemy = enemies[j];
          if(nearbyEnemy.distanceTo(boost.position) < 100) {
            createParticles(nearbyEnemy.position, 10);
            enemies.splice(j, 1);
            j--;
            score += 10;
          }
        }
      }
      context.beginPath();
      context.fillStyle = '#00ffcc';
      context.arc(boost.position.x, boost.position.y, boost.size / 2, 0, Math.PI * 2, true);
      context.fill();
      boost.position.x += svelocity.x * boost.force;
      boost.position.y += svelocity.y * boost.force;
      if(boost.position.x < 0 || boost.position.y > SCREEN_HEIGHT || player.boost != 0) {
        boosts.splice(i, 1);
        i--;
      }
    }

    if(enemies.length < 25 * difficulty) enemies.push(positionNewOrganism(new Enemy()));
    if(boosts.length < 1 && Math.random() > 0.997 && player.boost == 0) boosts.push(positionNewOrganism(new Boost()));

    for(i = 0; i < particles.length; i++) {
      var particle = particles[i];
      particle.velocity.x += (svelocity.x - particle.velocity.x) * 0.04;
      particle.velocity.y += (svelocity.y - particle.velocity.y) * 0.04;
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.alpha -= 0.02;
      context.fillStyle = 'rgba(255, 0, 0, ' + Math.max(particle.alpha, 0) + ')';
      context.fillRect(particle.position.x, particle.position.y, 1, 1);
      if(particle.alpha <= 0) {
        particles.splice(i, 1);
        i--;
      }
    }

    if(playing) {
      var scoreText = 'Score: <span>' + Math.round(score) + '</span>';
      scoreText += ' Time: <span>' + Math.round(((new Date().getTime() - time) / 1000) * 100) / 100 + 's</span>';
      status.innerHTML = scoreText;
    }
  }

  function positionNewOrganism(organism) {
    if(Math.random() > 0.5) {
      organism.position.x = Math.random() * SCREEN_WIDTH;
      organism.position.y = -20;
    } else {
      organism.position.x = SCREEN_WIDTH + 60;
      organism.position.y = (-SCREEN_HEIGHT * 0.2) + (Math.random() * SCREEN_HEIGHT * 1.2);
    }
    return organism;
  }
};

function Point(x, y) { this.position = { x: x, y: y }; }
Point.prototype.distanceTo = function(point) {
  var dx = point.x - this.position.x;
  var dy = point.y - this.position.y;
  return Math.sqrt(dx * dx + dy * dy);
};
Point.prototype.clonePosition = function() { return { x: this.position.x, y: this.position.y }; };

function Player() { this.position = { x: 0, y: 0 }; this.trail = []; this.size = 8; this.boost = 0; }
Player.prototype = new Point();
function Enemy() { this.position = { x: 0, y: 0 }; this.size = 6 + (Math.random() * 4); this.force = 1 + (Math.random() * 0.4); }
Enemy.prototype = new Point();
function Boost() { this.position = { x: 0, y: 0 }; this.size = 10 + (Math.random() * 8); this.force = 1 + (Math.random() * 0.4); }
Boost.prototype = new Point();
function Particle() { this.position = { x: 0, y: 0 }; this.force = 1 + (Math.random() * 0.4); this.color = '#ff0000'; }
Particle.prototype = new Point();

Spacedots.init();