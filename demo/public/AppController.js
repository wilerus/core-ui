define([
    'Application',
    'comindware/core',
    './app/DemoService',
    './app/views/NavBarView',
    './app/views/IndexPageView',
    './app/views/DemoPageView'
], (Application, core, DemoService, NavBarView, IndexPageView, DemoPageView) => {
    'use strict';
    

    return Marionette.Object.extend({
        index() {
            Application.headerRegion.show(new NavBarView({
                collection: new Backbone.Collection([
                    {
                        displayName: 'Welcome',
                        selected: true
                    }
                ])
            }));
            Application.contentRegion.show(new IndexPageView({
                collection: new Backbone.Collection(DemoService.getSections())
            }));
        },

        showCase(sectionId, groupId, caseId) {
            const sections = new Backbone.Collection(DemoService.getSections());
            sections.find((s) => s.id === sectionId).set('selected', true);
            Application.headerRegion.show(new NavBarView({
                collection: sections
            }));
            Application.contentRegion.show(new DemoPageView({
                activeSectionId: sectionId,
                activeGroupId: groupId,
                activeCaseId: caseId
            }));
        }
    });
});
