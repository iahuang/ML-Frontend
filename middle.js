function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

var socket = io('http://10.99.1.79:8080');
socket.on('connect', function(){});
socket.on('currentloss', function(data){
    document.getElementById("status").innerText = data;
    setPredict(true);
});
socket.on('prediction', function(data){
    var out = [];
    for (var i=0; i<data.length; i++) {
        let line = data[i];
        out.push(line.join(", "));
    }
    return out.join("\n");
});
socket.on('disconnect', function(){});

var files = {"xdata":null, "ydata":null};
var ready = false;
var ready2 = false;
var trained = false;

function setReady(r) {
    if (ready!=r) {
        document.getElementById("tbutton").classList.toggle("disabled");
        if (!ready) {
            document.getElementById("stats").setAttribute("style","");
        } else {
            document.getElementById("stats").style.display = "none";
        }
    }
    
    ready = r;
}
function setPredict(r) {
    if (ready2!=r) {
        document.getElementById("pbutton").classList.toggle("disabled");
        if (!ready2) {
            document.getElementById("pdata").setAttribute("style","");
            document.getElementById("plabel").setAttribute("style","");
        } else {
            document.getElementById("pdata").style.display = "none";
            document.getElementById("plabel").style.display = "none";
        }
    }
    ready2 = r;
}
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
    out.data = null;
    if (out.name=="mlp" || out.name=="mlp2") {
        out.data = node.element.querySelector("#valuefield").value;
    } else if (out.name=="auto") {
        out.data = parseFloat(node.element.querySelector("#valuefield").value)/100;
    }
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

function readFileInput(id, exit) {
    var i = document.getElementById(id);
    var f = i.files[0];
    var fr = new FileReader();
    fr.onload = function(e) {
        var text = fr.result;
        files[id] = text;
        if (exit) {
            exit();
        }
    }
    fr.readAsText(f);

    
}

function getShape(fData) {
    fData = $.trim(fData);
    let lines = fData.split("\n");
    return [lines.length,lines[0].split(",").length];
}

function upload(nodes) {
    console.log("Uploading...");
    readFileInput("xdata", upload2);

}
function upload2() {
    readFileInput("ydata", upload3);
}

function upload3() {
    setReady(true);
    document.getElementById("stats").innerText=`Input dimension: ${getShape(files.xdata)[1]} / Output dimension: ${getShape(files.ydata)[1]}`;

}

function send(nodes) {
    if (ready) {
        socket.emit('uploadgraph', [files.xdata, files.ydata, buildGraph(nodes)]);
    }
}

function predict(nodes){
    readFileInput("pdata",predict2);
}
function predict2() {
    socket.emit('predict', [files.pdata, buildGraph(nodes)]);
}
