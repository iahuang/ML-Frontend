let nodeTemplate = `
<div class="node" data-type="%dtype">
<span class="delete" id="xbutton">x</span>
<p class="nodetext"> %name </p>
<span id="inputs" class="portspan">
%inputs
</span>
<span id="outputs" class="portspan">
%outputs
</span>
%extras
</div>`;

let displayNames = {
    "mlp":"Simple Layer",
    "add":"Addition",
    "ewm":"Multiplication",
    "auto":"Auto-Encoder",
    "mlp2":"Multi-Layer"
}

let extras = {
    "mlp":`
<input placeholder="Layer size" style="margin-right: 10px;" id="valuefield"></input>
<div class="tooltip">
<p style="display: inline-block;">?</p>
<span class="tooltiptext"> The number of nodes in the layer. </span>
</div>`,
    "auto":`
<input placeholder="Compression ratio" style="margin-right: 10px;" id="valuefield"></input>
<div class="tooltip">
<p style="display: inline-block;">?</p>
<span class="tooltiptext"> What percentage of the input to use </span>
</div>`,
    "mlp2":`
<input placeholder="Parameters" style="margin-right: 10px;" id="valuefield"></input>
<div class="tooltip">
<p style="display: inline-block;">?</p>
<span class="tooltiptext"> Separated by commas </span>
</div>`
}

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
let canvOffset = offset(canvas);

ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(10, 10);
ctx.stroke();

var nodes = {};
var currentNodeId = 0;

class Node {
    constructor (element) {
        this.element = element;
        this.id = element.dataset.id;
        this.outputs = [];
        this.inputs = [];
    }
}

class Port {
    constructor (element, type) {
        this.element = element;
        this.type = type;
        this.connected = null;
    }
}

function offset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

function initPortsets(nodeObject, portSpan) {
    let ports = portSpan.getElementsByClassName("port");
    for (var i = 0; i<ports.length; i++) {
        var port = ports[i];
        port.addEventListener("mousedown", onClickPort);
        port.addEventListener("mouseup", onReleasePort);
        port.dataset.index = i;
        let portType = port.dataset.type;
        var portObject = new Port(port, portType);

        if (portType == "input") {
            nodeObject.inputs.push(portObject);
        } else {
            nodeObject.outputs.push(portObject);
        }
    }
}
function generateTemplate(name, a, b) {
    var out = nodeTemplate.replace("%dtype",name);
    out = out.replace("%inputs",'<div class="port" data-type="input"></div>'.repeat(a));
    out = out.replace("%outputs",'<div class="port" data-type="output"></div>'.repeat(b));
    if (extras[name]) {
        out = out.replace("%extras","<br>"+extras[name]);
    } else {
        out = out.replace("%extras","");
    }
    return out.replace("%name",displayNames[name]);
}
function toolbarAdd(name, a, b) {
    setPredict(false);
    var newNode = $(generateTemplate(name,a,b));
    $(".sandbox").prepend(newNode);
    var nodeElement = newNode.get(0);
    nodeElement.dataset.id = currentNodeId;
    var nodeObject = new Node(nodeElement);
    nodes[String(currentNodeId)] = nodeObject;
    currentNodeId+=1;

    nodeElement.addEventListener("mousedown", onClickNode);
    nodeElement.addEventListener("mouseup", onReleaseNode);

    nodeElement.querySelector("#xbutton").addEventListener("mousedown", onDeleteNode);
    initPortsets(nodeObject, nodeElement.querySelector("#inputs"));
    initPortsets(nodeObject, nodeElement.querySelector("#outputs"));
}

function mouseDown(e) {
}

