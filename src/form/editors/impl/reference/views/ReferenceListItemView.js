
import { Handlebars } from 'lib';
import template from '../templates/referenceListItem.hbs';
import list from 'list';

const classes = {
    BASE: 'multiselect-i',
    SELECTED: 'editor_checked'
};

export default Marionette.ItemView.extend({
    className() {
        return `dd-list__i${this.options.showCheckboxes ? ' dev_dd-list__i_with_checkbox' : ''}`;
    },

    behaviors: {
        ListItemViewBehavior: {
            behaviorClass: list.views.behaviors.ListItemViewBehavior,
            multiSelect: true
        }
    },

    template: Handlebars.compile(template),

    templateHelpers() {
        return {
            text: this.options.getDisplayText(this.model.toJSON()),
            showCheckboxes: this.options.showCheckboxes
        };
    },

    onRender() {
        if (this.model.selected) {
            this.__markSelected();
        } else {
            this.__markDeselected();
        }
    },

    modelEvents: {
        selected: '__markSelected',
        deselected: '__markDeselected'
    },

    __markSelected() {
        this.$el.find('.js-checkbox') && this.$el.find('.js-checkbox').addClass(classes.SELECTED);
    },

    __markDeselected() {
        this.$el.find('.js-checkbox') && this.$el.find('.js-checkbox').removeClass(classes.SELECTED);
    }
});
