
import { helpers } from 'utils';
import template from './templates/tabLayout.hbs';
import HeaderView from './HeaderView';
import StepperView from './StepperView';
import LayoutBehavior from '../behaviors/LayoutBehavior';

const classes = {
    CLASS_NAME: 'layout__tab-layout',
    PANEL_REGION: 'layout__tab-layout__panel-region'
};

export default Marionette.LayoutView.extend({
    initialize(options) {
        helpers.ensureOption(options, 'tabs');

        this.__tabsCollection = options.tabs;
        if (!(this.__tabsCollection instanceof Backbone.Collection)) {
            this.__tabsCollection = new Backbone.Collection(this.__tabsCollection);
        }
        this.__tabsCollection.each(model => {
            if (model.get('enabled') === undefined) {
                model.set('enabled', true);
            }
        });
        const selectedTab = this.__findSelectedTab();
        if (!selectedTab) {
            this.selectTab(this.__tabsCollection.at(0).id);
            this.selectTabIndex = 0;
        } else {
            this.__getSelectedTabIndex(selectedTab);
        }

        this.listenTo(this.__tabsCollection, 'change:selected', this.__onSelectedChanged);

        this.tabs = options.tabs.reduce((s, a) => {
            s[a.id] = a.view;
            return s;
        }, {});
    },

    template: Handlebars.compile(template),

    className() {
        return `${classes.CLASS_NAME} ${this.getOption('bodyClass')}`;
    },

    regions: {
        headerRegion: '.js-header-region',
        stepperRegion: '.js-stepper-region'
    },

    ui: {
        panelContainer: '.js-panel-container',
        buttonMoveNext: '.js-button_move-next',
        buttonMovePrevious: '.js-button_move-previous'
    },

    events: {
        'click @ui.buttonMoveNext': 'moveToNextTab',
        'click @ui.buttonMovePrevious': 'moveToPreviousTab'
    },

    behaviors: {
        LayoutBehavior: {
            behaviorClass: LayoutBehavior
        }
    },

    onShow() {
        const headerView = new HeaderView({
            collection: this.__tabsCollection,
            headerClass: this.getOption('headerClass')
        });
        this.listenTo(headerView, 'select', this.__handleSelect);
        this.headerRegion.show(headerView);

        this.__tabsCollection.each(tabModel => {
            const $regionEl = $('<div></div>').addClass(classes.PANEL_REGION);
            this.ui.panelContainer.append($regionEl);
            const region = this.addRegion(`${tabModel.id}TabRegion`, {
                el: $regionEl
            });
            region.show(tabModel.get('view'));
            tabModel.set({
                region,
                $regionEl
            });
            this.__updateTabRegion(tabModel);
        });
        this.__updateState();
        if (this.getOption('showStepper')) {
            const stepperView = new StepperView({ collection: this.__tabsCollection });
            this.stepperRegion.show(stepperView);
            this.listenTo(stepperView, 'stepper:item:selected', this.__handleStepperSelect);
        }
        if (!this.getOption('showMoveButtons')) {
            this.ui.buttonMoveNext.hide();
            this.ui.buttonMovePrevious.hide();
        }
    },

    update() {
        Object.values(this.tabs).forEach(view => {
            if (view.update) {
                view.update();
            }
        });
        this.__updateState();
    },

    getViewById(tabId) {
        return this.__findTab(tabId).get('view');
    },

    selectTab(tabId) {
        const tab = this.__findTab(tabId);
        if (tab.get('selected')) {
            return;
        }
        const selectedTab = this.__findSelectedTab();
        if (selectedTab) {
            if (this.getOption('validateBeforeMove')) {
                const errors = !selectedTab.get('view').form || selectedTab.get('view').form.validate();
                this.setTabError(selectedTab.id, errors);
                if (errors) {
                    return false;
                }
            }
            selectedTab.set('selected', false);
            this.selectTabIndex = this.__getSelectedTabIndex(tab);
        }
        if (tab.get('enabled')) {
            tab.set('selected', true);
        }
    },

    setEnabled(tabId, enabled) {
        this.__findTab(tabId).set({
            enabled
        });
    },

    setTabError(tabId, error) {
        this.__findTab(tabId).set({ error });
    },

    moveToNextTab() {
        let errors = null;
        if (this.getOption('validateBeforeMove')) {
            const selectedTab = this.__findSelectedTab();
            errors = !selectedTab.get('view').form || selectedTab.get('view').form.validate();
            return this.setTabError(selectedTab.id, errors);
        }
        if (!errors) {
            let newIndex = this.selectTabIndex + 1;
            if (this.__tabsCollection.length - 1 < newIndex) {
                newIndex = 0;
            }
            const newTab = this.__tabsCollection.at(newIndex);
            if (newTab.get('enabled')) {
                this.selectTab(newTab.id);
            } else {
                this.selectTabIndex++;
                this.moveToNextTab();
            }
        }
    },

    moveToPreviousTab() {
        let errors = null;
        if (this.getOption('validateBeforeMove')) {
            const selectedTab = this.__findSelectedTab();
            errors = !selectedTab.get('view').form || selectedTab.get('view').form.validate();
            return this.setTabError(selectedTab.id, errors);
        }
        if (!errors) {
            let newIndex = this.selectTabIndex - 1;
            if (newIndex < 0) {
                newIndex = this.__tabsCollection.length - 1;
            }
            const newTab = this.__tabsCollection.at(newIndex);
            if (newTab.get('enabled')) {
                this.selectTab(this.__tabsCollection.at(newIndex).id);
            } else {
                this.selectTabIndex--;
                this.moveToPreviousTab();
            }
        }
    },

    __findSelectedTab() {
        return this.__tabsCollection.find(x => x.get('selected'));
    },

    __getSelectedTabIndex(model) {
        return this.__tabsCollection.indexOf(model);
    },

    __findTab(tabId) {
        helpers.assertArgumentNotFalsy(tabId, 'tabId');

        const tabModel = this.__tabsCollection.find(x => x.id === tabId);
        if (!tabModel) {
            helpers.throwInvalidOperationError(`TabLayout: tab '${tabId}' is not present in the collection.`);
        }
        return tabModel;
    },

    __handleSelect(model) {
        this.selectTab(model.id);
    },

    __onSelectedChanged(model) {
        this.__updateTabRegion(model);
    },

    __updateTabRegion(model) {
        const selected = model.get('selected');
        model.get('$regionEl').toggle(Boolean(selected));
    },

    __handleStepperSelect(model) {
        this.__handleSelect(model);
    }
});
