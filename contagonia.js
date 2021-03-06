
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = "black"
            canvas_context.lineWidth = Math.max(this.strokeWidth, .00001)
            canvas_context.strokeRect(this.x, this.y, this.width, this.height)
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
            this.locked = 0
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                // console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                        this.radius -= 2
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                        this.radius -= 2
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                        this.radius -= 2
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                        this.radius -= 2
                    }
                }
            }
            if (this.locked == 0) {
                this.x += this.xmom
                this.y += this.ymom
            }

            if (Math.abs(this.xmom) + Math.abs(this.ymom) > 14) {
                this.xmom *= .95
                this.ymom *= .95
            }
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#11AADD") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 100)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


            for (let t = 0; t < countries.length; t++) {
                if (countries[t].body.isPointInside(TIP_engine)) {
                    selected = countries[t]
                }
            }

            if(selected.dummy !== 1){
                if (holesyndrome.totalinfected <= 0) {
                    if (start.isPointInside(TIP_engine)) {
                    selected.infected = 1000
                    holesyndrome.countries.push(selected)
                    }
                }
            }
            for (let t = 0; t < buttons.length; t++) {
                if (buttons[t].isPointInside(TIP_engine)) {
                    if (t == 0) {
                        if (holesyndrome.points >= 1) {
                            if (holesyndrome.tempmin > -12) {
                                holesyndrome.points -= 1
                                holesyndrome.tempmin--
                            }
                        }
                    }
                    if (t == 1) {
                        if (holesyndrome.points >= 1) {
                            if (holesyndrome.tempmax < 12) {
                                holesyndrome.points -= 1
                                holesyndrome.tempmax++
                            }
                        }
                    }
                    if (t == 2) {
                        if (holesyndrome.points >= 1) {
                            holesyndrome.points -= 1
                            holesyndrome.powers[0].infectivity += .00053
                        }
                    }
                    // if(t == 3){
                    //     if(holesyndrome.points >= 2){
                    //         holesyndrome.points -= 2
                    //         holesyndrome.powers[0].obviousness+=.01
                    //     }
                    // }
                }
            }
        });
        // window.addEventListener('pointerup', e => {
        //     window.removeEventListener("pointermove", continued_stimuli);
        // })

        canvas.addEventListener('pointermove', continued_stimuli);
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[2] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed * gamepadAPI.axesStatus[0]
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 10))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }

    // class Map {
    //     constructor() {
    //         this.selected = {}

    //     }


    // }
    class Country {
        constructor(people, security) {
            this.living = people
            this.security = security
            this.population = this.living
            this.infected = 0
            this.connections = []
            this.body = new Rectangle(25 + (Math.random() * 650), 25 + (Math.random() * 650), 50, 50, `rgba(${0 + ((this.infected / this.population) * 255)},${255 - ((this.infected / this.population) * 255)},0,1)`)
            this.center = new Circle(this.body.x + (this.body.width * .5), this.body.y + (this.body.height * .5), 0, "transparent")
            this.climate = 0

            if (Math.random() < .5) {
                this.climate += 1
                if (Math.random() < .8) {
                    this.climate += 1
                    if (Math.random() < .8) {
                        this.climate += 1
                        if (Math.random() < .8) {
                            this.climate += 1
                            if (Math.random() < .5) {
                                this.climate += 1
                                if (Math.random() < .5) {
                                    this.climate += 1
                                    if (Math.random() < .5) {
                                        this.climate += 1
                                        if (Math.random() < .5) {
                                            this.climate += 1
                                            if (Math.random() < .5) {
                                                this.climate += 1
                                                if (Math.random() < .5) {
                                                    this.climate += 1
                                                    if (Math.random() < .5) {
                                                        this.climate += 1
                                                        if (Math.random() < .5) {
                                                            this.climate += 1
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                this.climate -= 1
                if (Math.random() < .8) {
                    this.climate -= 1
                    if (Math.random() < .8) {
                        this.climate -= 1
                        if (Math.random() < .8) {
                            this.climate -= 1
                            if (Math.random() < .5) {
                                this.climate -= 1
                                if (Math.random() < .5) {
                                    this.climate -= 1
                                    if (Math.random() < .5) {
                                        this.climate -= 1
                                        if (Math.random() < .5) {
                                            this.climate -= 1
                                            if (Math.random() < .5) {
                                                this.climate -= 1
                                                if (Math.random() < .5) {
                                                    this.climate -= 1
                                                    if (Math.random() < .5) {
                                                        this.climate -= 1
                                                        if (Math.random() < .5) {
                                                            this.climate -= 1
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (Math.random() < .3) {
                this.climate = 0
            }
            // this.climate = 0


        }
        draw() {
            this.center = new Circle(this.body.x + (this.body.width * .5), this.body.y + (this.body.height * .5), 0, "transparent")
            this.body.color = `rgba(${0 + ((this.infected / this.population) * 255)},${255 - ((this.infected / this.population) * 255)},0,.5)`
            this.body.strokeWidth = this.security
            if (this.security <= 0) {
                this.body.strokeWidth = 0
            }
            for (let t = 0; t < this.connections.length; t++) {
                let link = new LineOP(this.center, this.connections[t].center, this.body.color, 2)
                links.push(link)
            }
            this.body.color = `rgba(${128 + ((this.infected / this.population) * 200) + (11 * this.climate)},${255 - ((this.infected / this.population) * 255)},${128 - (-(11) * this.climate)},1)`
            this.body.draw()
        }


    }
    class Power {
        constructor(cont = 0, dead = 0, obv = 0) {
            this.infectivity = cont
            this.deadly = dead
            this.obviousness = obv
        }
    }
    class Contagonia {
        constructor(country) {
            this.points = 10
            this.type = Math.random() * 4
            this.powers = [] // objects [contagiousness, deadliness, obviousness]
            this.countries = []
            // this.countries[0].infected = 0
            // this.countries[0].body.width *=1.4
            this.totaldead = 0
            this.totalinfected = 0
            this.tempmax = 0
            this.tempmin = 0

            this.invbar = new Rectangle(980, 200, 10, 0, "#00FF00")
            this.obvbar = new Rectangle(970, 200, 10, 0, "#FFFF00")
            this.deadbar = new Rectangle(990, 200, 10, 0, "red")
            this.coldbar = new Rectangle(940, 200, 10, 0, "cyan")
            this.heatbar = new Rectangle(900, 200, 10, 0, "pink")

        }
        spread() {
            let obvsum = 0
            let infsum = 0
            let deadsum = 0
            for (let k = 0; k < this.powers.length; k++) {
                obvsum += this.powers[k].obviousness
                infsum += this.powers[k].infectivity
                deadsum += this.powers[k].deadly
            }
            this.invbar.height = infsum * 1000
            // this.obvbar.height = obvsum * 100
            // this.obvbar.draw()
            // this.deadbar.height = deadsum * 100
            // this.deadbar.draw()
            this.security =  (infsum / obvsum)*100
            this.heatbar.height = (4 * this.tempmax)
            this.coldbar.height = (4 * Math.abs(this.tempmin))
            for (let t = 0; t < this.countries.length; t++) {
                for (let k = 0; k < this.powers.length; k++) {
                    let changesto = (infsum / (3 - (2.7 * (this.countries[t].infected / this.countries[t].population)))) * this.countries[t].infected  //400 390
                    this.countries[t].infected += changesto
                    this.countries[t].living -= changesto
                    this.totalinfected += changesto
                    if (this.countries[t].infected > this.countries[t].population) {
                        this.totalinfected -= (this.countries[t].infected - this.countries[t].population)
                        this.countries[t].infected = this.countries[t].population
                    }
                    for (let g = 0; g < this.countries[t].connections.length; g++) {
                        let spreadrat1 = (this.countries[t].infected / this.countries[t].population)
                        let spreadrat2 = infsum / obvsum
                        let spreadrat3 = spreadrat1 * spreadrat2
                        if ((2 * Math.random() * spreadrat3) > this.countries[t].connections[g].security) {
                            if (this.countries[t].connections[g].climate >= this.tempmin && this.countries[t].connections[g].climate <= this.tempmax) {
                                if (this.countries[t].connections[g].infected == 0) {
                                    this.countries[t].connections[g].infected = 400
                                    for (let h = 0; h < 17; h++) {
                                        if (Math.random() < .5) {
                                            this.countries[t].connections[g].infected += 100
                                        }
                                    }
                                    this.countries.push(this.countries[t].connections[g])
                                    this.points += 1
                                }
                            }
                        }
                    }
                }
            }
        }

        draw(){

            this.invbar.draw()
            this.heatbar.draw()
            this.coldbar.draw()


            canvas_context.fillStyle = "Black"
            canvas_context.font = '15px Arial'
            canvas_context.fillText(`${Math.round(this.tempmax)}`, this.heatbar.x, this.heatbar.y-20)
            canvas_context.fillText(`${Math.round(this.tempmin)}`, this.coldbar.x, this.coldbar.y-20)
            canvas_context.fillText(`${Math.floor(this.security*2)}`, this.invbar.x, this.invbar.y-20)
        }


    }

    let divider1 = new Rectangle(300, 0, 124, 380, "transparent")

    let divider2 = new Rectangle(500, 500, 500, 50, "transparent")

    let divider3 = new Circle(250, 500, 120, "transparent")

    let divider4 = new Circle(600, 200, 50, "transparent")

    let selecter = new Circle(0, 0, 15, "yellow")
    let selected = {}
    selected.dummy = 1

    let names = []

    let countries = []

    for (let t = 0; countries.length < 1200; t++) {
        let country = new Country((Math.random() * 62000000) + 40000000, (Math.random() * 8) - 2)
        country.body.height = (country.population / 100000000) * 14
        country.body.width = country.body.height
        let wet = 0
        for (let k = 0; k < countries.length; k++) {
            let link = new LineOP(country.center, countries[k].center)
            if (link.hypotenuse() < 25) {
                wet = 1
            }
        }
        if (divider1.isPointInside(country.center)) {
            wet = 1
        }
        if (divider2.isPointInside(country.center)) {
            wet = 1
        }
        if (divider3.isPointInside(country.center)) {
            wet = 1
        }
        if (divider4.isPointInside(country.center)) {
            wet = 1
        }

        if (wet == 0) {
            randomplanetnames(country)
            countries.push(country)
        }
        if (t > 10000) {
            break
        }

    }

    for (let t = 0; t < countries.length; t++) {
        for (let k = 0; k < countries.length; k++) {
            if (t != k) {
                let link = new LineOP(countries[t].center, countries[k].center)
                if (link.hypotenuse() < 46) {  // 3.9 * Math.max(countries[t].body.width, countries[k].body.width
                    countries[t].connections.push(countries[k])
                    countries[k].connections.push(countries[t])
                }


            }
        }
    }

    let start = new Rectangle(750, 350, 100, 50, "black")

    let buttons = []

    let coldbutton = new Rectangle(720, 500, 50, 50, "cyan")

    let hotbutton = new Rectangle(720, 440, 50, 50, "pink")


    let contagiousnessup = new Rectangle(720, 560, 50, 50, "#00FF00")

    let obviousnessup = new Rectangle(790, 560, 50, 50, "yellow")


    buttons.push(coldbutton)
    buttons.push(hotbutton)
    buttons.push(contagiousnessup)
    // buttons.push(obviousnessup)
    let links = []

    let holesyndrome = new Contagonia(countries[0])
    let gluttonousness = new Power(0.005, 0, 0.01)
    let guidebox = new Rectangle(700, 0, 350, 700, "gray")
    holesyndrome.powers.push(gluttonousness)


    let setup_canvas = document.getElementById('canvas') //getting canvas from document
    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    let counter = 0

    for (let t = 0; t < countries.length; t++) {
        if (countries[t].connections.length == 0) {
            countries.splice(t, 1)
        }
    }
    function main() {
        canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
        // canvas_context.fillStyle = `rgba(0,0,0,.01)`
        // canvas_context.fillRect(0, 0, canvas.width, canvas.height)
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)

        if (selected.dummy !== 1) {
            selecter.x = selected.center.x
            selecter.y = selected.center.y
        }

        selecter.draw()
        counter++
        // if (keysPressed['y']) {
        //     console.log(countries)
        // }
        // if (keysPressed['t']) {
        //     holesyndrome.tempmax += 1
        // }
        // if (keysPressed['r']) {
        //     holesyndrome.tempmin -= 1
        // }
        if (counter > 4) {
            for (let t = 0; t < links.length; t++) {
                links[t].draw()
            }
        }
        links = []
        for (let t = 0; t < countries.length; t++) {
            countries[t].draw()
        }
        guidebox.draw()

        for (let t = 0; t < buttons.length; t++) {
            buttons[t].draw()
        }
        if(holesyndrome.totalinfected == 0){
        start.draw()

        canvas_context.fillStyle = "white"
        canvas_context.font = '30px Arial'
        canvas_context.fillText(`Start`, start.x+10, start.y+35)
        }
        for(let t = 0;t<5;t++){
            holesyndrome.spread()
        }
        holesyndrome.draw()
        canvas_context.fillStyle = "Black"
        canvas_context.font = '20px Arial'
        canvas_context.fillText(`Total Infected: ${Math.round(holesyndrome.totalinfected)}`, 720, 50)
        canvas_context.fillText(`Gene points: ${Math.round(holesyndrome.points)}`, 720, 70)


        if (selected.dummy !== 1) {
            canvas_context.fillText(`Country: ${selected.name}`, 720, 120)
            canvas_context.fillText(`Temperature: ${selected.climate}`, 720, 140)
            canvas_context.fillText(`Security: ${Math.round(selected.security * 100)}`, 720, 160)
            if (selected.infected == 0) {
                canvas_context.fillText(`Infected: No`, 720, 180)
            } else {
                canvas_context.fillText(`Infected: Yes`, 720, 180)
            }
        }
    }

    function randomplanetnames(planet) {

        var letters = 'bcdfghjklmnpqrstvwxyz';
        var volesl = 'aeiouyaeiou'
        // var volesl = 'aaaaaaaaaaa'

        planet.name = ''
        let jee = Math.floor(Math.random() * 6) + 1
        for (var i = 0; i < jee; i++) {
            if (Math.random() < 0.03) {
                planet.name += letters[(Math.floor(Math.random() * 21))];
            }
            planet.name += letters[(Math.floor(Math.random() * 21))];
            planet.name += volesl[(Math.floor(Math.random() * 11))];
            if (Math.random() < 0.06) {
                planet.name += volesl[(Math.floor(Math.random() * 11))];
            }
        }


        let letter = planet.name.charAt(0).toUpperCase()
        let floot = planet.name.split("")
        planet.name = ''
        for (let l = 1; l < floot.length; l++) {
            planet.name += floot[l]
        }
        planet.name = letter + (planet.name)


        if (!names.includes(`${planet.name}`)) {
            names.push(planet.name)
        } else {
            randomplanetnames(planet)
        }
    }


})