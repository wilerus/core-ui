/**
 * Developer: Vladislav Smirnov
 * Date: 10.9.2017
 * Copyright: 2009-2017 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

export default class CTEventsService {
    static initialize() {
        window.addEventListener('storage', event => {
            if (event.key === 'cbEvent') {
                this.__handleStorageEvent(event.newValue);
            }
        });
        Object.assign(this, Backbone.Events);
    }

    static triggerStorageEvent(eventId, data) {
        localStorage.setItem('cbEvent', JSON.stringify({ id: eventId, data }));
    }

    static __handleStorageEvent(newValue) {
        this.trigger('cbEvent', JSON.parse(newValue));
    }
}
