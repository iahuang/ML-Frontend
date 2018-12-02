let nodeTemplate = `
<div class="node">
<p class="nodetext"> Wow this is a node </p>
<span class="port" data-type="input"></span>
<span class="port" data-type="output"></span>
</div>
`;

var dragOrigin = null;
var mousex = null;
var mousey = null;

var dragOffset = null;
var dragTarget = null;

var portOrigin = null;

document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);

var canvas = document.getElementById("canvas");
canvas.style.width='100%';
canvas.style.height='100%';
canvas.width  = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
var ctx = canvas.getContext("2d");

ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(10, 10);
ctx.stroke();

var nodes = {};

class Node {
    constructor (element) {
        this.element = element;
        this.outputs = [];
        this.inputs = [];
    }
}

class Port {
    constructor (element, type) {
        this.element;
        this.type = type;
    }
}

function offset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

function toolbarAdd() {
    var newNode = $(nodeTemplate);
    $(".sandbox").prepend(newNode);
    var nodeElement = newNode.get(0);
    var nodeObject = new Node(nodeElement);
    nodes[nodeElement] = nodeObject;

    nodeElement.addEventListener("mousedown", onClickNode);
    nodeElement.addEventListener("mouseup", onReleaseNode);
    let ports = nodeElement.getElementsByClassName("port");

    for (var i = 0; i<ports.length; i++) {
        var port = ports[i];
        port.addEventListener("mousedown", onClickPort);
        port.addEventListener("mouseup", onReleasePort);
        let portType = port.dataset.type;
        var portObject = new Port(port, portType)
        if (portType == "input") {
            nodeObject.inputs.push(portObject);
        } else {
            nodeObject.outputs.push(portObject);
        }
    }
}

function mouseDown(e) {
}

function mouseMove(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dragTarget) {
        dragTarget.style.left = e.pageX-dragOffset[0];
        dragTarget.style.top = e.pageY-dragOffset[1];
    }
    if (portOrigin) {
        let canvOffset = offset(canvas);
        ctx.translate(-canvOffset.left, -canvOffset.top)
        ctx.beginPath();
        let originPos = offset(portOrigin);
        ctx.moveTo(originPos.left+8, originPos.top+8);
        ctx.lineTo(e.pageX, e.pageY);
        ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function getNode(portElement) {
    return portElement.parentElement;
}

function onClickNode(e) {
    var nodePos = offset(e.target);
    dragOffset = [mousex-nodePos.left, mousey-nodePos.top];
    dragTarget = e.target;
}

function onReleaseNode(e) {
    dragTarget = null;
}

function onClickPort(e) {
    portOrigin = e.target;
}

function onReleasePort(e) {
    if (getNode(e.target) == getNode(portOrigin)) {

    } else {
        console.log("oof");
    }
}

function onMouseUpdate(e) {
    mousex = e.pageX;
    mousey = e.pageY;
}

function onMouseUp(e) {
    if (portOrigin) {
        portOrigin = null;
    }
}

document.onmousedown = mouseDown;
document.addEventListener("mousemove",mouseMove);
document.addEventListener("mouseup",onMouseUp);