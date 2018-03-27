var canvas = document.querySelector('canvas');

const c = canvas.getContext('2d');

var backgroundImg = new Image;
backgroundImg.src = "images/Background.png";

var img = new Image;
img.src = "images/Rocket.png";

var colors = ['#f2b035', '#ffac11', '#ffcc14', '#ff9e21'];

var debug = false;

var frame=0;
var checkFrame=100;

canvas.width = 1024;
canvas.height= 1024;

var centerX = canvas.width/2;
var centerY = canvas.height/2;

let mouse = {
    x:50,
    y:50
};

const GRAVITY = 0.004;

var rocketOriginX;
var rocketOriginY;

var angle = 0;
var MathAngle= 0;
var angleArray = [0];
var angleDiff;
var newRotation;
var toRadian = Math.PI/180;

var isDead;
var deathSpeed= 1.3;
var steeringThrusterForce = 0;
var steeringThrusterForceAcceleration = 0.4;

var isLanded;
var isTooFast;

const MAX_PARTICLES = 200;
var particleEmitIndex=0;

var engineThrust = 0;
const MAX_ENGINE_THRUST = 1;

var newX=0;
var newY=0;

// DEBUG MODE TO SET MANUAL COLLISION
debug= false;

function collisionSpheres(x,y,radius,color){
    this.x=x;
    this.y=y;
    this.radius=radius;
    this.color=color;

    this.update= function(){
        this.draw()
    };
    
    this.draw = function (){

        c.beginPath();
        c.arc(x,y,radius,0,Math.PI*2,false);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
    };
}

function Particle(id,x,y,dx,dy,size,life,maxLife,color,isEngine){
    c.fillStyle = color;

    this.id=id;
    this.x=x;
    this.y=y;
    this.dx=dx;
    this.dy=dy;
    this.size=size;
    this.life=life;
    this.maxLife=maxLife;
    this.color=color;
    this.isEngine=isEngine;
    this.shoudDraw = true;

    this.update = function (){
        if(this.id < particleEmitIndex && this.isEngine)
        {
            this.draw();
            this.move();        
        }

        if(!this.isEngine)
        {
            this.draw();
            this.move();    
        }
    }

    this.draw = function ()
    {
        if(this.life > maxLife)
        {
            this.x =0;
            this.y =0;
            this.life =0;
            this.shoudDraw=false;
        }

        if(this.shoudDraw)
        {
            //Make sure emitter location stays on thruster during rotation
            deltaX = calculateVectorX(MathAngle,35);
            deltaY = calculateVectorY(MathAngle,35);

            //Draw Particle
            c.fillRect(this.x+rocketOriginX-deltaX,(this.y+rocketOriginY+deltaY-10),size,size);
        }

        this.life++;
    }

    //This updates the particles movment
    this.move = function (){
        this.x+=this.dx-(deltaX/10);
        this.y+=this.dy+(deltaY/10);
    }

    this.clear = function () {
        c.clearRect( this.x, this.y, this.size, this.size );
    };

}

function Rocket (x,y,dx,dy,angle){
    this.x=x;
    this.y=y;
    this.dx=dx;
    this.dy=dy;
    this.angle=angle;
    
    this.draw();
}

function CollisionObj (x,y,w,h){
    this.x=x;
    this.y=y;
    this.w=w;
    this.h=h;
}

function RocketCollision (x,y,radius){
    this.x= x;
    this.y= y;
    this.radius=radius;
}

function CollisionCircle (x,y,radius){
    this.x = x;
    this.y = y;
    this.radius= radius;

    CollisionCircleArray.push(this);

    this.update = function (){
        this.draw();
    }

    this.draw = function (){
        c.fillStyle = 'red';
        c.beginPath();
        c.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        c.fill();
        c.closePath();
    }
}

if(debug)
{
    addEventListener('mousemove', function(){
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    })
}


addEventListener('click', function () {
    if(debug)
    {
        createCollisionCircle(mouse.x,mouse.y,20);
    }
    if(isLanded)
    {
        restart();
    }
});

addEventListener('resize', function () {
    
    imageRatio = canvas.width/canvas.height;

    init();
});

