
import template from 'text-loader!../templates/listSearchCanvas.html';

export default Marionette.View.extend({
    template: Handlebars.compile(template),

    regions: {
        searchRegion: '.js-search-region',
        contentRegion: '.js-content-region',
        scrollbarRegion: '.js-scrollbar-region'
    },

    className: 'demo-list-canvas__view_search',

    onRender() {
        this.showChildView('contentRegion', this.options.content);
        this.showChildView('scrollbarRegion', this.options.scrollbar);
        this.showChildView('searchRegion', this.options.search);
    }
});
