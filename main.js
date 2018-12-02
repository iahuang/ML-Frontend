let nodeTemplate = `
<div class="node">

<p class="nodetext"> Wow this is a node </p>
<span id="inputs" class="portspan">
<div class="port" data-type="input"></div>
</span>
<span id="outputs" class="portspan">
<div class="port" data-type="output"></div>
</span>

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

function toolbarAdd() {
    var newNode = $(nodeTemplate);
    $(".sandbox").prepend(newNode);
    var nodeElement = newNode.get(0);
    nodeElement.dataset.id = currentNodeId;
    var nodeObject = new Node(nodeElement);
    nodes[String(currentNodeId)] = nodeObject;
    currentNodeId+=1;

    nodeElement.addEventListener("mousedown", onClickNode);
    nodeElement.addEventListener("mouseup", onReleaseNode);

    
    initPortsets(nodeObject, nodeElement.querySelector("#inputs"));
    initPortsets(nodeObject, nodeElement.querySelector("#outputs"));
}

function mouseDown(e) {
}

function redraw () {
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

function onClickPort(e) {
    portOrigin = e.target;
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
        if (e.target.dataset.type == "input") {
            console.log(e.target.dataset);
            targetNode.inputs[e.target.dataset.index].connected = {"id":originNode.id,"index":portOrigin.dataset.index};
            originNode.outputs[portOrigin.dataset.index].connected = {"id":targetNode.id,"index":e.target.dataset.index};
        } else {
            targetNode.outputs[e.target.dataset.index].connected = {"id":originNode.id,"index":portOrigin.dataset.index};
            originNode.inputs[portOrigin.dataset.index].connected = {"id":targetNode.id,"index":e.target.dataset.index};
        }
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