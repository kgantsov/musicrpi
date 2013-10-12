define([
    'jquery',
    'backbone',
    'socketio',
    'jquery_ui',
    'player/collections/songs',
    'player/models/song',
    'player/views/song',
    'text!player/templates/music_page.html'
], function (
    $,
    Backbone,
    io,
    slider,
    Songs,
    Song,
    SongView,
    music_page_template) {
    'use strict';

    var songs = new Songs();

    var WEB_SOCKET_SWF_LOCATION = '/static/js/socketio/WebSocketMain.swf';
    var App = Backbone.View.extend({
        el: $('#music_page'),
        music_list: $('#music_list'),
        songs: new Songs(),
        template: _.template(music_page_template),

        mpd_status: {},
        socket: io.connect('/player'),
        state: null,
        volume: 50,
        song_id: 0,
        is_shuffle: 0,
        is_repeat: 0,
        playlist: null,

        events: {
            "click #play": "play",
//            "click #pause": "pause",
            "click #stop": "stop",
            "click #prev": "prev",
            "click #next": "next",
            "click #shuffle": "shuffle",
            "click #repeat": "repeat",
            "socket:on_connected": "socket_on_connect",
            "song:changed": "song_changed",
            "song:play": "play",
            "song:on_stop": "on_stop",
            "song:on_play": "on_play",
            "song:on_pause": "on_pause",
            "song:on_volume_changed": "on_volume_changed",
            "song:on_shuffle": "on_shuffle",
            "song:on_repeat": "on_repeat"
        },

        initialize: function() {
            this.socket.on('connect', function() {
                $('#music_page').trigger('socket:on_connected')
            });

            this.socket.on('on_song_changed', function(id) {
                $('#music_page').trigger('song:changed', id);
            });
            this.socket.on('on_stop', function(id) {
                $('#music_page').trigger('song:on_stop', id);
            });
            this.socket.on('on_play', function(id) {
                $('#music_page').trigger('song:on_play', id);
            });
            this.socket.on('on_pause', function(id) {
                $('#music_page').trigger('song:on_pause', id);
            });
            this.socket.on('on_volume_changed', function(volume) {
                $('#music_page').trigger('song:on_volume_changed', volume);
            });
            this.socket.on('on_shuffle', function(id) {
                $('#music_page').trigger('song:on_shuffle', id);
            });
            this.socket.on('on_repeat', function(id) {
                $('#music_page').trigger('song:on_repeat', id);
            });

            this.listenTo(songs, 'add', this.add_song);
            this.listenTo(songs, 'reset', this.add_songs);
            this.listenTo(songs, 'all', this.render);
            this.listenTo(songs, 'change', this.render);
        },

        socket_on_connect: function() {
            var self = this;
            this.socket.emit('playlist', function (status, data) {
                if (status) {
                    if (data['status'] == 'ok') {
                        $.each(data['playlist'], function() {
                            songs.add(
                                new Song({
                                    id: this.id,
                                    title: this.title,
                                    artist: this.artist
                                })
                            );
                        }, this);
                    }
                }
                self.socket.emit('init');
            });
        },

        socket_on_reconnect: function() {
        },

        socket_on_reconnecting: function() {
        },

        socket_on_error: function() {
        },

        render: function() {
            var self = this;
            this.$el.html(this.template({
                state: this.state,
                volume: this.volume,
                is_shuffle: this.is_shuffle,
                is_repeat: this.is_repeat
            }));
            $("#volume").slider({
                orientation: "horisontal",
                range: "min",
                min: 0,
                max: 100,
                value: 60,
                slide: function (event, ui) {
                    self.socket.emit('set_volume', ui.value);
                }
            });
            this.add_songs();
            return this;
        },

        add_song: function(song) {
            var view = new SongView({ model: song });
            $('#music_list').append(view.render().el);
        },

        add_songs: function() {
            $('#music_list').html('');
            songs.each(this.add_song, this);
        },
        play: function(e, id) {
            if (typeof id !== "undefined" && id !== null) {
                this.socket.emit('play', id);
                this.state = 'play';
                $('#play span').removeClass('glyphicon-pause');
                $('#play span').addClass('glyphicon-play');
            } else {
                if (this.state == 'play') {
                    this.socket.emit('pause');
                    this.state = 'pause';
                    $('#play span').removeClass('glyphicon-pause');
                    $('#play span').addClass('glyphicon-play');
                } else {
                    this.socket.emit('play', this.song_id);
                    this.state = 'play';
                    $('#play span').removeClass('glyphicon-play');
                    $('#play span').addClass('glyphicon-pause');
                }
            }
        },
        stop: function () {
            this.socket.emit('stop');
            this.state = 'stop';
            $('#play span').removeClass('glyphicon-pause');
            $('#play span').addClass('glyphicon-play');
        },
        prev: function () {
            this.socket.emit('prev');
        },

        next: function () {
            this.socket.emit('next');
        },

        shuffle: function() {
            var shuffle = $('#shuffle').hasClass('active');
            if (shuffle) {
                $('#shuffle').removeClass('active');
            } else {
                $('#shuffle').addClass('active', !shuffle);
            }
            this.socket.emit('shuffle', !shuffle);
        },
        repeat: function() {
            var repeat = $('#repeat').hasClass('active');
            if (repeat) {
                $('#repeat').removeClass('active');
            } else {
                $('#repeat').addClass('active');
            }
            this.socket.emit('repeat', !repeat);
        },

        song_changed: function(e, id) {
            this.set_active_song(id);
        },

        set_active_song: function(id) {
            _.each(songs.active(), function(song) {
                if (song.id !== id) {
                    song.set('active', false);
                }
            }, this);
            var song = songs.get(id);
            if (song.attributes.active == false) {
                song.set('active', true);
            }
        },

        on_stop: function(id) {
            this.state = 'stop';
            $('#play span').removeClass('glyphicon-pause');
            $('#play span').addClass('glyphicon-play');
        },
        on_play: function(id) {
            this.state = 'play';
            $('#play span').removeClass('glyphicon-play');
            $('#play span').addClass('glyphicon-pause');
        },
        on_pause: function(id) {
            this.state = 'stop';
            $('#play span').removeClass('glyphicon-pause');
            $('#play span').addClass('glyphicon-play');
        },
        on_volume_changed: function(event, volume) {
            var volume = parseInt(volume, 10);
            $('#volume').slider({value: volume})
//            $('#volume').slider('refresh');

            App.volume = volume;
        },
        on_shuffle: function(event, random) {
            if (random === '1') {
                $('#shuffle').addClass('active');
                this.is_shuffle = true;
            } else {
                $('#shuffle').removeClass('active');
                this.is_shuffle = false;
            }
        },
        on_repeat: function(event, repeat) {
            if (repeat === '1') {
                $('#repeat').addClass('active');
                this.is_repeat = true;
            } else {
                $('#repeat').removeClass('active');
                this.is_repeat = false;
            }
        }
    });

    return App;
});