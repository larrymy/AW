/** Resources loading.
 *
 * This object - despite its name - does not load anything. Instead, it
 * acts as a central hub for reporting and tracking the progress of
 * resource loading. Each load element is given an unique id by the caller
 * and that id is used when events are raised.
 *
 * Properties:
 * - app: the main application object
 * - queue: number of elements to be loaded
 * - count: total number of elements (loading and loaded)
 * - ready: true if all requested elements were retrieved
 * - progress: [0..1] fraction of resources loaded so far
 *     - id, identifier: event id for compatibility with touches
 *     - x, y: the absolute position in pixels
 *     - original: original event
 *     - mozMovementX, mozMovementY: change in position from previous event
 * - mousedownEvent and mouseupEvent: last button press or release event
 *     - id, identifier: event id for compatibility with touches
 *     - x, y: the absolute position in pixels
 *     - original: original event
 *     - button: one of `left`, `middle`, `right`
 * - x, y: alias for mousemoveEvent.x, .y
 *
 * Events generated by this object (PLAYGROUND.Application.mouseToTouch
 * decides the variant to trigger):
 * - add: an element was added to the queue
 * - load: an element was successfully loaded
 * - error: an element could not be loaded
 * - ready: *all* elements were successfully loaded; this *is not* triggered
 *   if any element reported an error.
 */

PLAYGROUND.Loader = function(app) {

  this.app = app;

  PLAYGROUND.Events.call(this);

  this.reset();

};

PLAYGROUND.Loader.prototype = {

  /** Start retreiving an element */

  add: function(id) {

    this.queue++;
    this.count++;
    this.ready = false;
    this.trigger("add", id);

    return id;

  },

  /** Report an error to the loader. */

  error: function(id) {

    this.trigger("error", id);

  },

  /** Report a success to the loader. */

  success: function(id) {

    this.queue--;

    this.progress = 1 - this.queue / this.count;

    this.trigger("load", id);

    if (this.queue <= 0) {
      this.reset();
      this.trigger("ready");
    }

  },

  /** Bring loader back to the ground state */

  reset: function() {

    this.progress = 0;
    this.queue = 0;
    this.count = 0;
    this.ready = true;

  }
};

PLAYGROUND.Utils.extend(PLAYGROUND.Loader.prototype, PLAYGROUND.Events.prototype);