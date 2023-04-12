import { types } from 'mobx-state-tree';
import debounce from  'lodash.debounce';

const DEBOUNCE_INTERVAL = 500;

/**
 * Calculate lead time just by calling `countTime()`. Result stored in `leadTime`.
 */
const LeadTimeMixin = types
  .model({
    leadTime: 0,
  })
  .volatile(() => ({
    startTime: 0,
  }))
  .actions(self => ({
    internalCountTime(callTime) {
      const now = +Date.now();
      // leading call called immediately, debounced call called after INTERVAL
      const leadingCall = now - callTime < DEBOUNCE_INTERVAL / 2;

      if (leadingCall) {
        // debounced fn called only once if event is rare, so if this is leading call,
        // but there is previous call, assume that previous event took INTERVAL time
        if (self.startTime) {
          self.leadTime += DEBOUNCE_INTERVAL;
        }
        self.startTime = now;
      } else {
        if (self.startTime) {
          self.leadTime += now - self.startTime;
        }
        self.startTime = 0;
      }
    },

    debouncedCountTime: debounce(time => self.internalCountTime(time), DEBOUNCE_INTERVAL, { leading: true }),

    // for manual calls with distance in time it's neccessary to emulate second debounced call,
    // so fake the time of call; trailingCall can be an event, so check explicitely for `true`
    countTime(trailingCall = false) {
      const emulateDebounced = trailingCall === true ? -DEBOUNCE_INTERVAL : 0;

      self.debouncedCountTime(+new Date() + emulateDebounced);
    },
  }));

export default LeadTimeMixin;
