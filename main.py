from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, leave_room, emit, send
import time
import logging
import threading
import numpy as np
import random

app = Flask(__name__)
log = logging.getLogger('werkzeug')
log.disabled = True
socketio = SocketIO(app, cors_allowed_origins="*")

starting_games = {}

@app.route('/')
def index():
    return render_template('index.html',
                           title='Japanese Game',
                           css_files=["static/css/style.css"],
                           js_files=["static/javascript/maze.js",
                                     "static/javascript/guide.js",
                                     "static/javascript/index.js"])

@socketio.on('connect')
def on_join():
    join_room('lookingForGame')
    send('connection success')

@socketio.on('getNewGames')
def on_get_new_games():
    join_room('lookingForGame')

@socketio.on('abandonServer')
def on_abandon(data):
    game_name = data['gameName']
    if game_name in starting_games:
        del starting_games[game_name]
    join_room('lookingForGame')
    send('server abandoned')

@socketio.on('serverStart')
def on_server_start(data):
    leave_room('lookingForGame')
    game_name = data['gameName']
    starting_games[game_name] = time.time()
    join_room(game_name)
    send('game started')

@socketio.on('keepRoomAlive')
def on_keep_room(data):
    game_name = data['gameName']
    if game_name in starting_games:
        starting_games[game_name] = time.time()
        send('kept alive')


def generate_maze(dim):
    maze = np.ones((dim * 2 + 1, dim * 2 + 1))
    x, y = (0, 0)
    maze[2 * x + 1, 2 * y + 1] = 0
    stack = [(x, y)]
    while len(stack) > 0:
        x, y = stack[-1]
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        random.shuffle(directions)
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < dim and 0 <= ny < dim and maze[2 * nx + 1, 2 * ny + 1] == 1:
                maze[2 * nx + 1, 2 * ny + 1] = 0
                maze[2 * x + 1 + dx, 2 * y + 1 + dy] = 0
                stack.append((nx, ny))
                break
        else:
            stack.pop()
    maze[1, 0] = 0
    maze[-2, -1] = 0
    output = []
    for row in maze:
        output.append([bool(x == 1) for x in row])
    return output

@socketio.on('gameStart')
def on_game_start(data):
    leave_room('lookingForGame')
    game_name = data['gameName']
    join_room(game_name)
    emit('gameStart', generate_maze(15), to=game_name, broadcast=True)
    if game_name in starting_games:
        del starting_games[game_name]

@socketio.on('playerPosition')
def handle_message(data):
    game_name = data['gameName']
    emit('playerPosition', data, to=game_name, broadcast=True)

def periodic():
    global starting_games
    threading.Timer(1.0, periodic).start()
    current_time = time.time()
    to_remove = []
    for game in starting_games:
        if starting_games[game]+10 < current_time:
            to_remove.append(game)
    starting_games = {x: starting_games[x] for x in starting_games.keys() if x not in to_remove}
    socketio.emit('listGames', list(starting_games.keys()), to='lookingForGame')

if __name__ == "__main__":
    periodic()
    socketio.run(app, debug=True, host="0.0.0.0", allow_unsafe_werkzeug=True)
