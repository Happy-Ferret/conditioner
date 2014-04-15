/**
 * Tests the level of consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define(['../utils/Observer','security/StorageConsentGuard'],function(Observer,StorageConsentGuard){

    'use strict';

    var _level = '';

    return {

        /**
         * Listen to change even from storage consent guard
         * @param {function} measure
         */
        setup:function(measure) {

            // listen to changes on storage guard
            var guard = StorageConsentGuard.getInstance();
            Observer.subscribe(guard,'change',function() {
                measure();
            });

            // get active level
            _level = guard.getActiveLevel();
        },

        /**
         * Custom measure function to test if level changed
         * @returns {boolean} - Returns true if change occurred
         */
        measure:function() {

            // get guard reference
            var guard = StorageConsentGuard.getInstance();

            // get active level now it has changed
            var newLevel = guard.getActiveLevel();

            // if changed
            if (newLevel !== _level) {
                _level = newLevel;
                return true;
            }

            return false;
        },

        /**
         * test if expected level
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {
            return !!(expected.match(new RegExp(_level,'g')));
        }
    };

});
