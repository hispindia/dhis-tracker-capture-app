/* global angular, moment, dhis2 */

'use strict';

/* Custom Services */

/**
 * Created by Gourav.
 */
angular.module('trackerCaptureServices')
    .service('UPHMISCustomService', function ($http, $q, $timeout) {
        var dailyProgramStagesUIDs = ["XOD2Nl5kncW",
            "tOQIl0vKx7l",
            "Ew6LSYXKAzl",
            "PfRIIrvnjcU"];
        var monthlyProgramStagesUIDs = ["d8ar9Ndh5mL",
            "OVBvzaxZpWs"];
        return {
            uphmisCheckIfEventAlreadyExistsForSelDate: function (currentDate, events, programStage) {
            	
                if (this.checkForDailyStages(currentDate, events, programStage)) {
                	
                    return true;
                }

                if (this.checkForMonthlyStages(currentDate, events, programStage)) {
                    return true;
                }

                return false;
            },
            checkForDailyStages: function (currentDate, events, programStage) {
            
            	console.log("Daily Program Stage: "+ Object.values(programStage));
            	
            	
            	
                if (dailyProgramStagesUIDs.indexOf(programStage) > -1) {
                    for (var i = 0; i < events.length; i++) {
                    
                        if (events[i].eventDate === currentDate && events[i].name !== "Paediatric - PBR monitoring - Monthly") {
                        
                            return true;
                        }
                    }
                    return false;
                }
            },
            checkForMonthlyStages: function (currentDate, events, programStage) {
                var todayMonth = new Date().getMonth();
                var todayYear = new Date().getFullYear();

                var gettingMonth = new Date(currentDate).getMonth();
                var gettingYear = new Date(currentDate).getFullYear();
                
                if (monthlyProgramStagesUIDs.indexOf(programStage) > -1) {
                        if (new Date(gettingYear, gettingMonth).valueOf() > new Date(todayYear, todayMonth).valueOf()) {
                            return true;
                        //}
                    }
                    return false;
                }
            }

        }
    });