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
            socket.on('on_shuffle', App.on_shuffle);
            socket.on('on_repeat', App.on_repeat);

            $('#play').tap(App.play);
            $('#stop').tap(App.stop);
            $('#prev').tap(App.prev);
            $('#next').tap(App.next);
            $('#shuffle').tap(App.shuffle);
            $('#repeat').tap(App.repeat);

            $('#music_list').on('tap', 'li a', function () {
                App.playSong($(this).attr('id'));
            });

            $('#volume').on('slidestop', function (event) {
                App.setVolume($('#volume').val());
            });

            $(document).bind('keydown', 'Shift+left', App.prev);
            $(document).bind('keydown', 'Shift+right', App.next);
            $(document).bind('keydown', 'Shift+space', App.play);
            $(document).bind('keydown', 'Shift+up', App.volumeUp);
            $(document).bind('keydown', 'Shift+down', App.volumeDown);
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

        on_shuffle: function(random) {
            if (random === '1') {
                $('#shuffle').addClass('ui-btn-active');
            }
        },

        on_repeat: function(repeat) {
            if (repeat === '1') {
                $('#repeat').addClass('ui-btn-active');
            }
        },

        on_volume_changed: function(volume) {
            volume = parseInt(volume, 10);
            $('#volume').val(volume);
            $('#volume').slider('refresh');

            App.volume = volume;
        },

        play: function() {
            if (App.state == 'play')
            {
                socket.emit('pause', function (status, data) {
                });
            } else {
                socket.emit('play', function (status, data) {
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

        shuffle: function () {
            shuffle = $('#shuffle').hasClass('ui-btn-active');
            if (shuffle) {
                $('#shuffle').removeClass('ui-btn-active');
            } else {
                $('#shuffle').addClass('ui-btn-active');
            }
            socket.emit('shuffle', !shuffle, function (status, data) {
            });
        },

        repeat: function () {
            repeat = $('#repeat').hasClass('ui-btn-active');
            if (repeat) {
                $('#repeat').removeClass('ui-btn-active');
            } else {
                $('#repeat').addClass('ui-btn-active');
            }
            socket.emit('repeat', !repeat, function (status, data) {
            });
        },

        setVolume: function (volume) {
            socket.emit('set_volume', volume, function (status, data) {
            });
        },

        volumeUp: function() {
            var newVolume = App.volume + 5;
            if (newVolume > 100) {
                newVolume = 100;
            }

            App.setVolume(newVolume);
        },

        volumeDown: function() {
            var newVolume = App.volume - 5;
            if (newVolume < 0) {
                newVolume = 0;
            }

            App.setVolume(newVolume);
        }
    };

    App.init();
});
