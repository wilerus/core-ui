
import template from 'text-loader!../templates/listCanvas.html';

export default Marionette.View.extend({
    template: Handlebars.compile(template),

    regions: {
        contentRegion: '.js-content-region',
        scrollbarRegion: '.js-scrollbar-region'
    },

    className: 'demo-list-canvas__view',

    onRender() {
        this.showChildView('contentRegion', this.options.content);
        this.showChildView('scrollbarRegion', this.options.scrollbar);
    }
});
