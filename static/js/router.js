define([
    'backbone'
], function(
    Backbone
){
    var initialize = function() {
        Backbone.history.start({pushState: true, root: '/'});
    };

    return {
        initialize: initialize
    };
});