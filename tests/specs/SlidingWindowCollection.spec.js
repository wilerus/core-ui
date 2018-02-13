
/*eslint-ignore*/

import Chance from 'chance';
import core from 'coreApi';
import { expectCollectionsToBeEqual } from '../utils/helpers';
import { addChanceMixins } from '../utils/testData';

const chance = new Chance();
addChanceMixins(chance);

describe('SlidingWindowCollection', () => {
    beforeEach(function() {
        this.tasks = _.times(10, () => chance.task());
    });

    describe('When initializing', () => {
        it('should have position 0 and default window size', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection);

            expect(windowedCollection.length).toEqual(0);
            expect(windowedCollection.models.length).toEqual(0);
        });
    });

    describe('When setting window size', () => {
        it('should have correct element count', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection);

            windowedCollection.updateWindowSize(3);

            expectCollectionsToBeEqual(windowedCollection, collection.first(3));
        });
    });

    describe('When setting position', () => {
        it('should have correct elements offset', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection);

            windowedCollection.updateWindowSize(3);
            windowedCollection.updatePosition(3);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(3).first(3).value());
        });
    });

    describe('When dramatically changing position', () => {
        it('should trigger reset', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 3 });
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            windowedCollection.on('reset', resetCallback);
            windowedCollection.on('add', addCallback);
            windowedCollection.on('remove', removeCallback);

            windowedCollection.updatePosition(6);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(6).first(3).value());
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });
    });

    describe('When slightly changing position', () => {
        it('should trigger add/remove going +1', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 3 });
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            windowedCollection.on('reset', resetCallback);
            windowedCollection.on('add', addCallback);
            windowedCollection.on('remove', removeCallback);

            windowedCollection.updatePosition(1);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(1).first(3).value());
            expect(resetCallback).not.toHaveBeenCalled();
            expect(addCallback).toHaveBeenCalledTimes(1);
            expect(removeCallback).toHaveBeenCalledTimes(1);
        });

        it('should trigger add/remove going -1', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { position: 2, windowSize: 3 });
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            windowedCollection.on('reset', resetCallback);
            windowedCollection.on('add', addCallback);
            windowedCollection.on('remove', removeCallback);

            windowedCollection.updatePosition(1);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(1).first(3).value());
            expect(resetCallback).not.toHaveBeenCalled();
            expect(addCallback).toHaveBeenCalledTimes(1);
            expect(removeCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('When window cannot be filled complete', () => {
        it('should trim window if window size is too big', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 8 });

            windowedCollection.updateWindowSize(11);

            expectCollectionsToBeEqual(windowedCollection, collection);
            expect(windowedCollection.state.position).toEqual(0);
        });

        it('should return back to normal after window trimming', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 8 });

            windowedCollection.updateWindowSize(15);
            windowedCollection.updateWindowSize(3);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(0).first(3).value());
            expect(windowedCollection.state.position).toEqual(0);
        });
    });

    describe('When near the top border', () => {
        it('should trim window if there are no items ahead', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 3 });

            windowedCollection.updatePosition(8);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(8).first(2).value());
        });

        it('should return back to normal after window trimming', function() {
            const collection = new Backbone.Collection(this.tasks);
            const windowedCollection = new core.collections.SlidingWindowCollection(collection, { windowSize: 3 });

            windowedCollection.updatePosition(8);
            windowedCollection.updatePosition(3);

            expectCollectionsToBeEqual(windowedCollection, collection.chain().rest(3).first(3).value());
        });
    });
});
