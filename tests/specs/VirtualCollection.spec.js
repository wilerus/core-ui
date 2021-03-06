/**
 * Developer: Stepan Burguchev
 * Date: 6/14/2016
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

/*eslint-ignore*/

import Chance from 'chance';
import core from 'coreApi';
import { expectCollectionsToBeEqual, expectToHaveSameMembers } from '../utils/helpers';
import { TaskModel, addChanceMixins } from '../utils/testData';

const chance = new Chance();
const repository = addChanceMixins(chance);

describe('VirtualCollection', () => {
    const assigneeGrouping = {
        modelFactory(model) {
            return model.get('assignee');
        },
        comparator(model) {
            return model.get('assignee').id;
        },
        iterator(model) {
            return model.get('assignee').get('name');
        },
        affectedAttributes: [
            'assignee'
        ]
    };

    function generateTask(attributes) {
        return new TaskModel(chance.task(attributes));
    }

    function generateTaskArray(len, fn) {
        if (!fn) {
            fn = () => {};
        }
        return _.times(len, n => generateTask(fn(n)));
    }

    function createFixture(list, virtualCollectionOptions, collectionOptions) {
        const options = _.extend({ model: TaskModel }, collectionOptions);
        const collection = new Backbone.Collection(list, options);
        const virtualCollection = new core.collections.VirtualCollection(collection, virtualCollectionOptions);
        return {
            collection,
            virtualCollection
        };
    }

    describe('When grouping tree collection', () => {
        it('should apply comparator to all levels of the tree', () => {
            const count = 3;
            const tasks = generateTaskArray(count, n => ({
                assignee: repository.users[n % 2],
                title: String(count - n)
            }));
            tasks[1].children = new Backbone.Collection([
                generateTask({
                    title: '2'
                }),
                generateTask({
                    title: '1'
                })
            ]);
            const { collection, virtualCollection } = createFixture(tasks, {
                grouping: [ assigneeGrouping ],
                comparator(model) {
                    return model.get('title');
                }
            });

            // all levels of the tree must be in correct order
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(2),
                collection.at(0),
                virtualCollection.at(3),
                collection.at(1),
                collection.at(1).children.at(0),
                collection.at(1).children.at(1)
            ]);
        });
    });

    describe('When no grouping is set', () => {
        it('should pass through default collection', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(50));

            expectCollectionsToBeEqual(virtualCollection, collection);
        });
    });

    describe('When grouping plain list', () => {
        it('should group by iterator', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(4, n => ({ assignee: repository.users[n % 2] })), {
                grouping: [ assigneeGrouping ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(2),
                virtualCollection.at(3),
                collection.at(1),
                collection.at(3)
            ]);
        });

        it('should sort groups with comparator', () => {
            const user1 = chance.user({ name: 'Ken' });
            const user2 = chance.user({ name: 'Ben' });
            const { virtualCollection } = createFixture(generateTaskArray(4, n => ({ assignee: n % 2 ? user1 : user2 })), {
                grouping: [
                    {
                        modelFactory(model) {
                            return model.get('assignee');
                        },
                        comparator(model) {
                            return model.get('assignee').get('name');
                        },
                        iterator(model) {
                            return model.get('assignee').get('id');
                        }
                    }
                ]
            });

            expect(virtualCollection.at(0).id).toEqual(user2.id, 'Ben goes first');
            expect(virtualCollection.at(3).id).toEqual(user1.id, 'Then goes Ken');
        });

        it('should sort items within a group with comparator function', () => {
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`,
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ],
                comparator(model) {
                    return model.get('title');
                }
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(2),
                collection.at(0),
                virtualCollection.at(3),
                collection.at(3),
                collection.at(1)
            ]);
        });

        it('should accept group iterator as a model attrubute name', () => {
            const count = 2;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`
            })), {
                grouping: [
                    {
                        modelFactory(model) {
                            return new Backbone.Model({ title: model.get('title') });
                        },
                        comparator(model) {
                            return model.get('title');
                        },
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                virtualCollection.at(2),
                collection.at(0)
            ]);
        });

        it('should accept group comparator as a model attrubute name', () => {
            const count = 2;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`
            })), {
                grouping: [
                    {
                        modelFactory(model) {
                            return new Backbone.Model({ title: model.get('title') });
                        },
                        comparator: 'title',
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                virtualCollection.at(2),
                collection.at(0)
            ]);
        });

        it('should accept group modelFactory as a model attrubute name', () => {
            const count = 2;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`
            })), {
                grouping: [
                    {
                        modelFactory: 'title',
                        comparator: 'title',
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                virtualCollection.at(2),
                collection.at(0)
            ]);
            expect(virtualCollection.at(0).get('displayText')).toEqual(collection.at(1).get('title'));
            expect(virtualCollection.at(0).get('groupingModel')).toEqual(true);
        });

        it('should be able to omit modelFactory and comparator', () => {
            const count = 2;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`
            })), {
                grouping: [
                    {
                        iterator: 'title'
                    }
                ]
            });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                virtualCollection.at(2),
                collection.at(0)
            ]);
            expect(virtualCollection.at(0).get('displayText')).toEqual(collection.at(1).get('title'));
            expect(virtualCollection.at(0).get('groupingModel')).toEqual(true);
        });

        it('should compute affected attributes from field based options', () => {
            const count = 2;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`
            })), {
                grouping: [
                    {
                        iterator: 'title'
                    }
                ]
            });

            collection.at(0).set('title', 'synthetic title 0');

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                virtualCollection.at(2),
                collection.at(1)
            ]);
        });
    });

    describe('When changing a model', () => {
        it('should update grouping on affected attribute change', () => {
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ]
            });
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            virtualCollection.on('reset', resetCallback);
            virtualCollection.on('add', addCallback);
            virtualCollection.on('remove', removeCallback);

            collection.at(0).set('assignee', repository.users[1]);

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(2),
                virtualCollection.at(2),
                collection.at(0),
                collection.at(1),
                collection.at(3)
            ]);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should update sorting on affected attribute change', () => {
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`,
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ],
                comparator(model) {
                    return model.get('title');
                }
            });
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            virtualCollection.on('reset', resetCallback);
            virtualCollection.on('add', addCallback);
            virtualCollection.on('remove', removeCallback);

            collection.at(0).set('title', 'synthetic title 0');

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(2),
                virtualCollection.at(3),
                collection.at(3),
                collection.at(1)
            ]);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });
    });

    describe('When resetting parent collection', () => {
        it('should reflect the changes', () => {
            // Fixture setup
            const { collection, virtualCollection } = createFixture(generateTaskArray(4, n => ({
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ]
            });
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(2),
                virtualCollection.at(3),
                collection.at(1),
                collection.at(3)
            ]);

            // Exercise system
            collection.reset(generateTaskArray(4, n => ({
                assignee: repository.users[n % 2]
            })));

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(2),
                virtualCollection.at(3),
                collection.at(1),
                collection.at(3)
            ]);
        });
    });

    describe('When changing parent collection order', () => {
        it('should reflect the changes on leaf level', () => {
            // Fixture setup
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                assignee: repository.users[n % 2],
                title: `some title ${count - n}`
            })), {
                grouping: [ assigneeGrouping ]
            });
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(2),
                virtualCollection.at(3),
                collection.at(1),
                collection.at(3)
            ]);

            // Exercise system
            collection.comparator = function(model) {
                return model.get('title');
            };
            collection.sort();

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                collection.at(3),
                virtualCollection.at(3),
                collection.at(0),
                collection.at(2)
            ]);
        });
    });

    describe('When filtering collection', () => {
        it('should filter grouped list', () => {
            // Fixture setup and system exercise
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ],
                filter(model) {
                    return model.get('assignee') === repository.users[1];
                }
            });

            // Verify outcome
            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(1),
                collection.at(3)
            ]);
        });
    });

    describe('When getting single value', () => {
        it('should return it by id index', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(10), {
                grouping: [ assigneeGrouping ]
            });

            const expectedModel = collection.at(0);
            const actualModel = virtualCollection.get(expectedModel.id);

            expect(expectedModel).toEqual(actualModel);
        });
    });

    describe('When removing item', () => {
        it('should remove item with full reset', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(3));
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            virtualCollection.on('reset', resetCallback);
            virtualCollection.on('add', addCallback);
            virtualCollection.on('remove', removeCallback);

            collection.remove(collection.at(1));

            expectToHaveSameMembers(virtualCollection.models, collection.models);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should remove empty parent groups', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(3, n => ({
                assignee: repository.users[n]
            })), {
                grouping: [ assigneeGrouping ]
            });

            collection.remove(collection.at(1));

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                virtualCollection.at(2),
                collection.at(1)
            ]);
        });

        it('should not remove parent groups if it is not empty', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(4, n => ({
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ]
            });

            collection.remove(collection.at(1));

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                collection.at(1),
                virtualCollection.at(3),
                collection.at(2)
            ]);
        });
    });

    describe('When adding item', () => {
        it('should add item with full reset', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(3), { delayedAdd: false });
            const newTask = generateTask();
            const resetCallback = jasmine.createSpy('resetCallback');
            const addCallback = jasmine.createSpy('addCallback');
            const removeCallback = jasmine.createSpy('removeCallback');
            virtualCollection.on('reset', resetCallback);
            virtualCollection.on('add', addCallback);
            virtualCollection.on('remove', removeCallback);

            collection.add(newTask);

            expectToHaveSameMembers(virtualCollection.models, collection.models);
            expect(resetCallback).toHaveBeenCalledTimes(1);
            expect(addCallback).not.toHaveBeenCalled();
            expect(removeCallback).not.toHaveBeenCalled();
        });

        it('should add missing parent groups', () => {
            const { collection, virtualCollection } = createFixture(generateTaskArray(2, n => ({
                assignee: repository.users[n]
            })), {
                grouping: [ assigneeGrouping ],
                delayedAdd: false
            });
            const newTask = generateTask({ assignee: repository.users[2] });

            collection.add(newTask);

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(0),
                virtualCollection.at(2),
                collection.at(1),
                virtualCollection.at(4),
                collection.at(2)
            ]);
        });

        it('should add item at exact position', () => {
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`,
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ],
                comparator(model) {
                    return model.get('title');
                },
                delayedAdd: false
            });

            const newTask = generateTask({
                assignee: repository.users[0],
                title: 'synthetic title 0'
            });
            virtualCollection.add(newTask, { at: 6 });

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(2),
                collection.at(0),
                virtualCollection.at(3),
                collection.at(3),
                collection.at(1),
                newTask
            ]);
        });

        it('should update internal index while adding item at exact position', () => {
            const count = 4;
            const { collection, virtualCollection } = createFixture(generateTaskArray(count, n => ({
                title: `synthetic title ${count - n}`,
                assignee: repository.users[n % 2]
            })), {
                grouping: [ assigneeGrouping ],
                comparator(model) {
                    return model.get('title');
                },
                delayedAdd: false
            });

            const newTask = generateTask({
                assignee: repository.users[0],
                title: 'synthetic title 0'
            });
            virtualCollection.add(newTask, { at: 6 });
            virtualCollection.__rebuildModels();

            expectCollectionsToBeEqual(virtualCollection, [
                virtualCollection.at(0),
                collection.at(2),
                collection.at(0),
                virtualCollection.at(3),
                collection.at(3),
                collection.at(1),
                newTask
            ]);
        });
    });
});
