/**
 * Developer: Stepan Burguchev
 * Date: 2/27/2017
 * Copyright: 2009-2017 Stepan Burguchev®
 *       All Rights Reserved
 * Published under the MIT license
 */

import core from 'comindware/core';

export default function() {
    const model = new Backbone.Model({
        title: 'foo',
        idealDays: 12,
        dueDate: '2015-07-20T10:46:37Z',
        description: 'bar\nbaz',
        blocked: true
    });

    const View = Marionette.View.extend({
        template: false,

        regions() {
            return {
                contentRegion: {
                    el: this.el
                }
            };
        },

        behaviors: {
            BackboneFormBehavior: {
                behaviorClass: core.form.behaviors.BackboneFormBehavior,
                renderStrategy: 'manual',
                schema() {
                    return {
                        title: {
                            title: 'Title',
                            type: 'Text'
                        },
                        idealDays: {
                            title: 'Ideal Days',
                            type: 'Number'
                        },
                        dueDate: {
                            title: 'Due Date',
                            type: 'DateTime'
                        },
                        description: {
                            title: 'Description',
                            type: 'TextArea'
                        },
                        blocked: {
                            type: 'Boolean',
                            displayText: 'Blocked by another task'
                        }
                    };
                }
            }
        },

        onRender() {
            this.contentRegion.show(new core.layout.VerticalLayout({
                rows: [
                    core.layout.createFieldAnchor('title'),
                    new core.layout.HorizontalLayout({
                        columns: [
                            core.layout.createFieldAnchor('idealDays'),
                            core.layout.createFieldAnchor('dueDate')
                        ]
                    }),
                    core.layout.createFieldAnchor('description'),
                    core.layout.createEditorAnchor('blocked'),
                    new core.layout.Button({
                        text: 'Commit',
                        handler: () => {
                            this.form.commit();
                            alert(JSON.stringify(this.model.toJSON(), null, 4));
                        }
                    })
                ]
            }));
            this.renderForm();
        }
    });

    return new View({
        model
    });
}
