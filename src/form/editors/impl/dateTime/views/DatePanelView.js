/**
 * Developer: Grigory Kuznetsov
 * Date: 10.09.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

'use strict';

import { Handlebars, moment } from 'lib';
import { helpers, dateHelpers } from 'utils';
import template from '../templates/datePanel.hbs';
import LocalizationService from '../../../../../services/LocalizationService';

const defaultOptions = {
    pickerFormat: 'YYYY-MM-DD'
};

export default Marionette.ItemView.extend({
    template: Handlebars.compile(template),

    initialize(options) {
        helpers.ensureOption(options, 'timezoneOffset');
        
        this.pickerOptions = {
            minView: 2,
            format: this.options.pickerFormat,
            todayBtn: true,
            weekStart: dateHelpers.getWeekStartDay(),
            language: LocalizationService.langCode
        };
    },

    className: 'datepicker_panel',

    modelEvents: {
        'change:value': 'updatePickerDate'
    },

    ui: {
        pickerInput: '.js-datetimepicker'
    },

    updatePickerDate() {
        let val = this.model.get('value'),
            format = defaultOptions.pickerFormat,
            pickerFormattedDate = val ? moment.utc(new Date(val)).utcOffset(this.getOption('timezoneOffset')).format(format) : moment.utc({}).format(format);

        this.ui.pickerInput.attr('data-date', pickerFormattedDate);
        this.ui.pickerInput.datetimepicker('update');
    },

    updateValue(date) {
        let oldVal = this.model.get('value'),
            newVal = null;

        if (date === null || date === '') {
            newVal = null;
        } else if (oldVal && this.getOption('preserveTime')) {
            const momentOldVal = moment.utc(oldVal);
            let momentOldDisplayedDate = moment.utc(oldVal).utcOffset(this.getOption('timezoneOffset'));
            momentOldDisplayedDate = moment({
                year: momentOldDisplayedDate.year(),
                month: momentOldDisplayedDate.month(),
                date: momentOldDisplayedDate.date()
            });
            const diff = moment.utc(date).diff(momentOldDisplayedDate, 'days'); // Figure out number of days between displayed old date and entered new date
            newVal = momentOldVal.date(momentOldVal.date() + (diff || 0)).toISOString(); // and apply it to stored old date to prevent transition-through-the-day bugs
        } else {
            newVal = moment.utc({
                year: date.getFullYear(),
                month: date.getMonth(),
                date: date.getDate()
            }).minute(-this.getOption('timezoneOffset')).toISOString();
        }

        this.model.set({ value: newVal });
    },

    onShow() {
        this.ui.pickerInput.datetimepicker(this.pickerOptions)
            .on('changeDate', (e) => {
                this.updateValue(e.date);
                this.trigger('select');
            });
        this.updatePickerDate();
    }
});
