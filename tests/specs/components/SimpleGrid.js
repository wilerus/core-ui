
import core from 'coreApi';
import { initializeCore } from '../../utils/helpers';
import 'jasmine-jquery';

describe('SimpleGrid', () => {
    let rootRegion;
    let columns;
    let data = [];

    beforeEach(() => {
        columns = [
            {
                key: 'textCell',
                type: 'Text',
                cellView: core.list.cellFactory.getTextCellView(),
                title: 'TextCell',
                required: true,
                viewModel: new Backbone.Model({ displayText: 'TextCell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Asc, 'textCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Desc, 'textCell'),
                sorting: 'asc'
            },
            {
                key: 'numberCell',
                type: 'Number',
                title: 'Number Cell',
                getReadonly: model => model.get('numberCell') % 2,
                cellView: core.list.cellFactory.getNumberCellView(),
                viewModel: new Backbone.Model({ displayText: 'Number Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.numberComparator2Asc, 'numberCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.numberComparator2Desc, 'numberCell')
            },
            {
                key: 'dateTimeCell',
                type: 'DateTime',
                title: 'DateTime Cell',
                readonly: false,
                cellView: core.list.cellFactory.getDateTimeCellView(),
                viewModel: new Backbone.Model({ displayText: 'DateTime Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.dateComparator2Asc, 'dateTimeCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.dateComparator2Desc, 'dateTimeCell')
            },
            {
                key: 'durationCell',
                type: 'Duration',
                title: 'Duration Cell',
                cellView: core.list.cellFactory.getDurationCellView(),
                viewModel: new Backbone.Model({ displayText: 'Duration Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.durationComparator2Asc, 'durationCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.durationComparator2Desc, 'durationCell')
            },
            {
                key: 'booleanCell',
                type: 'Boolean',
                title: 'Boolean Cell',
                cellView: core.list.cellFactory.getBooleanCellView(),
                viewModel: new Backbone.Model({ displayText: 'Boolean Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Asc, 'booleanCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Desc, 'booleanCell')
            },
            {
                key: 'documentCell',
                type: 'Document',
                title: 'Document',
                cellView: core.list.cellFactory.getDocumentCellView(),
                viewModel: new Backbone.Model({ displayText: 'Boolean Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Asc, 'documentCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Desc, 'documentCell')
            },
            {
                key: 'referenceCell',
                type: 'ReferenceBubble',
                title: 'Reference Cell',
                controller: new core.form.editors.reference.controllers.DemoReferenceEditorController(),
                cellView: core.list.cellFactory.getReferenceCellView(),
                viewModel: new Backbone.Model({ displayText: 'Boolean Cell' }),
                sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Asc, 'referenceCell'),
                sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Desc, 'referenceCell'),
            }
        ];
        for (let i = 0; i < 20; i++) {
            data.push({
                textCell: `Text Cell ${i}`,
                numberCell: i + 1,
                dateTimeCell: '2015-07-24T08:13:13.847Z',
                durationCell: 'P12DT5H42M',
                booleanCell: true,
                userCell: [{ id: 'user.1', columns: ['J. J.'] }],
                referenceCell: { name: 'Ref 1' },
                enumCell: { valueExplained: ['123'] },
                documentCell: [{
                    id: `document.${i}`,
                    name: `Document ${i}`,
                    url: `GetDocument/${i}`
                }]
            });
        }
        rootRegion = initializeCore();
    });

    describe('ButtonView', () => {
        it('should initialize', () => {
            const EditableGridView = new core.editableGrid.views.EditableGridView({
                columns,
                selectableBehavior: 'multi',
                collection: new Backbone.Collection(data),
                title: 'Editable grid'
            });

            rootRegion.show(EditableGridView);

            expect(true).toEqual(true);
        });
    });
});
