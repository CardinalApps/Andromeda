Each model is an ES6 module that exports a function aptly named `modelFunction` that will be executed immediately before the associated view is rendered (only when the view is **NOT** being loaded from the Router cache). The `modelFunction` returns an object who's values will be made available to the view via a mustache merge tag for each object `{{property}}`.

The `modelFunction` can retreive its context in the globally available `Router` object.

Views have no ability to perform templating logic on their own. When the model needs to instruct the view to not show something, the model can simply use an empty string for that merge tag.

Controllers could theoretically load models, but the design pattern outlaws it. Models exist only to set the initial state of a view.