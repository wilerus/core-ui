
import core from 'comindware/core';
import CanvasView from 'demoPage/views/CanvasView';

export default function() {
    const model = new Backbone.Model({
        textValue: 'Some text'
    });

    return new CanvasView({
        view: new core.form.editors.TextEditor({
            model,
            key: 'textValue',
            changeMode: 'keydown',
            autocommit: true
        }),
        presentation: '\'{{textValue}}\''
    });
}
