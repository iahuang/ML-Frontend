var socket = io('http://10.99.1.79:8080');
socket.on('connect', function(){});
socket.on('event', function(data){});
socket.on('disconnect', function(){});

function buildPort(port) {
    var out = {};
    out.type = port.type;
    out.connected = port.connected;
    return out;
}
function buildPortset(pset) {
    var out = [];
    for (var i=0; i<pset.length; i++) {
        out.push(buildPort(pset[i]));
    }
    return out;
}
function buildNode(node) {
    var out = {};
    out.id = node.id;
    out.name = node.element.dataset.type;
    out.inputs = buildPortset(node.inputs);
    out.outputs = buildPortset(node.outputs);
    return out;
}

function buildGraph(nodes) {
    var graph = {};
    Object.keys(nodes).forEach(function(key) {
        let node = nodes[key];
        graph[key] = buildNode(node);
    });
    return graph;
}

function upload(nodes) {
    console.log("Uploading...");
    socket.emit('uploadgraph', buildGraph(nodes));
}

