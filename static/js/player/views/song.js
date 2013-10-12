/*global define*/
define([
    'jquery',
    'backbone',
    'text!player/templates/song.html'
], function ($, Backbone, song_template) {
    'use strict';

    var SongView = Backbone.View.extend({
        tagName: 'li',
        music_page: $('#music_page'),

        events: {
            "click": "play"
        },

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            var compiled_song_template = _.template(
                song_template,
                {song: this.model}
            );
            this.$el.html(compiled_song_template);
            this.$el.addClass('list-group-item song_item');

            if (this.model.attributes.active === true) {
                this.$el.addClass('active');
            }
            return this;
        },
        play: function() {
            console.log('dddddddd_' + this.model.attributes.id);
            this.music_page.trigger('song:changed', this.model.attributes.id);
            this.music_page.trigger('song:play', this.model.attributes.id);
            this.model.set('active', true);
        }
    });

    return SongView;
});