addEventListener('keydown',function(event){
    if(!isDead && !isLanded)
    {
        switch(event.keyCode){
            case 37:
                steeringThrusterForce -= steeringThrusterForceAcceleration;
            break;
            
            case 38:
                if(engineThrust< MAX_ENGINE_THRUST && particleEmitIndex < MAX_PARTICLES){
                    engineThrust+=0.001;
    
                    newX = calculateVectorX(MathAngle,engineThrust);
                    newY = calculateVectorY(MathAngle,engineThrust);
    
                    Rocket.dx+= newX;
                    Rocket.dy+= -newY;
    
                    if(particleEmitIndex<MAX_PARTICLES)
                    {
                        particleEmitIndex++
                    }
                }
    
            break;
    
            case 39:
                steeringThrusterForce += steeringThrusterForceAcceleration;
            break;
    
            case 40:
                //Down button
            break;

            case 68:
                if(debug){
                    for(var i = 0; i < CollisionCircleArray.length; i++){
                        console.log("collisioncircle"+i+"="+"new CollisionCircle("+CollisionCircleArray[i].x+","+ CollisionCircleArray[i].y+","+15+")"+";");
                    }
                }

            break;
                
        }
    }

});

addEventListener('keyup', function (event){
    if(event.keyCode == 38){
        engineThrust = 0;
    }

});

Rocket.prototype.update = function (){

    if(!isDead)
    {
        frame++;
        rocketOriginX = this.x+img.width/2;
        rocketOriginY = (this.y+img.height/2);
    
        newRotation= rotation(angle,steeringThrusterForce);
        MathAngle = OffsetAngle(angle);

        //Adding gravity to player
        this.dy+=GRAVITY;

        //Updating the X and Y velocity
        this.x+=this.dx;
        this.y+=this.dy;

        //Updating the collision circle
        Rocketcollisioncircle.x = rocketOriginX;
        Rocketcollisioncircle.y = rocketOriginY;
        //Rocketcollisioncircle.update();

        if(this.dy > deathSpeed)
        {
            isTooFast=true;
        }else{
            isTooFast=false;
        }

        //Get rotation every fifth frame
        if(frame==checkFrame){
            angleArray.push(angle);
            checkFrame=frame+5;
            angleDiff=angleArray[angleArray.length-1]-angleArray[angleArray.length-2];
        }

        //Kill player if rotation  is exceded
        if(angleDiff > 120 && angleDiff < 150 || angleDiff < -120 && angleDiff > -150){
            isDead=true;
        }

        //Check if player collides with landingpad
        if(!isTooFast && rocketOriginY+60>collisionLandingpad.y+collisionLandingpad.h && rocketOriginX>collisionLandingpad.x && rocketOriginX<collisionLandingpad.x+collisionLandingpad.w)
        {
            this.dy-=this.dy;
            this.dx=0;

            isLanded=true;

            this.x = (collisionLandingpad.x+collisionLandingpad.w/2)-img.width/2;
            this.y = collisionLandingpad.y-img.height+20;
        }

        //Kill player if it hits the ground to fast
        if((rocketOriginY+102) > canvas.height && this.dy > deathSpeed)
        {
            isDead=true;
        }

        //Make player stop on the ground
        if((rocketOriginY+102) > canvas.height && this.dy < deathSpeed)
        {
            this.dy-=this.dy;
            this.dx=0;
        }

        //Check if player collides with collisionobjects
        for(var i = 0;i < CollisionCircleArray.length;i++)
        {
            distance = getDistance(Rocketcollisioncircle.x,Rocketcollisioncircle.y,CollisionCircleArray[i].x,CollisionCircleArray[i].y);

            if(distance<Rocketcollisioncircle.radius)
            {
                isDead=true;
            }
        }

        // Check if player is outside play area
        if(rocketOriginY<0 || rocketOriginX>canvas.width || rocketOriginX<0)
        {
            isDead=true;
        }

        //Rotation Logic
        c.save();
        c.translate(rocketOriginX,rocketOriginY);
        c.rotate(newRotation * toRadian);
        this.draw();
    }

}

Rocket.prototype.draw = function(){
    c.drawImage(img,-(img.width/2),-(img.height/2));
    c.restore();

    
    //Debug Lines
    /*
    c.strokeStyle="#FF0000"
    c.beginPath();
    c.moveTo(0,0);
    c.lineTo(collisionLandingpad.x+collisionLandingpad.w/2,collisionLandingpad.y);
    c.closePath();
    c.stroke();
    */
    

}

var ParticleArray= [];
var ParticleExplosionArray = [];
var CollisionCircleArray = [];
var distanceArray = [];

