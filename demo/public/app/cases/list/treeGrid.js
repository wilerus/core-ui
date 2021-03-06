
import core from 'comindware/core';
import CanvasView from 'demoPage/views/CanvasView';

// 1. Get some data
export default function() {
    const data = [];
    const childLength = 3;
    const treeHeight = 4;

    const createTree = (parentCollection, level, parent = null) => {
        for (let i = 0; i < childLength; i++) {
            const item = {
                textCell: `Text Cell ${i}`,
                numberCell: i + 1,
                dateTimeCell: '2015-07-24T08:13:13.847Z',
                durationCell: 'P12DT5H42M',
                booleanCell: true,
                userCell: [{ id: 'user.1', columns: ['J. J.'] }],
                referenceCell: { name: 'Ref 1' },
                enumCell: { valueExplained: ['123'] },
                documentCell: [{ id: '1', columns: ['Doc 1', 'url'] }, { id: '2', columns: ['Doc 2', 'url2'] }],
            };
            item.parent = parent;
            if (level > 0) {
                const children = [];
                createTree(children, level - 1, item);
                item.children = children;
            }
            parentCollection.push(item);
        }
    };

    createTree(data, treeHeight);

    // 2. Create columns
    const columns = [
        {
            id: 'textCell',
            cellView: core.list.cellFactory.getTextCellView(),
            viewModel: new Backbone.Model({ displayText: 'TextCell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Asc, 'textCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Desc, 'textCell'),
            sorting: 'asc',
            width: 300
        },
        {
            id: 'numberCell',
            cellView: core.list.cellFactory.getNumberCellView(),
            viewModel: new Backbone.Model({ displayText: 'Number Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.numberComparator2Asc, 'numberCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.numberComparator2Desc, 'numberCell'),
            sorting: 'asc',
            width: 100
        },
        {
            id: 'dateTimeCell',
            cellView: core.list.cellFactory.getDateTimeCellView(),
            viewModel: new Backbone.Model({ displayText: 'DateTime Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.dateComparator2Asc, 'dateTimeCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.dateComparator2Desc, 'dateTimeCell'),
            width: 100
        },
        {
            id: 'durationCell',
            cellView: core.list.cellFactory.getDurationCellView(),
            viewModel: new Backbone.Model({ displayText: 'Duration Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.durationComparator2Asc, 'durationCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.durationComparator2Desc, 'durationCell'),
            width: 100
        },
        {
            id: 'booleanCell',
            cellView: core.list.cellFactory.getBooleanCellView(),
            viewModel: new Backbone.Model({ displayText: 'Boolean Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Asc, 'booleanCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.booleanComparator2Desc, 'booleanCell'),
            width: 100
        },
        {
            id: 'referenceCell',
            cellView: core.list.cellFactory.getReferenceCellView(),
            viewModel: new Backbone.Model({ displayText: 'Reference Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.referenceComparator2Asc, 'referenceCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.referenceComparator2Desc, 'referenceCell'),
            width: 100
        },
        {
            id: 'enumCell',
            cellView: core.list.cellFactory.getEnumCellView(),
            viewModel: new Backbone.Model({ displayText: 'Enum Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Asc, 'enumCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.stringComparator2Desc, 'enumCell'),
            width: 100
        },
        {
            id: 'documentCell',
            cellView: core.list.cellFactory.getDocumentCellView(),
            viewModel: new Backbone.Model({ displayText: 'Document Cell' }),
            sortAsc: core.utils.helpers.comparatorFor(core.utils.comparators.referenceComparator2Asc, 'documentCell'),
            sortDesc: core.utils.helpers.comparatorFor(core.utils.comparators.referenceComparator2Desc, 'documentCell'),
            width: 100
        }
    ];

    // 3. Create grid
    const nativeGridView = core.nativeGrid.factory.createTreeGrid({
        gridViewOptions: {
            columns,
            selectableBehavior: 'multi'
        },
        collection: data,
        childrenAttribute: 'children'
    });

    // 4. Show created views
    return new CanvasView({
        view: nativeGridView,
        canvas: {
            height: '250px',
            width: '400px'
        },
        region: {
            float: 'left'
        }
    });
}
