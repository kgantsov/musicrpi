requirejs.config({
    baseUrl: '/static/js/',
    paths: {
        jquery:          'libs/jquery',
        underscore:      'libs/underscore',
        backbone:        'libs/backbone',
        text:            'libs/require/text',
        goog:            'libs/require/goog',
        async:           'libs/require/async',
        propertyParser : 'libs/require/propertyParser',
        socketio:        'socketio/socket.io.min',
        jquery_ui:       'jquery-ui-1.9.2.custom.min'
        /*
        font:   'require/font',
        json:   'require/json',
        noext:  'require/noext',
        mdown:  'require/mdown',
        markdownConverter : 'require/Markdown.Converter',
        */
    },
    shim: {
        'socketio': {
          exports: 'io'
        },
        backbone: {
            deps: ['jquery','underscore'],
            exports: 'Backbone'
        }
    }
});

require(['router'], function(Router) {
    console.log('df');
    Router.initialize();
});

require(['player/views/app'], function(App) {
    new App().render();
});
