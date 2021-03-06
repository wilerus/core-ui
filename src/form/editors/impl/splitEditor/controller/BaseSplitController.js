/**
 * Developer: Ksenia Kartvelishvili
 * Date: 27.11.2014
 * Copyright: 2009-2014 Comindware®
 *       All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Comindware
 *       The copyright notice above does not evidence any
 *       actual or intended publication of such source code.
 */

import ItemModel from '../model/ItemModel';
import ItemCollection from '../collection/ItemsCollection';

export default Marionette.Object.extend({
    initialize() {
        this.channel = new Backbone.Radio.Channel();
        this.channel.on('items:select', this.selectItemsByToolbar, this);
        this.channel.on('items:search', this.selectItemsByFilter, this);
        this.channel.on('items:move', this.moveItems, this);
        this.channel.on('items:update', this.updateMembers, this);
        this.channel.on('items:cancel', this.__cancelMembers, this);
        this.__createModel();
    },

    initItems() {
        this.createView();
        this.setValue();
    },

    updateMembers() {
        const allSelectedModels = _.clone(this.model.get('selected'));
        allSelectedModels.filter(null);
        this.options.selected = allSelectedModels.models.map(model => model.id);
        this.__fillDisplayText && this.__fillDisplayText();
        this.trigger('popup:ok');
    },

    __cancelMembers() {
        this.trigger('popup:cancel');
    },

    selectItemsByToolbar(type, value) {
        this.collectionFilterValue[type] = value;
        this.__applyFilter(type);
    },

    selectItemsByFilter(type, value) {
        this.collectionSearchValue[type] = value.toLowerCase();
        this.__applyFilter(type);
    },

    __applyFilter(type) {
        this.__createCollection(type);
        this.collection.selectNone();
        this.collection.unhighlight();

        const filterValue = this.collectionFilterValue[type];
        const searchValue = this.collectionSearchValue[type];

        if (!filterValue && !searchValue) {
            this.collection.filter(null);
            return;
        }
        this.collection.filter(model => {
            const modelType = model.get('type');
            const modelName = model.get('name');
            return (filterValue ? modelType && modelType === filterValue : true)
                && (searchValue ? modelName && modelName.toLowerCase().indexOf(searchValue) !== -1 : true);
        });
        searchValue && this.collection.highlight(searchValue);
    },

    moveItems(typeFrom, typeTo, all) {
        const modelsTo = this.model.get(typeTo);
        const allSelectedModels = _.clone(modelsTo);
        const modelsFrom = this.model.get(typeFrom);

        const maxQuantitySelected = this.model.get('maxQuantitySelected');
        if (maxQuantitySelected && typeTo === 'selected') {
            allSelectedModels.filter(null);
            if (allSelectedModels.length >= maxQuantitySelected) {
                return;
            }
        }

        let selected = all ? [].concat(modelsFrom.models) : Object.values(modelsFrom.selected);
        if (!all && !selected.length) {
            return;
        }

        if (maxQuantitySelected && typeTo === 'selected' && allSelectedModels) {
            if ((allSelectedModels.length + selected.length) > maxQuantitySelected) {
                selected = selected.slice(0, (maxQuantitySelected - allSelectedModels.length));
            }
        }

        const selectedIndexFrom = [];
        const selectedIndexTo = [];

        modelsFrom.selectNone && modelsFrom.selectNone();
        modelsTo.selectNone && modelsTo.selectNone();
        const newSelectedFragment = this.collectionSearchValue[typeTo];
        _.each(selected, model => {
            if (!(model instanceof ItemModel)) {
                return;
            }
            if (this.options.orderEnabled) {
                if (typeTo === 'selected') {
                    const newOrder = modelsTo.length
                        ? modelsTo.at(modelsTo.length - 1).get('order') + 1
                        : 1;
                    model.set('order', newOrder);
                } else {
                    model.unset('order');
                }
            }
            !all && selectedIndexFrom.push(modelsFrom.indexOf(model));
            modelsFrom.remove(model);
            modelsTo.add(model, { delayed: false });
            model.unhighlight();
            if (newSelectedFragment) {
                model.highlight(newSelectedFragment);
            }
            if (!all) {
                selectedIndexTo.push(modelsTo.indexOf(model));
                model.select();
            }
        }, this);

        if (all) {
            return;
        }
        this.view.eventAggregator[typeTo].scrollTo(modelsTo.at(Math.min.apply(0, selectedIndexTo)));

        const nextIndexFrom = Math.min(Math.min.apply(0, selectedIndexFrom), modelsFrom.length - 1);
        if (nextIndexFrom < 0) {
            return;
        }
        const selectedElemFrom = modelsFrom.at(nextIndexFrom);
        selectedElemFrom.select();
        this.view.eventAggregator[typeFrom].scrollTo(selectedElemFrom);
    },

    __createCollection(type) {
        this.collection = this.model.get(type);
    },

    __fillInModel() {
        throw new Error('fillInModel is not implemented!');
    },

    __createModel() {
        this.model = new Backbone.Model();

        const availableModels = new ItemCollection(new Backbone.Collection([], {
            model: ItemModel
        }), {
            selectableBehavior: 'multi',
            comparator: Core.utils.helpers.comparatorFor(Core.utils.comparators.stringComparator2Asc, 'name')
        });
        if (this.groupConfig) {
            availableModels.group(this.groupConfig);
        }
        this.model.set('available', availableModels);

        const selectedComparator = this.options.orderEnabled
            ? Core.utils.helpers.comparatorFor(Core.utils.comparators.numberComparator2Asc, 'order')
            : Core.utils.helpers.comparatorFor(Core.utils.comparators.stringComparator2Asc, 'name');

        const selectedModels = new ItemCollection(new Backbone.Collection([], {
            model: ItemModel
        }), {
            selectableBehavior: 'multi',
            comparator: selectedComparator
        });
        this.model.set('selected', selectedModels);

        this.model.set({
            maxQuantitySelected: this.options.maxQuantitySelected
        });

        this.model.set('allowRemove', this.options.allowRemove);
        this.__fillInModel();
    },

    setValue() {
        this.collectionFilterValue = [];
        this.collectionSearchValue = [];
        this.__applyFilter('available');
        this.__applyFilter('selected');

        Promise.resolve(this.model.get('items')).then(oldItems => {
            const items = _.clone(oldItems);
            this.options.exclude.forEach(id => {
                if (items[id]) {
                    delete items[id];
                }
            });
            const selected = this.options.selected;
            let selectedItems = selected
                ? this.options.selected.map(id => {
                    const model = items[id];
                    delete items[id];
                    return model;
                })
                : [];

            const availableItems = Object.values(items);
            let i = 1;
            selectedItems = _.chain(selectedItems)
                .filter(item => item !== undefined).map(item => {
                    if (this.options.orderEnabled) {
                        item.order = i++;
                    }
                    return item;
                }).value();

            this.model.get('available').reset(availableItems);
            this.model.get('selected').reset(selectedItems);
        });
    }
});
