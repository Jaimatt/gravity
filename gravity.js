var canvas = document.querySelector('canvas')
canvas.width = preview.scrollWidth
canvas.height = preview.scrollHeight
var c = canvas.getContext('2d')

var running = false

let gravSources = ['hi']

fps = 20
objects = []
objectsbackup = []

var ygrav = 0
var xgrav = 0
var friction = 0.01
var wallc = false
var collide = false
var animation
var vv = false
var vvs = 1
var av = false
var avs = 1
var headlen = 10

function Ball(x, y, vx, vy, radius) {
    this.type = 'Ball'
    this.x = pxTOm(x)
    this.y = pxTOm(y)
    this.vx = vx
    this.vy = vy
    this.hex = '#000000'

    this.radius = radius
    this.collide = true

    this.draw = function() {       
        //velocity vectors
        if (vv) {
            //my code is below
            c.beginPath()
            c.strokeStyle = "blue"
            c.lineWidth = 2
            c.moveTo(mTOpx(this.x),mTOpx(this.y))
            c.lineTo(mTOpx(this.x + (this.vx *(1/vvs))),mTOpx(this.y - (this.vy *(1/vvs))))

            //a version of this code was initially shared on stack overflow.
            //I altered it to make the arrow filled in, differently sized, and work within an object
            //basically all it does is some complex trigonometry to determine the arrow position
            this.dx = mTOpx(this.x + (this.vx *(1/vvs))) - mTOpx(this.x);
            this.dy = mTOpx(this.y - (this.vy *(1/vvs))) - mTOpx(this.y);
            this.angle = Math.atan2(this.dy, this.dx);
            c.lineTo(mTOpx(this.x + (this.vx *(1/vvs))), mTOpx(this.y - (this.vy *(1/vvs))));
            c.lineTo(mTOpx(this.x + (this.vx *(1/vvs))) - headlen * Math.cos(this.angle - Math.PI / 6), mTOpx(this.y - (this.vy *(1/vvs))) - headlen * Math.sin(this.angle - Math.PI / 6));
            c.lineTo(mTOpx(this.x + (this.vx *(1/vvs))) - headlen * Math.cos(this.angle + Math.PI / 6), mTOpx(this.y - (this.vy *(1/vvs))) - headlen * Math.sin(this.angle + Math.PI / 6));
            c.lineTo(mTOpx(this.x + (this.vx *(1/vvs))), mTOpx(this.y - (this.vy *(1/vvs))));

            //and back to the code that deals with the rendering
            c.fillStyle = 'blue'
            c.fill()
            c.stroke()
        }

        //acceleration vectors
        if (av) {
            c.beginPath()
            c.strokeStyle = "red"
            c.lineWidth = 2
            c.moveTo(mTOpx(this.x),mTOpx(this.y))
            c.lineTo(mTOpx(this.x + (this.ax *(1/avs))),mTOpx(this.y - (this.ay *(1/avs))))

            this.dx = mTOpx(this.x + (this.ax *(1/avs))) - mTOpx(this.x);
            this.dy = mTOpx(this.y - (this.ay *(1/avs))) - mTOpx(this.y);
            this.angle = Math.atan2(this.dy, this.dx);
            c.lineTo(mTOpx(this.x + (this.ax *(1/avs))), mTOpx(this.y - (this.ay *(1/avs))));
            c.lineTo(mTOpx(this.x + (this.ax *(1/avs))) - headlen * Math.cos(this.angle - Math.PI / 6), mTOpx(this.y - (this.ay *(1/avs))) - headlen * Math.sin(this.angle - Math.PI / 6));
            c.lineTo(mTOpx(this.x + (this.ax *(1/avs))) - headlen * Math.cos(this.angle + Math.PI / 6), mTOpx(this.y - (this.ay *(1/avs))) - headlen * Math.sin(this.angle + Math.PI / 6));
            c.lineTo(mTOpx(this.x + (this.ax *(1/avs))), mTOpx(this.y - (this.ay *(1/avs))));

            c.fillStyle = 'red'
            c.fill()
            c.stroke()
        }
        
        //draw ball!
        c.beginPath()

        //set up styling
        c.strokeStyle = this.hex
        c.fillStyle = this.hex
        c.lineWidth = 1

        //position is converted x and converted y using mTOpx()
        c.arc(mTOpx(this.x), mTOpx(this.y), mTOpx(this.radius), 0, Math.PI * 2, false)

        //put on canvas
        c.stroke()
        c.fill()
        
    }

    this.update = function() {
        //get acceleration from gravity
        this.ax = xgrav
        this.ay = ygrav
        
        //find acceleration due to gravitational bodies
        //for every gravitational source
        for (this.k = 0; this.k < gravSources.length; this.k++) {
            //find the magnitude of the distance between the grav source and the object
            this.xmag = (gravSources[this.k][0] - this.x)
            this.ymag = (gravSources[this.k][1] - this.y)

            //alter the acceleration vector components of the object by this number.
            //multiply it by 9.8 and divide by the vector magnitude to ensure the vector's magnitude becomes 9.8
            this.ax += (this.xmag * 9.8) / pyth(this.xmag, this.ymag)
            this.ay -= (this.ymag * 9.8) / pyth(this.xmag, this.ymag)
        }

        //lower acceleration due to air resistance
        this.ax = this.ax - (friction * this.vx)
        this.ay = this.ay - (friction * this.vy)


        //calculate velocity & position
        this.vx += this.ax/fps
        this.vy += this.ay/fps

        this.x += this.vx/fps
        this.y -= this.vy/fps

        //bounce off walls
        if (wallc) { //check if wall collisions are enabled
            //check for bottom of screen
            //radius is added as I want the edge of the ball to be affected, not the centre of the ball.
            if (this.y + this.radius > pxTOm(canvas.height)) {
                //telport to correct position to prevent glitching
                this.y = pxTOm(canvas.height) - this.radius
                //reverse vertical velocity
                this.vy = -1 * this.vy
            }
            //bottom of screen
            if (this.y - this.radius < 0) {
                //telport
                this.y = this.radius
                //reverse
                this.vy = -1 * this.vy
            }
            //screen right
            if (this.x + this.radius > pxTOm(canvas.width)) {
                //teleport
                this.x = pxTOm(canvas.width) - this.radius
                //reverse
                this.vx = -1 * this.vx
            }
            //screen left
            if (this.x - this.radius < 0) {
                //teleport
                this.x = this.radius
                //reverse
                this.vx = -1 * this.vx
            }
        }

        //object collisions
        if (collide) {
            //go through each object
            for (this.k = 0; this.k < objects.length; this.k++) {
                //check that the distance is less than the sum of the two objects' radii. In other words, they're touching
                //Also make sure that we're not checking an object is touching itself. After all, it always will be.
                if (pyth(this.x - objects[this.k].x, this.y - objects[this.k].y) <= this.radius + objects[this.k].radius && this != objects[this.k] && this.collide) {
                    console.log('collision!')
                    //and now math! calculate this particular objects' direction & speed
                    this.speed = pyth(this.vx,this.vy)
                    this.angle = angle(this.vx,this.vy)

                    //find the angle of the line that is tangent to both balls at the point of contact
                    this.lineAngle = Math.atan(-1 * ((this.x - objects[this.k].x) / (this.y - objects[this.k].y)))

                    //and adjust the object's angle using this line angle
                    this.angle = -1 * (this.angle + this.lineAngle) - this.lineAngle

                    //convert the speed & angle back into vx & vy (cartesian velocity)
                    this.vx = this.speed * Math.cos(this.angle)
                    this.vy = this.speed * Math.sin(this.angle)
                    
                    //cancel this object's ability to collide (temporarily)
                    //this will prevent it from running the code twice within the same collision
                    this.collide = false
                }
            }

            this.touchCount = 0
            //another for loop to check if we're still touching eny objects
            for (this.k = 0; this.k < objects.length; this.k++) {
                //check for objects touching
                if (pyth(this.x - objects[this.k].x, this.y - objects[this.k].y) <= this.radius + objects[this.k].radius && this != objects[this.k]) {
                    //if they're touching raise a number
                    this.touchCount += 1
                }
            }
            //if the number is still 0, no objects are touching
            if (this.touchCount == 0) {
                //and thus collisions are allowed again.
                this.collide = true
            }
        }


        //done!
        this.draw()

        
    }
}

