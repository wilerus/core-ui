/**
 * Developer: Grigory Kuznetsov
 * Date: 17.08.2015
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

'use strict';

import template from '../templates/header.hbs';
import { Handlebars } from 'lib';
import GridHeaderView from '../../list/views/GridHeaderView';
import GlobalEventService from '../../services/GlobalEventService';

/**
 * @name HeaderView
 * @memberof module:core.nativeGrid.views
 * @class HeaderView
 * @description View заголовка списка
 * @extends module:core.list.views.GridHeaderView {@link module:core.list.views.GridHeaderView}
 * @param {Object} options Constructor options
 * @param {Array} options.columns Массив колонок
 * @param {Object} options.gridEventAggregator ?
 * @param {Backbone.View} options.gridColumnHeaderView View Используемый для отображения заголовка (шапки) списка
 * */

export default GridHeaderView.extend({
    initialize() {
        GridHeaderView.prototype.initialize.apply(this, arguments);
        _.bindAll(this, '__draggerMouseUp', '__draggerMouseMove', '__handleResizeInternal', '__handleColumnSort');
        this.listenTo(GlobalEventService, 'window:resize', this.__handleResizeInternal);
    },

    template: Handlebars.compile(template),

    onRender() {
        this.ui.gridHeaderColumnContent.each((i, el) => {
            const column = this.columns[i];
            const view = new this.gridColumnHeaderView(_.extend(this.gridColumnHeaderViewOptions || {}, {
                model: column.viewModel,
                column,
                gridEventAggregator: this.gridEventAggregator
            }));
            this.listenTo(view, 'columnSort', this.__handleColumnSort);
            el.appendChild(view.render().el);
        });

        this.headerMinWidth = this.__getAvailableWidth();
        this.__setInitialWidth(this.headerMinWidth);
        this.__handleResizeInternal();
    },

    constants: {
        MIN_COLUMN_WIDTH: 100
    },

    setFitToView() {
        let availableWidth = this.__getAvailableWidth(),
            viewWidth = this.__getTableWidth(),
            columnsL = this.ui.gridHeaderColumn.length,
            fullWidth = 0,
            sumDelta = 0,
            sumGap = 0;

        this.ui.gridHeaderColumn.each((i, el) => {
            if (availableWidth !== viewWidth) {
                var columnWidth = this.__getElementOuterWidth(el) * availableWidth / viewWidth;
                if (columnWidth < this.constants.MIN_COLUMN_WIDTH) {
                    sumDelta += this.constants.MIN_COLUMN_WIDTH - columnWidth;
                    columnWidth = this.constants.MIN_COLUMN_WIDTH;
                } else {
                    sumGap += columnWidth - this.constants.MIN_COLUMN_WIDTH;
                }
            }

            this.columns[i].width = columnWidth;
        });

        this.ui.gridHeaderColumn.each((i, el) => {
            if (availableWidth !== viewWidth) {
                if (this.columns[i].width > this.constants.MIN_COLUMN_WIDTH) {
                    const delta = (this.columns[i].width - this.constants.MIN_COLUMN_WIDTH) * sumDelta / sumGap;
                    this.columns[i].width -= delta;
                }
            }

            if (i === columnsL - 1 && fullWidth + this.columns[i].width < availableWidth) {
                this.columns[i].width = availableWidth - fullWidth;
            }

            $(el).outerWidth(this.columns[i].width);
            fullWidth += this.columns[i].width;
        });
        this.$el.width(Math.ceil(fullWidth));
    },

    updateColumnAndNeighbourWidths(index, delta) {
        let $current = $(this.ui.gridHeaderColumn[index]),
            newColumnWidth = this.dragContext.draggedColumn.initialWidth + delta;

        if (this.dragContext.draggedColumn.initialWidth + delta < this.constants.MIN_COLUMN_WIDTH) {
            return;
        }

        $current.outerWidth(newColumnWidth);
        this.gridEventAggregator.trigger('singleColumnResize', this, {
            index,
            delta
        });

        this.__changeTableWidth(this.dragContext.tableInitialWidth, delta);
        this.columns[index].width = newColumnWidth;
    },

    updateDragContext($column, offset) {
        this.dragContext = this.dragContext || {};

        const draggedColumn = {
            $el: $column,
            initialWidth: this.__getElementOuterWidth($column),
            index: $column.index()
        };

        this.dragContext.tableInitialWidth = this.__getTableWidth();
        this.gridEventAggregator.trigger('columnStartDrag', this, draggedColumn.index);

        this.dragContext.fullWidth = this.headerMinWidth;
        this.dragContext.draggedColumn = draggedColumn;
        this.dragContext.pageOffsetX = offset;
    },

    __setInitialWidth(availableWidth) {
        const columnsL = this.ui.gridHeaderColumn.length;
        const columnWidthData = this.__getColumnsWidthData(availableWidth, this.columns);
        let fullWidth = 0;

        this.ui.gridHeaderColumn.each((i, el) => {
            const columnWidth = columnWidthData[i];

            if (i === columnsL - 1 && fullWidth + this.columns[i].width < availableWidth) {
                this.columns[i].width = availableWidth - fullWidth;
            }

            $(el).outerWidth(columnWidth);
            this.columns[i].width = columnWidth;
            fullWidth += columnWidth;
        });

        this.$el.width(Math.ceil(fullWidth));
    },

    __getColumnsWidthData(availableWidth, columns) {
        const columnWidthData = [];
        let availableDynamicWidth = availableWidth;
        let nonStaticColumnsCount = columns.length;

        this.ui.gridHeaderColumn.each((i, el) => {
            let columnWidth;
            if (columns[i].width) {
                columnWidth = columns[i].width;
                --nonStaticColumnsCount;
            } else {
                columnWidth = Math.max($(el).outerWidth(), this.constants.MIN_COLUMN_WIDTH);
            }
            availableDynamicWidth -= columnWidth;
            columnWidthData.push(columnWidth);
        });

        if (availableDynamicWidth > 0) {
            const columnAdditionalWidth = availableDynamicWidth / nonStaticColumnsCount;
            columns.forEach((column, i) => {
                if (!column.width) {
                    columnWidthData[i] += columnAdditionalWidth;
                }
            });
        }

        return columnWidthData;
    },

    __getAvailableWidth() {
        return this.gridEventAggregator.$el.width();
    },

    __getElementOuterWidth(el) {
        return $(el)[0].getBoundingClientRect().width;
    },

    __startDrag(e) {
        const $dragger = $(e.target);

        this.updateDragContext($dragger.parent(), e.pageX);
        this.dragContext.tableInitialWidth = this.__getTableWidth();

        this.dragContext.$dragger = $dragger;

        $dragger.addClass('active');
        this.$document.mousemove(this.__draggerMouseMove).mouseup(this.__draggerMouseUp);
    },

    __stopDrag() {
        if (!this.dragContext) {
            return;
        }

        this.dragContext.$dragger.removeClass('active');
        this.dragContext = null;
        this.$document.unbind('mousemove', this.__draggerMouseMove);
        this.$document.unbind('mouseup', this.__draggerMouseUp);

        this.gridEventAggregator.trigger('columnStopDrag');
    },

    __draggerMouseMove(e) {
        if (!this.dragContext) {
            return;
        }

        const ctx = this.dragContext;
        const delta = e.pageX - ctx.pageOffsetX;

        if (delta !== 0) {
            const index = ctx.draggedColumn.index;

            this.updateColumnAndNeighbourWidths(index, delta);
        }

        return false;
    },

    __changeTableWidth(initialWidth, delta) {
        this.$el.width(initialWidth + delta + 1);
    },

    __getTableWidth() {
        return this.$el.width() - 1;
    },

    __handleResizeInternal() {
        let fullWidth = this.__getAvailableWidth(),
            currentWidth = this.__getTableWidth();

        if (fullWidth > currentWidth) {
            this.$el.width(fullWidth);
        }
        this.headerMinWidth = fullWidth;
        this.__updateColumnsWidth();
    },

    __updateColumnsWidth() {
        let columns = this.columns,
            needUpdate = false,
            fullWidth = 0;

        this.ui.gridHeaderColumn.each((i, el) => {
            const child = $(el);
            const col = columns[i];
            if (col.width) {
                needUpdate = true;
                child.outerWidth(col.width);
                fullWidth += col.width;
            }
        });

        needUpdate && this.$el.width(fullWidth);
    }
});
