// 勇者斗恶龙横版游戏
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 游戏状态
        this.gameState = 'playing'; // playing, gameOver, levelComplete
        this.currentLevelIndex = 0;
        this.camera = { x: 0, y: 0 };
        
        // 输入系统
        this.keys = {};
        this.setupInput();
        
        // 初始化游戏
        this.initGame();
        this.gameLoop();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    initGame() {
        // 创建玩家
        this.player = new Player(100, 400);
        
        // 创建粒子系统
        this.particles = [];
        
        // 加载当前关卡
        this.loadLevel(this.currentLevelIndex);
        
        // 更新UI
        this.updateUI();
    }
    
    loadLevel(levelIndex) {
        const levelData = LEVELS[levelIndex];
        this.currentLevel = levelData;
        this.monsters = [];
        
        // 创建怪物
        levelData.monsters.forEach(monsterData => {
            const monster = new Monster(
                monsterData.x, 
                monsterData.y, 
                monsterData.type,
                monsterData.level || 1
            );
            this.monsters.push(monster);
        });
        
        // 重置相机
        this.camera.x = 0;
        this.camera.y = 0;
        
        console.log(`加载关卡 ${levelIndex + 1}: ${levelData.name}`);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 更新玩家
        this.player.update(this.keys, this);
        
        // 更新怪物
        this.monsters.forEach(monster => {
            monster.update(this.player, this);
        });
        
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
        
        // 更新相机
        this.updateCamera();
        
        // 检查游戏状态
        this.checkGameState();
        
        // 更新UI
        this.updateUI();
    }
    
    updateCamera() {
        // 相机跟随玩家
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // 限制相机边界
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.currentLevel.width - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.currentLevel.height - this.height));
    }
    
    checkGameState() {
        // 检查玩家是否死亡
        if (this.player.hp <= 0) {
            this.gameState = 'gameOver';
            document.getElementById('gameOver').style.display = 'block';
            return;
        }
        
        // 检查是否完成关卡
        if (this.monsters.length === 0) {
            this.gameState = 'levelComplete';
            document.getElementById('levelComplete').style.display = 'block';
            
            // 给予奖励
            this.player.gainExp(this.currentLevel.expReward);
            this.player.gold += this.currentLevel.goldReward;
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 保存画布状态
        this.ctx.save();
        
        // 应用相机变换
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 绘制背景
        this.renderBackground();
        
        // 绘制地形
        this.renderTerrain();
        
        // 绘制怪物
        this.monsters.forEach(monster => monster.render(this.ctx));
        
        // 绘制玩家
        this.player.render(this.ctx);
        
        // 绘制粒子效果
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // 恢复画布状态
        this.ctx.restore();
        
        // 绘制UI（不受相机影响）
        this.renderUI();
    }
    
    renderBackground() {
        const level = this.currentLevel;
        
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, level.height);
        gradient.addColorStop(0, level.skyColor);
        gradient.addColorStop(0.7, level.groundColor);
        gradient.addColorStop(1, '#654321');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, level.width, level.height);
        
        // 绘制云朵（简单装饰）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 + 100) % level.width;
            const y = 50 + Math.sin(Date.now() * 0.001 + i) * 10;
            this.drawCloud(x, y);
        }
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderTerrain() {
        const level = this.currentLevel;
        
        // 绘制地面
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, level.groundLevel, level.width, level.height - level.groundLevel);
        
        // 绘制草地
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, level.groundLevel - 10, level.width, 10);
        
        // 绘制平台
        level.platforms.forEach(platform => {
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 平台上的草
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(platform.x, platform.y - 5, platform.width, 5);
        });
    }
    
    renderUI() {
        // UI已在HTML中定义，这里可以添加额外的游戏内UI元素
    }
    
    updateUI() {
        document.getElementById('playerLevel').textContent = this.player.level;
        document.getElementById('currentHp').textContent = Math.max(0, Math.floor(this.player.hp));
        document.getElementById('maxHp').textContent = this.player.maxHp;
        document.getElementById('currentExp').textContent = this.player.exp;
        document.getElementById('maxExp').textContent = this.player.expToNext;
        document.getElementById('gold').textContent = this.player.gold;
        document.getElementById('currentLevel').textContent = this.currentLevelIndex + 1;
        document.getElementById('monstersLeft').textContent = this.monsters.length;
        
        // 更新血条
        const healthPercent = Math.max(0, this.player.hp / this.player.maxHp * 100);
        document.getElementById('healthFill').style.width = healthPercent + '%';
        
        // 更新经验条
        const expPercent = this.player.exp / this.player.expToNext * 100;
        document.getElementById('expFill').style.width = expPercent + '%';
    }
    
    addParticle(x, y, type) {
        this.particles.push(new Particle(x, y, type));
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 玩家类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.onGround = false;
        
        // 战斗属性
        this.level = 1;
        this.hp = 100;
        this.maxHp = 100;
        this.attack = 20;
        this.defense = 5;
        this.exp = 0;
        this.expToNext = 100;
        this.gold = 0;
        
        // 动画
        this.facing = 1; // 1为右，-1为左
        this.animFrame = 0;
        this.animTimer = 0;
        
        // 攻击
        this.attackCooldown = 0;
        this.attackRange = 50;
        
        // 技能
        this.skillCooldown = 0;
        this.skillRange = 100;
    }
    
    update(keys, game) {
        // 移动控制
        this.vx = 0;
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.vx = -this.speed;
            this.facing = -1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.vx = this.speed;
            this.facing = 1;
        }
        
        // 跳跃
        if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && this.onGround) {
            this.vy = -this.jumpPower;
            this.onGround = false;
        }
        
        // 攻击
        if (keys['Space'] && this.attackCooldown <= 0) {
            this.attack(game);
            this.attackCooldown = 30;
        }
        
        // 技能攻击
        if (keys['KeyE'] && this.skillCooldown <= 0) {
            this.useSkill(game);
            this.skillCooldown = 120;
        }
        
        // 物理更新
        this.vy += 0.5; // 重力
        this.x += this.vx;
        this.y += this.vy;
        
        // 碰撞检测
        this.checkCollisions(game);
        
        // 更新冷却时间
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.skillCooldown > 0) this.skillCooldown--;
        
        // 动画更新
        this.updateAnimation();
    }
    
    checkCollisions(game) {
        const level = game.currentLevel;
        
        // 地面碰撞
        if (this.y + this.height >= level.groundLevel) {
            this.y = level.groundLevel - this.height;
            this.vy = 0;
            this.onGround = true;
        }
        
        // 平台碰撞
        level.platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // 从上方落到平台上
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        });
        
        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > level.width) this.x = level.width - this.width;
        if (this.y > level.height) {
            this.takeDamage(20); // 掉出地图受伤
            this.y = level.groundLevel - this.height;
            this.vy = 0;
        }
    }
    
    attack(game) {
        // 近战攻击
        const attackX = this.x + (this.facing > 0 ? this.width : -this.attackRange);
        const attackY = this.y;
        
        game.monsters.forEach((monster, index) => {
            const distance = Math.sqrt(
                Math.pow(monster.x - attackX, 2) + 
                Math.pow(monster.y - attackY, 2)
            );
            
            if (distance < this.attackRange) {
                const damage = this.attack + Math.random() * 10;
                monster.takeDamage(damage);
                
                // 添加伤害粒子效果
                game.addParticle(monster.x + monster.width/2, monster.y, 'damage');
                
                if (monster.hp <= 0) {
                    // 怪物死亡，给予奖励
                    this.gainExp(monster.expReward);
                    this.gold += monster.goldReward;
                    game.monsters.splice(index, 1);
                    
                    // 添加死亡效果
                    game.addParticle(monster.x + monster.width/2, monster.y + monster.height/2, 'explosion');
                }
            }
        });
    }
    
    useSkill(game) {
        // 范围技能攻击
        game.monsters.forEach((monster, index) => {
            const distance = Math.sqrt(
                Math.pow(monster.x - this.x, 2) + 
                Math.pow(monster.y - this.y, 2)
            );
            
            if (distance < this.skillRange) {
                const damage = this.attack * 1.5 + Math.random() * 15;
                monster.takeDamage(damage);
                
                // 添加技能效果
                game.addParticle(monster.x + monster.width/2, monster.y, 'magic');
                
                if (monster.hp <= 0) {
                    this.gainExp(monster.expReward);
                    this.gold += monster.goldReward;
                    game.monsters.splice(index, 1);
                    
                    game.addParticle(monster.x + monster.width/2, monster.y + monster.height/2, 'explosion');
                }
            }
        });
        
        // 技能范围视觉效果
        game.addParticle(this.x + this.width/2, this.y + this.height/2, 'skillAura');
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.hp -= actualDamage;
        if (this.hp < 0) this.hp = 0;
    }
    
    gainExp(exp) {
        this.exp += exp;
        
        // 检查升级
        while (this.exp >= this.expToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.exp -= this.expToNext;
        this.expToNext = Math.floor(this.expToNext * 1.5);
        
        // 提升属性
        const oldMaxHp = this.maxHp;
        this.maxHp += 20;
        this.attack += 5;
        this.defense += 2;
        
        // 恢复血量
        this.hp += (this.maxHp - oldMaxHp);
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        
        console.log(`升级到 ${this.level} 级！`);
    }
    
    updateAnimation() {
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 翻转精灵（面向方向）
        if (this.facing < 0) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        // 绘制玩家（简单矩形，可以替换为精灵图）
        ctx.fillStyle = '#4169E1'; // 蓝色勇者
        ctx.fillRect(0, this.y, this.width, this.height);
        
        // 绘制头部
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(5, this.y, 20, 15);
        
        // 绘制武器
        if (this.attackCooldown > 20) {
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(this.facing > 0 ? 25 : -10, this.y + 10, 15, 3);
        }
        
        // 绘制技能充能指示
        if (this.skillCooldown <= 0) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(-5, this.y - 5, this.width + 10, 5);
        }
        
        ctx.restore();
    }
}