function Planet(x, y, mass, fixed, radius) {
    this.type = 'Planet'
    this.x = pxTOm(x)
    this.y = pxTOm(y)
    this.vx = 0
    this.vy = 0
    this.mass = mass
    this.fixed = fixed

    this.radius = radius

    this.draw = function() {
        c.beginPath()
        c.arc(mTOpx(this.x), mTOpx(this.y), mTOpx(this.radius), 0, Math.PI * 2, false)
        c.strokeStyle = 'black'
        c.lineWidth = 1
        c.stroke()
    }  

    this.update = function() {
        if (!this.fixed) {
            this.ax = xgrav
            this.ay = ygrav

            this.vx += this.ax/fps
            this.vy += this.ay/fps

            this.x += this.vx/fps
            this.y -= this.vy/fps
        }

        this.draw()
        
    }
}

function run() {
    document.querySelector('#selectPopup').classList.add('visible')
    document.getElementById('stop').style.display = 'inline-block'
    document.getElementById('start').style.display = 'none'
    document.getElementById('settings').classList.toggle('notallowed')

    //stringify all the objects when running the function.
    //I made sure this only works EITHER when you're in the editor or its the first backup
    //this is because I will soon add a viewer when I only want it to reset to factory settings, not when it was last run
    if (objectsbackup.length == 0 || editing) {
        objectsbackup = JSON.parse(JSON.stringify(objects));
    }
    
    //start running animation
    running = true

    //create interval
    animation = setInterval(function () {

        //clear screen
        c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)


        //every frame:        
        //find all gravitational sources
        gravSources = []

        //go through each object,
        for (i = 0; i < objects.length; i++) {
            //if the object is a planet,
            if (objects[i].type == 'Planet') {
                //add its x & y position to the afforementioned list
                gravSources.push([objects[i].x, objects[i].y])
            }
        }
        

        //update each object. This also draws it
        for (i = 0; i < objects.length; i++) {
            objects[i].update()
        }

        //find number of objects
        document.getElementById('oCount').innerText = objects.length

    }, 1000/fps);
}

function stop() {
    running = false
    document.getElementById('stop').style.display = 'none'
    document.getElementById('start').style.display = 'inline-block'
    document.getElementById('settings').classList.toggle('notallowed')
    clearInterval(animation)
}

stop()

//pythagorean theorem used for some vector calculations:
function pyth(a, b) {
    return Math.sqrt(a**2 + b**2)
}

// functions that convert between metres and pixels
function mTOpx(x) {
    return x * preview.scrollHeight / 6
}

function pxTOm(x) {
    return x * 6 / preview.scrollHeight
}

function roundTo(num, precision) {
    return Math.round(num * (10**precision)) / (10**precision)
}

//I also quickly implemented these so that I could present degrees to the user
//JS does trig in radians
function toDegrees(angle) {
    return angle * (180 / Math.PI);
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function angle(x,y) {
    k = Math.atan(y/x)
    if (x < 0) {
        k += Math.PI
    }
    if (k > Math.PI) {
        k -= 2*Math.PI
    }
    return k
}