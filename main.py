#!/usr/bin/env python

import mpd
import os
import gevent

from socketio import socketio_manage
from socketio.namespace import BaseNamespace
from socketio.mixins import RoomsMixin, BroadcastMixin
from gevent import monkey

from flask import Flask, Response, request, render_template

monkey.patch_all()

app = Flask(__name__)
app.debug = True


@app.route('/')
def index():
    return render_template('main.html')


class PlayerNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):
    nicknames = []

    def initialize(self):
        self.logger = app.logger
        self.log("Socketio session started")

        self.client = mpd.MPDClient()
        self.client.connect("localhost", 6600)
        # self.client.repeat(1)
        # self.client.clear()
        # self.client.rm('mysongs')

        songs_list = [x['file'] for x in self.client.listall() if 'file' in x]

        if not self.client.playlistid():
            for i, song in enumerate(songs_list):
                print self.client.addid(song, i)
            # self.client.save('mysongs')
        # else:
        #     self.client.load('mysongs')
        self.status_update()

    def log(self, message):
        self.logger.info("[{0}] {1}".format(self.socket.sessid, message))

    def status_update(self):
        def send_status():
            self.status = self.client.status()
            while True:
                status = self.client.status()

                if 'songid' in self.status and 'songid' in status:
                    if self.status['songid'] != status['songid']:
                        self.broadcast_event('on_song_changed', status['songid'])

                self.status = status
                gevent.sleep(1)

        self.spawn(send_status)

    def on_init(self):
        status = self.client.status()
        songid = status['songid'] if 'songid' in status else 0

        self.broadcast_event('on_song_changed', songid)
        self.get_emit_state_change(
            status['state'],
            songid,
        )

        self.broadcast_event('on_volume_changed', status['volume'])
        self.broadcast_event('on_shuffle', status['random'])
        self.broadcast_event('on_repeat', status['repeat'])

    def get_emit_state_change(self, state, songid):
        events = {
            'play': 'on_play',
            'stop': 'on_stop',
            'pause': 'on_pause',
        }
        if state not in events:
            return

        self.broadcast_event(events[state], songid)

    def on_play(self, id=None):
        if id:
            self.client.play(id)
        else:
            self.client.play()

        status = self.client.status()
        self.broadcast_event('on_play', status['songid'])
        return True, status

    def on_stop(self):
        self.client.stop()
        status = self.client.status()
        songid = status['songid'] if 'songid' in status else 0
        self.broadcast_event('on_stop', songid)
        return True, status

    def on_next(self):
        status = self.client.status()

        if status['state'] == 'play':
            self.client.next()
            self.broadcast_event('on_song_changed', status['songid'])
        return True, status

    def on_prev(self):
        status = self.client.status()

        if status['state'] == 'play':
            self.client.previous()
            self.broadcast_event('on_song_changed', status['songid'])
        return True, status

    def on_pause(self):
        self.client.pause()
        status = self.client.status()
        self.broadcast_event('on_pause', status['songid'])
        return True, status

    def on_shuffle(self, shuffle):
        shuffle = int(shuffle)
        self.client.random(shuffle)
        status = self.client.status()
        return True, status

    def on_repeat(self, repeat):
        repeat = int(repeat)
        self.client.repeat(repeat)
        status = self.client.status()
        return True, status

    def on_set_volume(self, volume):
        volume = int(volume)
        if 0 <= volume <= 100:
            self.client.setvol(volume)

        status = self.client.status()
        self.broadcast_event('on_volume_changed', status['volume'])
        return True, status

    def on_playlist(self):
        playlist = []
        playlistid = self.client.playlistid()

        for song in playlistid:
            if 'artist' in song and 'title' in song:
                artist, title = song['artist'], song['title']
            else:
                fname, extension = os.path.splitext(song['file'])
                artist, title = fname.replace('\xe2\x80\x93', '-').split('-')[:2]
                artist = artist.strip().capitalize().decode('utf8')
                title = title.strip().capitalize().decode('utf8')

            playlist.append({
                'id': song['id'],
                'artist': artist,
                'title': title,
            })

        return True, {'status': 'ok', 'playlist': playlist}


@app.route('/socket.io/<path:remaining>')
def socketio(remaining):
    try:
        socketio_manage(request.environ, {'/player': PlayerNamespace}, request)
    except:
        app.logger.error("Exception while handling socketio connection", exc_info=True)

    return Response()


if __name__ == '__main__':
    app.run()
