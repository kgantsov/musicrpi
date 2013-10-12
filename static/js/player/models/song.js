/*global define*/
define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var SongModel = Backbone.Model.extend({
        defaults:{
            active: false
        }
    });

    return SongModel;
});