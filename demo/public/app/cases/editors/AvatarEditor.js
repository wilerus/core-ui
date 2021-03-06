
import core from 'comindware/core';
import CanvasView from 'demoPage/views/CanvasView';

export default function() {
    const model = new Backbone.Model({
        //avatar: '14167968',
        fullName: 'Foo Bar'
    });

    return new CanvasView({
        view: new core.form.editors.AvatarEditor({
            model,
            key: 'avatar',
            autocommit: true,
            fullName: model.get('fullName'),
            autoUpload: true, // or use method 'upload' instead
            refreshPreviewAfterUpload: true,
            controller: new core.form.editors.avatar.controllers.DemoAvatarEditorController({
                defaultURL: '/resources/images/defaultAvatar.png'
            })
        }),

        presentation: '"{{avatar}}"'
    });
}
