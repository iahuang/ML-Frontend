from aiohttp import web
import socketio

sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

@sio.on('connect')
def connect(sid, environ):
    print("connect ", sid)

@sio.on('uploadgraph')
async def message(sid, data):
    print("message ", data)
    #await sio.emit('reply', room=sid)

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

async def handle(request):
    print(request);
    return web.Response(text="oofus");

app.add_route(web.get("/upload", handle))

if __name__ == '__main__':
    web.run_app(app)