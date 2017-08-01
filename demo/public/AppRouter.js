define([
    'comindware/core'
], () => {
    'use strict';

    return Marionette.AppRouter.extend({
        appRoutes: {
            '': 'index',
            'demo/:sectionId/:groupId/:caseId': 'showCase'
        }
    });
});