function redraw () {
    canvOffset = offset(canvas);
    ctx.translate(-canvOffset.left, -canvOffset.top);
    Object.keys(nodes).forEach(function(key) {
        let node = nodes[key];
        for (var i=0; i<node.outputs.length; i++) {
            let portOrigin = node.outputs[i];
            let connected = portOrigin.connected;
            if (connected) {
                var targetPort = nodes[connected.id].inputs[connected.index];
                ctx.beginPath();
                let originPos = offset(portOrigin.element);
                ctx.moveTo(originPos.left+8, originPos.top+8);
                let targetPos = offset(targetPort.element);
                ctx.lineTo(targetPos.left+8, targetPos.top+8);
                ctx.stroke();
            }
        }
    });
    ctx.resetTransform();
}

function mouseMove(e) {
    canvOffset = offset(canvas);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dragTarget) {
        dragTarget.style.left = e.pageX-dragOffset[0];
        dragTarget.style.top = e.pageY-dragOffset[1];
    }
    if (portOrigin) {
        ctx.translate(-canvOffset.left, -canvOffset.top)
        ctx.beginPath();
        let originPos = offset(portOrigin);
        ctx.moveTo(originPos.left+8, originPos.top+8);
        ctx.lineTo(e.pageX, e.pageY);
        ctx.stroke();
    }
    ctx.resetTransform();
    redraw();
}

function getNode(element) {
    return nodes[element.dataset.id];
}

function onClickNode(e) {
    var nodePos = offset(e.target);
    dragOffset = [mousex-nodePos.left, mousey-nodePos.top];
    dragTarget = e.target;
}

function onReleaseNode(e) {
    dragTarget = null;
}

function onDeleteNode(e) {
    setPredict(false);
    var node = getNode(e.target.parentNode);
    console.log(node);
    for (var i=0;i<node.inputs.length;i++) {
        var port = node.inputs[i];
        if (port.connected) {
            releaseConnected(port);
        }  
        
    }
    for (var i=0;i<node.outputs.length;i++) {
        var port = node.outputs[i];
        if (port.connected) {
            releaseConnected(port);
        }
    }
    node.element.parentNode.removeChild(node.element);
    delete nodes[e.target.parentNode.dataset.id];

    
}

function onHoverNode(e) {

}

function getConnected(port) {
    if (port.type == "input") {
        return nodes[port.connected.id].outputs[port.connected.index];
    } else {
        return nodes[port.connected.id].inputs[port.connected.index];
    }
}

function releaseConnected(port) {
    if (port.type == "input") {
        nodes[port.connected.id].outputs[port.connected.index].connected = null;
    } else {
        nodes[port.connected.id].inputs[port.connected.index].connected = null;
    }
}

function onClickPort(e) {
    portOrigin = e.target;
}

function getPort(port) {
    if (port.dataset.type == "input") {
        return getNode(port.parentNode.parentNode).inputs[port.dataset.index];
    } else {
        return getNode(port.parentNode.parentNode).outputs[port.dataset.index];
    }
}

function onReleasePort(e) {
    var targetNodeElement = e.target.parentNode.parentNode;
    var originNodeElement = portOrigin.parentNode.parentNode;

    var targetNode = getNode(targetNodeElement);
    var originNode = getNode(originNodeElement);

    console.log(targetNode);
    console.log(originNode);

    if (targetNodeElement === originNodeElement) {
    } else if (e.target.dataset.type != portOrigin.dataset.type) {
        setPredict(false);
        var target = getPort(e.target);
        var origin = getPort(portOrigin);

        //console.log(e.target.dataset);
        if (target.connected) {
            releaseConnected(target);
            target.connected = null;
        }
        if (origin.connected) {
            releaseConnected(origin);
        }
        target.connected = {"id":originNode.id,"index":portOrigin.dataset.index};
        origin.connected = {"id":targetNode.id,"index":e.target.dataset.index};
    }
    mouseMove(e);
}

function onMouseUpdate(e) {
    mousex = e.pageX;
    mousey = e.pageY;
}

function onMouseUp(e) {
    if (portOrigin) {
        portOrigin = null;
    }
    mouseMove(e);
}

document.onmousedown = mouseDown;
document.addEventListener("mousemove",mouseMove);
document.addEventListener("mouseup",onMouseUp);