function init (){

    if(!debug)
    {
        //Creating the engine particles
        for(i=0;i<MAX_PARTICLES;i++){
            var id = i;
            var x = 0;
            var y = 0;
            var dx = getRandomArbitrary(-2,2);
            var dy = getRandomArbitrary(-2,2);
            var size = getRandomArbitrary(3,8);
            var life = 0;
            var maxLife = getRandomArbitrary(20,50);
            var color = colors[Math.floor(getRandomArbitrary(0,3))];
            var isEngine = true;
        
            ParticleArray.push(new Particle(i,x,y,dx,dy,size,life,maxLife,color,isEngine));
        }
        //Creating the explosion particles
        for(i=0;i<50;i++){
            var id = i;
            var dx = getRandomArbitrary(-3,3);
            var dy = getRandomArbitrary(-10,10);
            var size = getRandomArbitrary(3,8);
            var life = 0;
            var maxLife = getRandomArbitrary(20,50);
            var color = colors[Math.floor(getRandomArbitrary(0,3))];
            var isEngine = false;
        
            ParticleExplosionArray.push(new Particle(i,x,y,dx,dy,size,life,maxLife,color,isEngine));
        }

        //Creating the collision for landingpad
        collisionLandingpad = new CollisionObj (445,930,138,20);

        //Creating the collision circles (This is the place to paste the debug collisions)
        collisioncircle0=new CollisionCircle(699,949,15);
        collisioncircle1=new CollisionCircle(700,903,15);
        collisioncircle2=new CollisionCircle(698,854,15);
        collisioncircle3=new CollisionCircle(699,802,15);
        collisioncircle4=new CollisionCircle(696,748,15);
        collisioncircle5=new CollisionCircle(697,707,15);
        collisioncircle6=new CollisionCircle(696,675,15);
        collisioncircle7=new CollisionCircle(251,916,15);
        collisioncircle8=new CollisionCircle(285,915,15);
        collisioncircle9=new CollisionCircle(320,918,15);
        collisioncircle10=new CollisionCircle(325,943,15);
        collisioncircle11=new CollisionCircle(286,941,15);
        collisioncircle12=new CollisionCircle(257,944,15);

        //Creating the player
        Rocket = new Rocket(centerX,centerY-200,0,0,0);

        //Create the collision circle for player
        Rocketcollisioncircle=new RocketCollision(centerX,centerY,30);

        var distance;
    }

}

function animate(){
    
    if(!debug)
    {
        requestAnimationFrame(animate)
        c.clearRect(0,0,canvas.width,canvas.height)
        c.drawImage(backgroundImg,0,0,canvas.width,canvas.height);
        Rocket.update();
        
        if(particleEmitIndex<MAX_PARTICLES)
        {
            for(var i=0;i<MAX_PARTICLES;i++){
                ParticleArray[i].update();
            }
        }
    
        if(isDead)
        {
            for(var i=0;i<50;i++)
            {
                ParticleExplosionArray[i].update();
            }
        }
    }

    if(isLanded)
    {
        c.font = "80px Arial";
        c.fillStyle=colors[0]
        c.fillText("Mission Completed!",160,centerY);
    }

    if(isDead)
    {
        c.font = "80px Arial";
        c.fillStyle=colors[0]
        c.fillText("Mission Failed!",250,centerY);
    }

    if(debug){
        requestAnimationFrame(animate);
        c.drawImage(backgroundImg,0,0,canvas.width,canvas.height);
        for(var i = 0; i < CollisionCircleArray.length; i++){
            CollisionCircleArray[i].draw();
        }
    }

}

function rotation(currentAngle,thrust){

    var newAngle = currentAngle+thrust;
    angle=newAngle;

    if(angle>360){
        angle=0;
    }
    if(angle<0){
        angle=360;
    }
    return newAngle;
}

function GetCurrentRotation(object,frame){

    if(frame == checkFrame || frame == secondFrame)
    {
        console.log("GetCurrentRotationCalled");
        secondFrame+=checkFrame+100;
        return object.angle;
    }

}

function getDistance(x1,y1,x2,y2){
    let xDistance = x1-x2;
    let yDistance = y1-y2;

    return Math.sqrt(Math.pow(xDistance,2) + Math.pow(yDistance,2));
}

function calculateVectorX(inputangle,thrust)
{
    var magnitudeX=thrust*Math.cos(inputangle*(Math.PI/180));
    return magnitudeX;
}

function calculateVectorY(inputangle,thrust)
{
    var magnitudeY=thrust*Math.sin(inputangle*(Math.PI/180));
    return magnitudeY;
}

function OffsetAngle(inputAngle){

    var offset = 90;
    offset-=inputAngle;
    return offset;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function GetRandomParticle (array){
    var random= Math.floor(getRandomArbitrary(0,array.length));
    return random;
}

function createCollisionCircle(x,y,radius){
    var loaclcollisionCircle = new CollisionCircle(x,y,radius);

    CollisionCircleArray.push(loaclcollisionCircle);

    loaclcollisionCircle.draw();

}

init();
animate();
