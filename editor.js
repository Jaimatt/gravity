var selected
var preview = document.querySelector('.preview')
var editing = true

var mouse = {
    x: undefined,
    y: undefined,
}

console.log(preview)

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x
    mouse.y = event.y
})

function equip(me) {
    tools = document.querySelectorAll('.tool')
    for (i=0;i<tools.length;i++) {
        tools[i].classList.remove('selected')
    }
    selected = me.id
    me.classList.add('selected')
}

equip(document.querySelector('#select'))

function usetool() {
    switch(selected) {
        case 'ball':
            rect = canvas.getBoundingClientRect()
            
            objects.push(new Ball(event.clientX - rect.left, event.clientY - rect.top, 0, 0, 0.1))
            objects[objects.length - 1].draw()
            break
        case 'planet':
            rect = canvas.getBoundingClientRect()
            objects.push(new Planet(event.clientX - rect.left, event.clientY - rect.top, 9.8, true, 0.1))
            objects[objects.length - 1].draw()
            break
        case 'select':
            //get canvas info
            rect = canvas.getBoundingClientRect()

            //start recording distances between cursor and objects
            distances = []

            //go through each object and determine the distance between it and the cursor
            for (i = 0; i < objects.length; i++) {
                if (objects[i].type == 'Ball') {
                    //object pos is stored in m. we need to convert this.
                    xdistance = (mTOpx(objects[i].x) + rect.left) - event.clientX
                    ydistance = (mTOpx(objects[i].y) + rect.top) - event.clientY
                    //use pythagorean theorem to determine distances
                    d = pyth(xdistance, ydistance)
                    //add this to an array
                    distances.push(d)
                } else {
                    distances.push(10000000000)
                }
            }

            //find the shortest distance and record this object
            selectedObjectID = distances.indexOf(Math.min(...distances))

            //if the shortest distance is less than the radius, the cursor is over it!
            //I add 10 just to give the user some slight leeway
            if (mTOpx(objects[selectedObjectID].radius) + 10 < distances[selectedObjectID]) {
                break
            }

            //show the popup with all the object parameters
            popupWindow = document.getElementById('selectPopup')
            popupWindow.classList.remove('visible')

            //place this popup in the correct spot
            //add the position of the object in the canvas to the position of the canvas to get the position on the page
            if (objects[selectedObjectID].y < 3) {
                popupWindow.style.top = mTOpx(objects[selectedObjectID].y) + rect.top + 'px'
                
            } else {
                popupWindow.style.top = mTOpx(objects[selectedObjectID].y) + rect.top - 180 + 'px'
            }
            popupWindow.style.left = mTOpx(objects[selectedObjectID].x) + rect.left + 'px'

            //and now make the values of all the inputs correct
            //using just some trig i've converted the vx & vy into a direction & speed which is more user friendly
            popupWindow.querySelector('#x').value = roundTo(objects[selectedObjectID].x, 3)
            popupWindow.querySelector('#y').value = roundTo(objects[selectedObjectID].y, 3)
            popupWindow.querySelector('#v').value = roundTo(pyth(objects[selectedObjectID].vx, objects[selectedObjectID].vy), 3)
            //converting from components to degrees isn't straightforward. bear with me.
            speedAngle = toDegrees(Math.atan(objects[selectedObjectID].vy/objects[selectedObjectID].vx))
            //this is just because the domain of arctan is a little dodgy. we need to accomodate in quadrants 2 & 3
            if (objects[selectedObjectID].vx < 0) {
                speedAngle += 180
            }
            //this is only to make sure that the range of angles is -180 to 180 rather than 0 to 360
            //really it's just a personal choice. I think it's more user friendly
            if (speedAngle > 180) {
                speedAngle -= 360
            }
            popupWindow.querySelector('#d').value = roundTo(speedAngle,3)
            popupWindow.querySelector('#r').value = roundTo(objects[selectedObjectID].radius, 3)
            popupWindow.querySelector('#c').value = objects[selectedObjectID].hex

            break
        default:
            return
    }
    document.getElementById('oCount').innerText = objects.length
}

function applySelect() {
    document.querySelector('#selectPopup').classList.add('visible')

    objects[selectedObjectID].y = Number(popupWindow.querySelector('#y').value)
    objects[selectedObjectID].x = Number(popupWindow.querySelector('#x').value)
    objects[selectedObjectID].radius = Number(popupWindow.querySelector('#r').value)
    objects[selectedObjectID].vx = popupWindow.querySelector('#v').value * Math.cos(toRadians(popupWindow.querySelector('#d').value))
    objects[selectedObjectID].vy = popupWindow.querySelector('#v').value * Math.sin(toRadians(popupWindow.querySelector('#d').value))
    objects[selectedObjectID].hex = popupWindow.querySelector('#c').value

    c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)
    for (i = 0; i < objects.length; i++) {
        objects[i].draw()
    }

}

function erase() {
    console.log('hi')
    objects = []
    c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)
    document.getElementById('oCount').innerText = objects.length
}

function reset() {
    //the code below SHOULD work
    temp = JSON.parse(JSON.stringify(objectsbackup))

    //but it also needs this.
    //that's because the stringified/parsed object isn't identical... somehow
    //my solution is to manually look for the corresponding parameters as below
    //for every object
    for (i = 0; i < objects.length; i++) {
        //and every parameter of that object
        for (let j in temp[i]) {
            //replace the main object list with that of the backup one
            objects[i][j] = temp[i][j]
        }
    }

    c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)

    for (i = 0; i < objects.length; i++) {
        objects[i].draw()
    }
    
    document.getElementById('oCount').innerText = objects.length
}

