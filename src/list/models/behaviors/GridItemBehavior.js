/**
 * Developer: Stepan Burguchev
 * Date: 8/7/2014
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

import SelectableBehavior from '../../../models/behaviors/SelectableBehavior';
import HighlightableBehavior from '../../../models/behaviors/HighlightableBehavior';
import CheckableBehavior from '../../../models/behaviors/CheckableBehavior';

export default function(model) {
    _.extend(this, new SelectableBehavior.Selectable(model));
    _.extend(this, new CheckableBehavior.CheckableModel(model));
    _.extend(this, new HighlightableBehavior(model));
}