// 怪物类
class Monster {
    constructor(x, y, type, level = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        
        // 根据类型设置属性
        this.setupByType();
        
        // 物理属性
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = -1;
        
        // AI属性
        this.aiTimer = 0;
        this.aiState = 'patrol'; // patrol, chase, attack
        this.attackCooldown = 0;
        this.patrolDistance = 100;
        this.originalX = x;
        
        // 动画
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    setupByType() {
        const types = {
            slime: {
                width: 25, height: 25, speed: 1, hp: 30, attack: 8, 
                color: '#32CD32', expReward: 10, goldReward: 2
            },
            goblin: {
                width: 30, height: 35, speed: 2, hp: 50, attack: 12, 
                color: '#8B4513', expReward: 15, goldReward: 5
            },
            orc: {
                width: 35, height: 45, speed: 1.5, hp: 80, attack: 18, 
                color: '#556B2F', expReward: 25, goldReward: 8
            },
            skeleton: {
                width: 28, height: 40, speed: 2.5, hp: 60, attack: 15, 
                color: '#F5F5DC', expReward: 20, goldReward: 6
            },
            dragon: {
                width: 60, height: 50, speed: 1, hp: 200, attack: 35, 
                color: '#DC143C', expReward: 100, goldReward: 50
            }
        };
        
        const typeData = types[this.type] || types.slime;
        
        Object.assign(this, typeData);
        
        // 根据等级调整属性
        this.hp *= this.level;
        this.maxHp = this.hp;
        this.attack = Math.floor(this.attack * (1 + (this.level - 1) * 0.3));
        this.expReward = Math.floor(this.expReward * this.level);
        this.goldReward = Math.floor(this.goldReward * this.level);
    }
    
    update(player, game) {
        // AI行为
        this.updateAI(player, game);
        
        // 物理更新
        this.vy += 0.4; // 重力
        this.x += this.vx;
        this.y += this.vy;
        
        // 碰撞检测
        this.checkCollisions(game);
        
        // 更新冷却时间
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // 动画更新
        this.updateAnimation();
    }
    
    updateAI(player, game) {
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) + 
            Math.pow(player.y - this.y, 2)
        );
        
