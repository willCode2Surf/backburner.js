import Queue from "backburner/queue";

function DeferredActionQueues(queueNames, options) {
  var queues = this.queues = {};
  this.queueNames = queueNames = queueNames || [];

  var queueName;
  for (var i = 0, l = queueNames.length; i < l; i++) {
    queueName = queueNames[i];
    queues[queueName] = new Queue(this, queueName, options[queueName]);
  }
}

DeferredActionQueues.prototype = {
  queueNames: null,
  queues: null,

  schedule: function(queueName, target, method, args, onceFlag, stack) {
    var queues = this.queues,
        queue = queues[queueName];

    if (!queue) { throw new Error("You attempted to schedule an action in a queue (" + queueName + ") that doesn't exist"); }

    if (onceFlag) {
      return queue.pushUnique(target, method, args, stack);
    } else {
      return queue.push(target, method, args, stack);
    }
  },

  flush: function() {
    var queues = this.queues,
        queueNames = this.queueNames,
        queueName, queue, queueItems, priorQueueNameIndex,
        queueNameIndex = 0, numberOfQueues = queueNames.length;

    outerloop:
    while (queueNameIndex < numberOfQueues) {
      queueName = queueNames[queueNameIndex];
      queue = queues[queueName];
      queueItems = queue._queue.slice();
      queue._queue = [];

      var options = queue.options,
          before = options && options.before,
          after = options && options.after,
          target, method, args,
          queueIndex = 0, numberOfQueueItems = queueItems.length;

      if (numberOfQueueItems && before) { before(); }
      while (queueIndex < numberOfQueueItems) {
        target = queueItems[queueIndex];
        method = queueItems[queueIndex+1];
        args   = queueItems[queueIndex+2];

        if (typeof method === 'string') { method = target[method]; }

        // TODO: error handling
        method.apply(target, args);

        queueIndex += 4;
      }
      if (numberOfQueueItems && after) { after(); }

      if ((priorQueueNameIndex = indexOfPriorQueueWithActions(this, queueNameIndex)) !== -1) {
        queueNameIndex = priorQueueNameIndex;
        continue outerloop;
      }

      queueNameIndex++;
    }
  }
};

function indexOfPriorQueueWithActions(daq, currentQueueIndex) {
  var queueName, queue;

  for (var i = 0, l = currentQueueIndex; i <= l; i++) {
    queueName = daq.queueNames[i];
    queue = daq.queues[queueName];
    if (queue._queue.length) { return i; }
  }

  return -1;
}

export DeferredActionQueues;