/**
 * Developer: Ksenia Kartvelishvili
 * Date: 8/2/2017
 * Copyright: 2009-2017 Ksenia Kartvelishvili®
 *       All Rights Reserved
 * Published under the MIT license
 */

import { Handlebars } from 'lib';
import { helpers } from 'utils';
import template from './group.hbs';
import LayoutBehavior from '../behaviors/LayoutBehavior';

const defaults = {
    collapsed: false
};

const classes = {
    CLASS_NAME: 'layout__group',
    COLLAPSED_CLASS: 'layout__group-collapsed__button'
};

export default Marionette.LayoutView.extend({
    initialize(options) {
        helpers.ensureOption(options, 'view');

        this.model = new Backbone.Model(Object.assign(defaults, options));
        this.listenTo(this.model, 'change:collapsed', this.__onCollapsedChange);
    },

    template: Handlebars.compile(template),

    className: classes.CLASS_NAME,

    regions: {
        containerRegion: '.js-container-region'
    },

    behaviors: {
        LayoutBehavior: {
            behaviorClass: LayoutBehavior
        }
    },

    ui: {
        toggleCollapseButton: '.js-toggle',
    },

    events: {
        'click @ui.toggleCollapseButton': '__toggleCollapse'
    },

    onShow() {
        const view = this.model.get('view');
        if (view) {
            this.containerRegion.show(view);
        }
        this.__updateState();
    },

    update() {
        const view = this.model.get('view');
        if (view.update) {
            view.update();
        }
        this.__updateState();
    },

    __toggleCollapse() {
        this.model.set('collapsed', !this.model.get('collapsed'));
        return false;
    },

    __onCollapsedChange(model, collapsed) {
        this.ui.toggleCollapseButton.toggleClass(classes.COLLAPSED_CLASS, collapsed);
        if (collapsed) {
            this.containerRegion.$el.hide(200);
        } else {
            this.containerRegion.$el.show(200);
        }
        return false;
    }
});