        this.aiTimer++;
        
        // 状态转换
        if (distanceToPlayer < 200 && this.aiState === 'patrol') {
            this.aiState = 'chase';
        } else if (distanceToPlayer > 300 && this.aiState === 'chase') {
            this.aiState = 'patrol';
        } else if (distanceToPlayer < 40 && this.aiState === 'chase') {
            this.aiState = 'attack';
        } else if (distanceToPlayer > 60 && this.aiState === 'attack') {
            this.aiState = 'chase';
        }
        
        // 执行AI行为
        switch (this.aiState) {
            case 'patrol':
                this.patrol();
                break;
            case 'chase':
                this.chasePlayer(player);
                break;
            case 'attack':
                this.attackPlayer(player, game);
                break;
        }
    }
    
    patrol() {
        if (this.aiTimer % 120 === 0) {
            // 每2秒改变方向
            this.facing = Math.random() > 0.5 ? 1 : -1;
        }
        
        // 在原位置附近巡逻
        const distanceFromOrigin = Math.abs(this.x - this.originalX);
        if (distanceFromOrigin > this.patrolDistance) {
            this.facing = this.x > this.originalX ? -1 : 1;
        }
        
        this.vx = this.facing * this.speed * 0.5;
    }
    
    chasePlayer(player) {
        // 追击玩家
        if (player.x > this.x + this.width/2) {
            this.facing = 1;
            this.vx = this.speed;
        } else if (player.x < this.x + this.width/2) {
            this.facing = -1;
            this.vx = -this.speed;
        } else {
            this.vx = 0;
        }
        
        // 跳跃追击（如果玩家在上方）
        if (player.y < this.y - 50 && this.onGround && Math.random() > 0.95) {
            this.vy = -8;
            this.onGround = false;
        }
    }
    
    attackPlayer(player, game) {
        this.vx = 0; // 攻击时停止移动
        
        if (this.attackCooldown <= 0) {
            // 攻击玩家
            const distance = Math.sqrt(
                Math.pow(player.x - this.x, 2) + 
                Math.pow(player.y - this.y, 2)
            );
            
            if (distance < 50) {
                player.takeDamage(this.attack);
                this.attackCooldown = 60; // 1秒攻击冷却
                
                // 添加攻击效果
                game.addParticle(player.x + player.width/2, player.y, 'hit');
            }
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp < 0) this.hp = 0;
    }
    
    checkCollisions(game) {
        const level = game.currentLevel;
        
        // 地面碰撞
        if (this.y + this.height >= level.groundLevel) {
            this.y = level.groundLevel - this.height;
            this.vy = 0;
            this.onGround = true;
        }
        
        // 平台碰撞
        level.platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        });
        
        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > level.width) this.x = level.width - this.width;
    }
    
    updateAnimation() {
        this.animTimer++;
        if (this.animTimer > 15) {
            this.animFrame = (this.animFrame + 1) % 3;
            this.animTimer = 0;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 绘制怪物主体
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制眼睛
        ctx.fillStyle = '#FF0000';
        const eyeOffset = this.facing > 0 ? 5 : this.width - 10;
        ctx.fillRect(this.x + eyeOffset, this.y + 5, 3, 3);
        ctx.fillRect(this.x + eyeOffset + 6, this.y + 5, 3, 3);
        
        // 绘制血条
        if (this.hp < this.maxHp) {
            const barWidth = this.width;
            const barHeight = 4;
            
            // 背景
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);
            
            // 血量
            ctx.fillStyle = '#FF0000';
            const healthPercent = this.hp / this.maxHp;
            ctx.fillRect(this.x, this.y - 10, barWidth * healthPercent, barHeight);
        }
        
        // 绘制等级标识
        if (this.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv.${this.level}`, this.x + this.width/2, this.y - 15);
        }
        
        ctx.restore();
    }
}

// 粒子效果类
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 60;
        this.maxLife = 60;
        
        // 根据类型设置属性
        switch (type) {
            case 'damage':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = -Math.random() * 3 - 2;
                this.color = '#FF4444';
                this.size = 8;
                break;
            case 'magic':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = -Math.random() * 4 - 1;
                this.color = '#4444FF';
                this.size = 6;
                break;
            case 'explosion':
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.color = '#FF8800';
                this.size = 12;
                this.life = 30;
                this.maxLife = 30;
                break;
            case 'hit':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -Math.random() * 2;
                this.color = '#FFFF00';
                this.size = 4;
                this.life = 20;
                this.maxLife = 20;
                break;
            case 'skillAura':
                this.vx = 0;
                this.vy = 0;
                this.color = '#00FFFF';
                this.size = 50;
                this.life = 30;
                this.maxLife = 30;
                break;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        if (this.type !== 'skillAura') {
            this.vy += 0.2; // 重力
        }
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.type === 'skillAura') {
            // 技能光环效果
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * (1 - alpha), 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // 普通粒子
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 关卡数据
const LEVELS = [
    {
        name: "绿色草原",
        width: 1200,
        height: 600,
        groundLevel: 500,
        skyColor: '#87CEEB',
        groundColor: '#98FB98',
        platforms: [
            {x: 300, y: 400, width: 100, height: 20},
            {x: 500, y: 350, width: 80, height: 20},
            {x: 700, y: 300, width: 120, height: 20}
        ],
        monsters: [
            {x: 200, y: 460, type: 'slime', level: 1},
            {x: 400, y: 460, type: 'slime', level: 1},
            {x: 600, y: 460, type: 'goblin', level: 1}
        ],
        expReward: 50,
        goldReward: 20
    },
    {
        name: "森林深处",
        width: 1400,
        height: 600,
        groundLevel: 520,
        skyColor: '#228B22',
        groundColor: '#006400',
        platforms: [
            {x: 200, y: 420, width: 80, height: 20},
            {x: 350, y: 380, width: 100, height: 20},
            {x: 550, y: 340, width: 90, height: 20},
            {x: 750, y: 400, width: 120, height: 20}
        ],
        monsters: [
            {x: 150, y: 480, type: 'goblin', level: 1},
            {x: 300, y: 480, type: 'slime', level: 2},
            {x: 500, y: 480, type: 'goblin', level: 2},
            {x: 800, y: 480, type: 'orc', level: 1}
        ],
        expReward: 75,
        goldReward: 35
    },
    {
        name: "山洞入口",
        width: 1600,
        height: 600,
        groundLevel: 540,
        skyColor: '#696969',
        groundColor: '#2F4F4F',
        platforms: [
            {x: 250, y: 450, width: 100, height: 20},
            {x: 450, y: 400, width: 80, height: 20},
            {x: 650, y: 350, width: 120, height: 20},
            {x: 900, y: 420, width: 100, height: 20}
        ],
        monsters: [
            {x: 180, y: 500, type: 'skeleton', level: 1},
            {x: 380, y: 500, type: 'goblin', level: 2},
            {x: 580, y: 500, type: 'orc', level: 1},
            {x: 780, y: 500, type: 'skeleton', level: 2}
        ],
        expReward: 100,
        goldReward: 50
    },
    {
        name: "地下迷宫",
        width: 1800,
        height: 600,
        groundLevel: 550,
        skyColor: '#2F2F2F',
        groundColor: '#1C1C1C',
        platforms: [
            {x: 200, y: 480, width: 80, height: 20},
            {x: 350, y: 420, width: 100, height: 20},
            {x: 550, y: 380, width: 90, height: 20},
            {x: 750, y: 440, width: 120, height: 20},
            {x: 950, y: 400, width: 100, height: 20}
        ],
        monsters: [
            {x: 160, y: 510, type: 'skeleton', level: 2},
            {x: 320, y: 510, type: 'orc', level: 2},
            {x: 520, y: 510, type: 'skeleton', level: 2},
            {x: 720, y: 510, type: 'orc', level: 2},
            {x: 920, y: 510, type: 'goblin', level: 3}
        ],
        expReward: 125,
        goldReward: 70
    },
    {
        name: "熔岩洞穴",
        width: 2000,
        height: 600,
        groundLevel: 530,
        skyColor: '#8B0000',
        groundColor: '#DC143C',
        platforms: [
            {x: 300, y: 450, width: 100, height: 20},
            {x: 500, y: 400, width: 80, height: 20},
            {x: 700, y: 350, width: 120, height: 20},
            {x: 950, y: 420, width: 100, height: 20},
            {x: 1200, y: 380, width: 90, height: 20}
        ],
        monsters: [
            {x: 200, y: 490, type: 'orc', level: 2},
            {x: 400, y: 490, type: 'skeleton', level: 3},
            {x: 600, y: 490, type: 'orc', level: 3},
            {x: 850, y: 490, type: 'skeleton', level: 3},
            {x: 1100, y: 490, type: 'orc', level: 3}
        ],
        expReward: 150,
        goldReward: 90
    },
    {
        name: "冰雪高原",
        width: 1600,
        height: 600,
        groundLevel: 520,
        skyColor: '#B0E0E6',
        groundColor: '#F0F8FF',
        platforms: [
            {x: 250, y: 440, width: 100, height: 20},
            {x: 450, y: 390, width: 80, height: 20},
            {x: 650, y: 340, width: 120, height: 20},
            {x: 900, y: 410, width: 100, height: 20}
        ],
        monsters: [
            {x: 180, y: 480, type: 'skeleton', level: 3},
            {x: 380, y: 480, type: 'orc', level: 3},
            {x: 580, y: 480, type: 'skeleton', level: 4},
            {x: 780, y: 480, type: 'orc', level: 4},
            {x: 1000, y: 480, type: 'goblin', level: 5}
        ],
        expReward: 175,
        goldReward: 110
    },
    {
        name: "古代遗迹",
        width: 1800,
        height: 600,
        groundLevel: 540,
        skyColor: '#DDA0DD',
        groundColor: '#9370DB',
        platforms: [
            {x: 200, y: 470, width: 80, height: 20},
            {x: 350, y: 420, width: 100, height: 20},
            {x: 550, y: 370, width: 90, height: 20},
            {x: 750, y: 430, width: 120, height: 20},
            {x: 950, y: 390, width: 100, height: 20}
        ],
        monsters: [
            {x: 160, y: 500, type: 'skeleton', level: 4},
            {x: 320, y: 500, type: 'orc', level: 4},
            {x: 520, y: 500, type: 'skeleton', level: 5},
            {x: 720, y: 500, type: 'orc', level: 5},
            {x: 920, y: 500, type: 'skeleton', level: 5}
        ],
        expReward: 200,
        goldReward: 130
    },
    {
        name: "暗黑城堡",
        width: 2000,
        height: 600,
        groundLevel: 550,
        skyColor: '#2F2F2F',
        groundColor: '#1C1C1C',
        platforms: [
            {x: 300, y: 480, width: 100, height: 20},
            {x: 500, y: 430, width: 80, height: 20},
            {x: 700, y: 380, width: 120, height: 20},
            {x: 950, y: 450, width: 100, height: 20},
            {x: 1200, y: 400, width: 90, height: 20}
        ],
        monsters: [
            {x: 200, y: 510, type: 'orc', level: 5},
            {x: 400, y: 510, type: 'skeleton', level: 5},
            {x: 600, y: 510, type: 'orc', level: 6},
            {x: 850, y: 510, type: 'skeleton', level: 6},
            {x: 1100, y: 510, type: 'orc', level: 6}
        ],
        expReward: 250,
        goldReward: 160
    },
    {
        name: "魔王前厅",
        width: 1600,
        height: 600,
        groundLevel: 530,
        skyColor: '#8B0000',
        groundColor: '#2F2F2F',
        platforms: [
            {x: 250, y: 450, width: 100, height: 20},
            {x: 450, y: 400, width: 80, height: 20},
            {x: 650, y: 350, width: 120, height: 20},
            {x: 900, y: 420, width: 100, height: 20}
        ],
        monsters: [
            {x: 180, y: 490, type: 'skeleton', level: 6},
            {x: 380, y: 490, type: 'orc', level: 6},
            {x: 580, y: 490, type: 'skeleton', level: 7},
            {x: 780, y: 490, type: 'orc', level: 7},
            {x: 1000, y: 490, type: 'skeleton', level: 7}
        ],
        expReward: 300,
        goldReward: 200
    },
    {
        name: "魔王殿堂",
        width: 1400,
        height: 600,
        groundLevel: 520,
        skyColor: '#4B0082',
        groundColor: '#2F2F2F',
        platforms: [
            {x: 200, y: 440, width: 80, height: 20},
            {x: 400, y: 390, width: 100, height: 20},
            {x: 600, y: 340, width: 90, height: 20},
            {x: 800, y: 410, width: 120, height: 20}
        ],
        monsters: [
            {x: 300, y: 480, type: 'dragon', level: 1}, // 最终BOSS
            {x: 150, y: 480, type: 'orc', level: 8},
            {x: 550, y: 480, type: 'skeleton', level: 8},
            {x: 950, y: 480, type: 'orc', level: 8}
        ],
        expReward: 500,
        goldReward: 500
    }
];

// 游戏控制函数
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    game.currentLevelIndex = 0;
    game.gameState = 'playing';
    game.player = new Player(100, 400);
    game.loadLevel(0);
}

function nextLevel() {
    document.getElementById('levelComplete').style.display = 'none';
    
    if (game.currentLevelIndex < LEVELS.length - 1) {
        game.currentLevelIndex++;
        game.gameState = 'playing';
        game.loadLevel(game.currentLevelIndex);
    } else {
        // 游戏通关
        alert('恭喜！你已经击败了魔王，拯救了世界！');
        restartGame();
    }
}

// 启动游戏
let game;
window.addEventListener('load', () => {
    game = new Game();
});