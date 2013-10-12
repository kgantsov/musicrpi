define([
    'jquery',
    'underscore',
    'backbone',
    'player/models/song'
], function ($, _, Backbone, Song) {
    'use strict';

    var SongsList = Backbone.Collection.extend({
        model: Song,

        active: function () {
            return this.filter(function (song) {
                return song.get('active');
            });
        }
    });

    return SongsList;
});
