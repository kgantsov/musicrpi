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
            self.mpd_status = self.client.status()
            while True:
                mpd_status = self.client.status()

                if 'songid' in self.mpd_status and 'songid' in mpd_status:
                    if self.mpd_status['songid'] != mpd_status['songid']:
                        self.broadcast_event('on_song_changed', mpd_status['songid'])

                self.mpd_status = mpd_status
                gevent.sleep(1)

        self.spawn(send_status)

    def on_init(self):
        mpd_status = self.client.status()
        self.broadcast_event('on_song_changed', mpd_status['songid'])
        self.get_emit_state_change(
            mpd_status['state'],
            mpd_status['songid'],
        )
        self.broadcast_event('on_volume_changed', mpd_status['volume'])

    def get_emit_state_change(self, state, songid):
        events = {
            'play': 'on_play',
            'stop': 'on_stop',
            'pause': 'on_pause',
        }
        if state not in events:
            return

        self.broadcast_event(events[state], songid)

    def on_play(self, id):
        self.client.play(id)
        status = self.client.status()
        self.broadcast_event('on_play', id)
        return True, status

    def on_stop(self):
        self.client.stop()
        status = self.client.status()
        self.broadcast_event('on_stop', status['songid'])
        return True, status

    def on_next(self):
        self.client.next()
        status = self.client.status()

        if status['state'] == 'play':
            self.broadcast_event('on_song_changed', status['songid'])
        return True, status

    def on_prev(self):
        self.client.previous()
        status = self.client.status()

        if status['state'] == 'play':
            self.broadcast_event('on_song_changed', status['songid'])
        return True, status

    def on_pause(self):
        self.client.pause()
        status = self.client.status()
        self.broadcast_event('on_pause', status['songid'])
        return True, status

    def on_set_volume(self, volume):
        self.client.setvol(volume)
        status = self.client.status()
        self.broadcast_event('on_volume_changed', volume)
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