function save() {
    //get settings from the simulation. This is done by looking at the checkboxes
    settings = [
        [
            document.getElementById('gravity').checked,
            document.getElementById('gravityOp').querySelector('input').value,
            document.getElementById('gravityOp').querySelector('select').value
        ],
        [
            document.getElementById('drag').checked,
            document.getElementById('dragOp').querySelector('input').value
        ],
        document.getElementById('wall').checked,
        document.getElementById('collide').checked,
        document.getElementById('transfer').checked,
        [
            document.getElementById('vvector').checked,
            document.getElementById('vvectorOp').querySelector('input').value,
        ],
        [
            document.getElementById('avector').checked,
            document.getElementById('avectorOp').querySelector('input').value,
        ],
    ]

    //create a JSON string for the objects.
    jsonString = JSON.stringify([objects, settings], (key, value) => {
        //if a function is encountered, convert it to a string so it can be converted to JSON
        if (typeof value === 'function') {
            return value.toString();
        }
        //if not, continue as usual
        return value;
    });

    //show the saving window
    document.getElementById('savePopup').style.display = 'block'
    document.getElementById('main').classList.toggle('disabled') //this just disables the rest of the page

    //and display the newly generated code on the webpage
    document.getElementById('saveBox').innerText = jsonString
}

function load() {
    document.getElementById('loadBox').value = ''
    document.getElementById('loadPopup').style.display = 'block'
    document.getElementById('main').classList.toggle('disabled')
}

function loadv() {
    document.getElementById('loadPopup').style.display = 'none';
    document.getElementById('main').classList.toggle('disabled')

    jsonString = document.getElementById('loadBox').value;

    parsedObject = JSON.parse(jsonString, (key, value) => {
        if (typeof value === 'string' && value.includes('function')) {
          // Convert the string representation back to a function
          return new Function('return ' + value)();
        }
        return value;
    });

    console.log(parsedObject)

    objects = parsedObject[0]
    c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)
    for (i = 0; i < objects.length; i++) {
        objects[i].draw()
    }

    settings = parsedObject[1]
    document.getElementById('gravity').checked = settings[0][0]
    console.log(settings[0][0] == true)
    if (settings[0][0]) {
        console.log('mark')
        document.getElementById('gravityOp').className = ''
    } else {
        console.log('jai')
        document.getElementById('gravityOp').className = 'visible'
    }
    document.getElementById('gravityOp').querySelector('input').value = settings[0][1]
    document.getElementById('gravityOp').querySelector('select').value = settings[0][2]
    document.getElementById('drag').checked = settings[1][0]
    if (settings[1][0]) {
        document.getElementById('dragOp').className = ''
    } else {
        document.getElementById('dragOp').className = 'visible'
    }
    document.getElementById('dragOp').querySelector('input').value = settings[1][1]
    document.getElementById('wall').checked = settings[2]
    document.getElementById('collide').checked = settings[3]
    document.getElementById('transfer').checked = settings[4]
    document.getElementById('vvector').checked = settings[5][0]
    if (settings[5][0]) {
        document.getElementById('vvectorOp').className = ''
    } else {
        document.getElementById('vvectorOp').className = 'visible'
    }
    document.getElementById('vvectorOp').querySelector('input').value = settings[5][1]
    document.getElementById('avector').checked = settings[6][0]
    if (settings[6][0]) {
        document.getElementById('avectorOp').className = ''
    } else {
        document.getElementById('avectorOp').className = 'visible'
    }
    document.getElementById('avectorOp').querySelector('input').value = settings[6][1]

    
}

function toggleOp(me) {
    document.getElementById(me.id + 'Op').classList.toggle('visible')

    c.clearRect(0, 0, preview.scrollWidth, preview.scrollHeight)

    applySettings()

    for (i = 0; i < objects.length; i++) {
        objects[i].draw()
    }
}

function applySettings() {
    //gravity
    if (document.getElementById('gravity').checked) {
        //get array value of selected direction
        direction = JSON.parse(document.getElementById('gravityOp').querySelector('select').value)
        
        //get the acceleration due to gravity magnitude
        magnitude = document.getElementById('gravityOp').querySelector('input').value

        //determine the x & y gravitational acceleration using these two values
        xgrav = magnitude * direction[0]
        ygrav = magnitude * direction[1]

        xgrav = xgrav
        ygrav = ygrav
        
    } else {
        xgrav = 0
        ygrav = 0
    }
    //drag
    if (document.getElementById('drag').checked) {
        friction = document.getElementById('dragOp').querySelector('input').value
    } else {
        friction = 0
    }
    //wall
    if (document.getElementById('wall').checked) {
        wallc = true
    } else {
        wallc = false
    }
    //object
    if (document.getElementById('collide').checked) {
        collide = true
    } else {
        collide = false
    }
    //vvectors
    if (document.getElementById('vvector').checked) {
        vv = true
        vvs = document.getElementById('vvectorOp').querySelector('input').value
    } else {
        vv = false
    } 
    //avectors
    if (document.getElementById('avector').checked) {
        av = true
        avs = document.getElementById('avectorOp').querySelector('input').value
    } else {
        av = false
    } 
    
}