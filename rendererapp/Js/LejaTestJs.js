//alert('gg bre ali iz skripte');

let name='mosh pit yes';

//objekt

let objektyolo={
    vrsta:'nesto', 
    kvantitet:5
};

objektyolo.vrsta='skart';
objektyolo.kvantitet=15;

objektyolo['vrsta']='moze i ovako';//ovo je gg za runtima jer u [] moze bit varijabla

//primjer
let sel='vrsta';

objektyolo[sel]='gg opet';

//kontrola klasa, for petlja i vrtin kroz to i iman particle sys
document.getElementById('TestId').className='TestBox-0';


//array

let classes=['TestBox-0','TestBox-1','TestBox-2','TestBox-3','TestBox-4']
//alert('mini break');
document.getElementById('TestId').className=classes[2];

//alert('setano na '+ classes[2]);

ChangeClasses('TestId',classes[4]);

function ChangeClasses(Id,ClassName)
{
    document.getElementById(Id).className=ClassName;
}


//sve prije je irelevantno
//
//
//





function rgb(r, g, b){
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    return ["rgb(",r,",",g,",",b,")"].join("");
  }

class particle{

    setdefault()
    {
        this.x=XStart+(Math.random()*2-1)*5;
        this.y=Ystart+(Math.random()*2-1)*5;
        //let z=0;
        this.vx=(Math.random()*2-1)*15;
        this.vy=(Math.random()*2-1)*15;
       // let vz=0;
        
        this.maxlife=6;
        this.CurrentLifetime=this.maxlife;
        this.collisionfactor=0.45;
    }

    constructor()
    {
       this.setdefault();
    }

    

    DrawParticle()
    {
        let rad=0;
        if(this.CurrentLifetime>this.maxlife/2)
        {
            rad=radius*(1-this.CurrentLifetime/this.maxlife);
        }
        else
        {
            rad=radius*this.CurrentLifetime/this.maxlife;
        }
        context.beginPath();
        context.arc(this.x, this.y,rad, 0, 2 * Math.PI,true);
        context.fillStyle = rgb((1-this.CurrentLifetime/this.maxlife)*255,155*(1-this.CurrentLifetime/this.maxlife),55*(1-this.CurrentLifetime/this.maxlife));
        context.fill();
        //context.lineWidth = 5;
       // context.strokeStyle = '#003300';
      // context.stroke();
    }

    MoveParticle(DeltaTime)
    {
        this.x+=this.vx*DeltaTime;
        this.y-=this.vy*DeltaTime;
        this.vy-=12.5*DeltaTime;
        this.CurrentLifetime-=DeltaTime*0.5;
        if(this.CurrentLifetime<=0)
        {
            this.setdefault();
        }

        
        if((this.x<=0 && this.vx<0)||(this.x>=canvas.width && this.vx>0))
        {
            this.vx=-this.vx*this.collisionfactor;
            this.CurrentLifetime*=this.collisionfactor;
        }

        if((this.y<=0 && this.vy>0)||(this.y>=canvas.height && this.vy<0))
        {
            this.vy=-this.vy*this.collisionfactor;
            this.CurrentLifetime*=this.collisionfactor;
        }
        
    }
}


function createCanvas(Xres,Yres)
{
    canvas = document.createElement('canvas');

    canvas.id = "CursorLayer";
    canvas.width = Xres;
    canvas.height = Yres;
    canvas.style.zIndex = 8;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid";
    canvas.style.backgroundColor='black';
   // let body = document.getElementsByTagName("body")[0];
    //body.appendChild(canvas);
    document.body.appendChild(canvas);

    context = canvas.getContext('2d');
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;

    
}

function setup()
{
    createCanvas(1000,700);
    //particles=new Array(100).fill().map(p=>new particle());
    // let p=new particle();
    // particles.push(p);

    for (let i = 0; i <1; i++) {
        let part=new particle();
        particles.push(part); 
    }

    for (let i = 0; i <particles.length; i++) {
        particles[i].DrawParticle();
    }
}

function DrawParticles()
{
 
    context.clearRect(0, 0, canvas.width, canvas.height);

   // p=new particle();
   // p.DrawParticle();
   //let a=0.1;
    //particles.forEach(p => {
      //  p.DrawParticle(0.1*a,0.5*a)
        //a+=0.02;
    //});

    if(particles.length<1000)
    {
        for(let a=0;a<Emission;a++)
        {
            let p=new particle();
            particles.push(p);
        }
    }
    
    for (let i = 0; i <particles.length; i++) {
        particles[i].MoveParticle(0.02);
        particles[i].DrawParticle();
    }
      
    setTimeout(DrawParticles, 0.02);
    
}



let particles=[];//=new Array(100);
let canvas;
let context ;//= canvas.getContext('2d');
let centerX ;//= canvas.width / 2;
let centerY ;//= canvas.height / 2;
const radius =25;
const Emission=2;
let XStart=400;
let Ystart=400;

setup();
//DrawParticles();
//DrawParticles();

let once=false;
document.onpointerdown=(event)=>{
    if(!once)
        once=true;
    else
        return;
    DrawParticles();
    console.log("triggered");
}

let offset=-55;
function handleMouseMove(event)
{
    XStart=event.pageX;
    Ystart=event.pageY+offset;
}

document.onmousemove = handleMouseMove;