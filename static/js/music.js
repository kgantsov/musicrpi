$(function() {

    var App = {
        mpd_status: {},
        socket: null,
        state: null,
        volume: 50,
        song_id: 0,
        playlist: null,

        init: function () {
            $.mobile.loading('show');

            WEB_SOCKET_SWF_LOCATION = '/static/js/socketio/WebSocketMain.swf';
            socket = io.connect('/player');

            socket.on('connect', App.socket_on_connect);
            socket.on('reconnect', App.socket_on_reconnect);

            socket.on('reconnecting', App.socket_on_reconnecting);
            socket.on('error', App.socket_on_error);

            socket.on('on_song_changed', App.on_song_changed);
            socket.on('on_stop', App.on_stop);
            socket.on('on_play', App.on_play);
            socket.on('on_pause', App.on_pause);
            socket.on('on_volume_changed', App.on_volume_changed);

            $('#play').tap(function () {
                App.play(App.song_id);
            });

            $('#stop').tap(App.stop);
            $('#prev').tap(App.prev);
            $('#next').tap(App.next);

            $('#music_list').on('tap', 'li a', function () {
                App.playSong($(this).attr('id'));
            });

            $('#volume').on('slidestop', function (event) {
                App.setVolume($('#volume').val());
            });

            $.mobile.loading('hide');
        },

        socket_on_connect: function() {

            socket.emit('playlist', function (status, data) {
                if (status && App.playlist === null) {
                    if (data['status'] == 'ok') {
                        App.playlist = data['playlist'];
                        $( "#songTemplate" ).tmpl(App.playlist)
                            .appendTo('#music_list');
                        $('#music_list').listview("refresh");
                    }
                }
                socket.emit('init', function () {
                });
            });
        },

        socket_on_reconnect: function() {
        },

        socket_on_reconnecting: function() {
        },

        socket_on_error: function(e) {
        },

        on_song_changed: function(song_id) {
            $('#music_list').find('a').parent().parent().removeClass('ui-btn-active');

            $('#' + song_id).parent().parent().addClass('ui-btn-active');

            App.song_id = song_id;
        },

        on_stop: function(song_id) {
            $('#play_icon')
                .addClass('ui-icon-play')
                .removeClass('ui-icon-pause');

            App.state = 'stop';
        },

        on_play: function(song_id) {
            $('#music_list').find('a').parent().parent()
                .removeClass('ui-btn-active');

            $('#' + song_id).parent().parent()
                .addClass('ui-btn-active');

            $('#play_icon')
                .addClass('ui-icon-pause')
                .removeClass('ui-icon-play');

            App.state = 'play';
        },

        on_pause: function(song_id) {
            $('#play_icon')
                .addClass('ui-icon-play')
                .removeClass('ui-icon-pause');

            App.state = 'pause';
        },

        on_volume_changed: function(volume) {
            $('#volume').val(volume);
            $('#volume').slider('refresh');

            App.volume = volume;
        },

        play: function(id) {
            if (App.state == 'play')
            {
                socket.emit('pause', function (status, data) {
                });
            } else {
                socket.emit('play', id, function (status, data) {
                });
            }
        },

        playSong: function(id) {
            socket.emit('play', id, function (status, data) {
            });
        },

        stop: function () {
            socket.emit('stop', function (status, data) {
            });
        },

        pause: function () {
            socket.emit('pause', function (status, data) {
            });
        },

        prev: function () {
            socket.emit('prev', function (status, data) {
            });
        },

        next: function () {
            socket.emit('next', function (status, data) {
            });
        },

        setVolume: function (volume) {
            socket.emit('set_volume', volume, function (status, data) {
            });
        },

        statusApply: function(mpd_status) {
            if (App.mpd_status === null) {
                App.mpd_status = mpd_status;
            }

            if (mpd_status['volume'] != App.mpd_status['volume']) {
                $('#volume').val(mpd_status['volume']);
                $('#volume').slider('refresh');
            }

            if (mpd_status['state'] != App.mpd_status['state']) {
                if (mpd_status['state'] == 'play') {
                    $('.ui-icon-play')
                        .addClass('ui-icon-pause')
                        .removeClass('ui-icon-play');
                } else {
                    $('.ui-icon-pause')
                        .addClass('ui-icon-play')
                        .removeClass('ui-icon-pause');
                }
            }

            if (mpd_status['state'] == 'play') {
                if (mpd_status['songid'] != App.mpd_status['songid']) {
                    $('#music_list').find('a').parent().parent()
                        .removeClass('ui-btn-active');

                    $('#' + mpd_status['songid']).parent().parent()
                        .addClass('ui-btn-active');
                }
            }

            if (mpd_status['state'] == 'play' ) {
                if (!$('#' + mpd_status['songid']).parent().parent().hasClass('ui-btn-active')) {
                    $('#' + mpd_status['songid']).parent().parent()
                        .addClass('ui-btn-active');
                }
            }

            App.mpd_status = mpd_status;
        }
    };

    App.init();
});
