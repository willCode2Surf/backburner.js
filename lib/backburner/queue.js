function Queue(daq, name, options) {
  this.daq = daq;
  this.name = name;
  this.options = options;
  this._queue = [];
}

Queue.prototype = {
  daq: null,
  name: null,
  options: null,
  _queue: null,

  push: function(target, method, args, stack) {
    var queue = this._queue;
    queue.push(target, method, args, stack);
    return {queue: this, target: target, method: method};
  },

  pushUnique: function(target, method, args, stack) {
    var queue = this._queue;

    for (var i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i+1];

      if (currentTarget === target && currentMethod === method) {
        queue[i+2] = args; // replace args
        queue[i+3] = stack; // replace stack
        return {queue: this, target: target, method: method}; // TODO: test this code path
      }
    }

    this._queue.push(target, method, args, stack);
    return {queue: this, target: target, method: method};
  },

  // TODO: remove me, only being used for Ember.run.sync
  flush: function() {
    var queue = this._queue,
        options = this.options,
        before = options && options.before,
        after = options && options.after,
        action, target, method, args, i, l = queue.length;

    if (l && before) { before(); }
    for (i = 0; i < l; i += 4) {
      target = queue[i];
      method = queue[i+1];
      args   = queue[i+2];

      method.apply(target, args); // TODO: error handling
    }
    if (l && after) { after(); }

    if (queue.length) { this._queue = []; }
  },

  cancel: function(actionToCancel) {
    var queue = this._queue, currentTarget, currentMethod, i, l;

    for (i = 0, l = queue.length; i < l; i += 4) {
      currentTarget = queue[i];
      currentMethod = queue[i+1];

      if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
        queue.splice(i, 4);
        return true;
      }
    }
  }
};

export Queue;