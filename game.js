let config = {
    //auto -> best suitable rendering type for your browser(canvas/webGL)
    type: Phaser.AUTO,

    scale:{
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:900,
        height:600,
    },
    backgroundColor: 0xffffff,

     physics:{
        default:'arcade',
        arcade:{
            gravity:{
                y:1000,
            },
            debug:false,
        }
     },

    scene:{
        preload:preload,
        create:create,
        update:update,
    },
};

let game = new Phaser.Game(config);

let player_config = {
    player_speed:150,
    player_jump:-500,
}

function preload(){
    this.load.image("ground","Assets/topground.png");
    this.load.image("sky","Assets/background.png");
    this.load.image("apple","Assets/apple.png");
    this.load.spritesheet("dude","Assets/dude.png",{frameWidth:32,frameHeight:48});
    this.load.image("enemy","Assets/bomb.png");

} 

let score = 0;
let platforms;
let ground;
let fruits;


function create(){
    w = game.config.width;
    h = game.config.height;
    //tileSprite -> repeate the ground
    ground = this.add.tileSprite(0,h-128,w,128,'ground');
    ground.setOrigin(0,0);

    let background = this.add.sprite(0,0,'sky');
    background.setOrigin(0,0);
    background.displayWidth = w;
    background.displayHeight = h;
    background.depth = -1;

    //create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(600,400,'ground').setScale(2,0.5).refreshBody();
    platforms.create(250,300,'ground').setScale(2,0.5).refreshBody();
    platforms.create(600,200,'ground').setScale(2,0.5).refreshBody();

    //4th frame of dude image
    this.player = this.physics.add.sprite(100,100,'dude',4);
    //add bounce
    this.player.setBounce(0.4);
    this.player.setCollideWorldBounds(true);
    //player animation and movements

    this.anims.create({
        key:'left',
        frames:this.anims.generateFrameNumbers('dude',{start:0,end:3}),
        frameRate:10,
        repeat:-1,
    });

    this.anims.create({
        key:'center',
        frames:this.anims.generateFrameNumbers('dude',{start:4,end:4}),
        frameRate:10,
        repeat:-1,
    });

    this.anims.create({
        key:'right',
        frames:this.anims.generateFrameNumbers('dude',{start:5,end:8}),
        frameRate:10,
        repeat:-1,
    });
    //keys
    this.cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.existing(ground);
    ground.body.allowGravity = false;
    ground.body.immovable = true;

    //add collision detection btw player and ground
    this.physics.add.collider(ground,this.player);
    this.physics.add.collider(platforms,this.player);

    // //create cameras
    // this.cameras.main.setBounds(0,0,w,h);
    // this.physics.world.setBounds(0,0,w,h);

    // this.cameras.main.startFollow(this.player,true,true);
    // // this.cameras.main.setZoom(1.5);

    //ad group of apples
    spawnFruits.call(this);

    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#000'
    });
}

let enemiesCreated = false;

function update(){

    if(this.cursors.left.isDown){
        this.player.setVelocityX(-player_config.player_speed);
        this.player.anims.play('left',true);
    }
    else if(this.cursors.right.isDown){
        this.player.setVelocityX(player_config.player_speed);
        this.player.anims.play('right',true);
    }
    else{
        this.player.setVelocityX(0);
        this.player.anims.play('center',true);
    }

    //jumping ability & stop player when in air
    if(this.cursors.up.isDown && this.player.body.touching.down){
        this.player.setVelocityY(player_config.player_jump);
    }

    if (score >= 80 && !enemiesCreated) {
        createEnemies.call(this); // Create enemies
        enemiesCreated = true; // Set the flag to true
    }
}

function spawnFruits() {
    let fruits = this.physics.add.group({
        key: "apple",
        repeat: 7, // Number of fruits to spawn
        setScale: { x: 0.2, y: 0.2 },
        setXY: { x: 10, y: 0, stepX: 120 },
    });

    fruits.children.iterate(function(fruit) {
        fruit.setBounce(Phaser.Math.FloatBetween(0.4, 0.7));
    });

    // Set up collisions again
    this.physics.add.collider(this.player, fruits, eatFruit, null, this);
    this.physics.add.collider(fruits, ground);
    this.physics.add.collider(fruits, platforms);
}


function eatFruit(player,fruit){
    //1st->disableGameObj , 2nd->HideGameObj
    fruit.disableBody(true,true);
    score += 10; // Increase score
    this.scoreText.setText('Score: ' + score); // Update score display
    if(score % 80 === 0)
        spawnFruits.call(this);
}

function hitEnemy(player, enemy) {
    // Define behavior when the player hits an enemy
   gameOver.call(this);
}

function createEnemies() {
    // Create enemies
    this.enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 2,
        setXY: { x: 400, y: 0, stepX: 300 },
    });

    this.enemies.children.iterate(function(enemy) {
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(Phaser.Math.Between(-100, 100));
    });

    this.physics.add.collider(this.enemies, platforms);
    this.physics.add.collider(this.enemies, ground);
    this.physics.add.collider(this.enemies, fruits);
    this.physics.add.collider(this.player, this.enemies, hitEnemy, null, this);
}

function gameOver() {
    // Pause the physics world
    this.physics.pause();
    
    // Change player tint to indicate game over
    this.player.setTint(0xff0000); // Change color to red

    // Disable player controls
    this.cursors.left.isDown = false;
    this.cursors.right.isDown = false;
    this.cursors.up.isDown = false;

    // Display Game Over text
    let gameOverText = this.add.text(game.config.width / 2, game.config.height / 2, 'Game Over', {
        fontSize: '64px',
        fill: '#000'
    }).setOrigin(0.5);

    // Disable enemy movement (if necessary)
    this.enemies.children.iterate(function(enemy) {
        enemy.setVelocity(0); // Stop enemy movement
        enemy.setImmovable(true); 
    });

}
