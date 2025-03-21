/* global angular, moment, dhis2 */

'use strict';

/* Services */

var trackerCaptureServices = angular.module('trackerCaptureServices', ['ngResource'])

.filter('orderByKey', function(){
    var compareValues = function(key, order='asc') {
        return function(a, b) {
            if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                // property doesn't exist on either object
                return 0; 
            }
        
            const varA = (typeof a[key] === 'string') ? 
                a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string') ? 
                b[key].toUpperCase() : b[key];
        
            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return (
                (order == 'desc') ? (comparison * -1) : comparison
            );
        };
    }
    return function(array, key, direction){
        return array.sort(compareValues(key, direction));
    }
})

.factory('TCStorageService', function(){
    var store = new dhis2.storage.Store({
        name: "dhis2tc",
        adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
        objectStores: ['programs', 'trackedEntityTypes', 'attributes', 'relationshipTypes', 'optionSets', 'programIndicators', 'ouLevels', 'programRuleVariables', 'programRules','constants', 'dataElements', 'programAccess','programStageAccess','trackedEntityTypeAccess','optionGroups', 'organisationUnits']
    });
    return{
        currentStore: store
    };
})

/* Service to fetch/store dasboard widgets */
.service('DashboardLayoutService', function($http, DHIS2URL, NotificationService, $translate) {

    var ButtonIds = { Complete: "Complete", Incomplete: "Incomplete", Validate: "Validate", Delete: "Delete", Skip: "Skip", Unskip: "Unskip", Note: "Note" };

    var w = {};
    w.enrollmentWidget = {title: 'enrollment', view: "components/enrollment/enrollment.html", show: true, expand: true, parent: 'biggerWidget', order: 0};
    w.indicatorWidget = {title: 'indicators', view: "components/rulebound/rulebound.html", show: true, expand: true, parent: 'biggerWidget', order: 1, canBeUsedAsTopBar: true, topBarView: "components/rulebound/rulebound-topbar.html#indicators"};
    w.dataentryWidget = {title: 'dataentry', view: "components/dataentry/dataentry.html", show: true, expand: true, parent: 'biggerWidget', order: 2};
    w.dataentryTabularWidget = {title: 'dataentryTabular', view: "components/dataentry/dataentry-tabular-layout.html", show: false, expand: true, parent: 'biggerWidget', order: 3};
    w.reportWidget = {title: 'report', view: "components/report/tei-report.html", show: true, expand: true, parent: 'biggerWidget', order: 4};
    w.selectedWidget = {title: 'current_selections', view: "components/selected/selected.html", show: false, expand: true, parent: 'smallerWidget', order: 0};
    w.feedbackWidget = {title: 'feedback', view: "components/rulebound/rulebound.html", show: true, expand: true, parent: 'smallerWidget', order: 1,canBeUsedAsTopBar: true, topBarView: "components/rulebound/rulebound-topbar.html#feedback"};
    w.profileWidget = {title: 'profile', view: "components/profile/profile.html", show: true, expand: true, parent: 'smallerWidget', order: 2, canBeUsedAsTopBar: true, topBarView: "components/profile/profile-topbar.html"};
    w.relationshipWidget = {title: 'relationships', view: "components/relationship/relationship.html", show: true, expand: true, parent: 'smallerWidget', order: 3};
    w.notesWidget = {title: 'notes', view: "components/notes/notes.html", show: true, expand: true, parent: 'smallerWidget', order: 4};
    w.messagingWidget = {title: 'messaging', view: "components/messaging/messaging.html", show: false, expand: true, parent: 'smallerWidget', order: 5};
    var defaultLayout = new Object();

    defaultLayout['DEFAULT'] = {widgets: w, program: 'DEFAULT'};

    var programStageLayout = {};

    var getDefaultLayout = function(customLayout){
        var dashboardLayout = {customLayout: customLayout, defaultLayout: defaultLayout};
        var promise = $http.get(  DHIS2URL + '/dataStore/tracker-capture/keyTrackerDashboardDefaultLayout' ).then(function(response){
            angular.extend(dashboardLayout.defaultLayout, response.data);
            return dashboardLayout;
        }, function(){
            return dashboardLayout;
        });
        return promise;
    };

    return {
        saveLayout: function(dashboardLayout, saveAsDefault){
            if(saveAsDefault) {
                var url = DHIS2URL + '/dataStore/tracker-capture/keyTrackerDashboardDefaultLayout';
                var promise = $http({
                    method: "put",
                    url: url,
                    data: dashboardLayout,
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){
                    return response.data;
                },function(error){
                    var promise = $http({
                        method: "post",
                        url: url,
                        data: dashboardLayout,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function(response){
                        return response.data;
                    },function(error){
                        var errorMsgHdr, errorMsgBody;
                        errorMsgHdr = $translate.instant("error");
                        if(saveAsDefault) {
                            errorMsgBody = $translate.instant("dashboard_layout_not_saved_as_default");
                        } else {
                            errorMsgBody = $translate.instant("dashboard_layout_not_saved");
                        }
                        NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                        return null;
                    });
                    return promise;
                });
                return promise;
            } else {
                var url = DHIS2URL + '/userSettings/keyTrackerDashboardLayout';
                var promise = $http({
                    method: "post",
                    url: url,
                    data: dashboardLayout,
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){
                    return response.data;
                },function(error){
                    var errorMsgHdr, errorMsgBody;
                    errorMsgHdr = $translate.instant("error");
                    if(saveAsDefault) {
                        errorMsgBody = $translate.instant("dashboard_layout_not_saved_as_default");
                    } else {
                        errorMsgBody = $translate.instant("dashboard_layout_not_saved");
                    }
                    NotificationService.showNotifcationDialog(errorMsgHdr, errorMsgBody);
                    return null;
                });
                return promise;
            }
        },
        get: function(){
            var promise = $http.get(  DHIS2URL + '/userSettings/keyTrackerDashboardLayout' ).then(function(response){
                return getDefaultLayout(response.data);
            }, function(){
                return getDefaultLayout(null);
            });
            return promise;
        },
        getLockedList: function() {
            var promise = $http.get(  DHIS2URL + '/dataStore/tracker-capture/keyDefaultLayoutLocked' ).then(function(response){
                return response.data;
            }, function(){
                return null;
            });
            return promise;
        },
        saveLockedList: function(list) {
            var url = DHIS2URL + '/dataStore/tracker-capture/keyDefaultLayoutLocked';
            var promise = $http({
                method: "put",
                url: url,
                data: list,
                headers: {'Content-Type': 'application/json'}
            }).then(function(response){
                return response.data;
            },function(error){
                var promise = $http({
                    method: "post",
                    url: url,
                    data: list,
                    headers: {'Content-Type': 'application/json'}
                }).then(function(response){
                    return response.data;
                },function(error){
                    return null;
                });
                return promise;
            });
            return promise;
        },
        getProgramStageLayout: function() {
            return programStageLayout;
        },
        setProgramStageLayout: function(layoutToSet) {
            programStageLayout = layoutToSet;
        }
    };
})

.service('DasboardWidgetService', function() {
    var dashboardUpdateCallback;
    var numberOfWidgetsReady = 0;
    return {
        registerDashboardUpdateCallback: function (callback) {
            numberOfWidgetsReady = 0;
            dashboardUpdateCallback = callback;
        },
        updateDashboard: function () {
            numberOfWidgetsReady++;
            dashboardUpdateCallback(numberOfWidgetsReady);
        }
    }
})

/* current selections */
.service('PeriodService', function(DateUtils, CalendarService, $filter){

    var calendarSetting = CalendarService.getSetting();

    var splitDate = function(dateValue){
        if(!dateValue){
            return;
        }
        var calendarSetting = CalendarService.getSetting();

        return {year: moment(dateValue, calendarSetting.momentFormat).year(), month: moment(dateValue, calendarSetting.momentFormat).month(), week: moment(dateValue, calendarSetting.momentFormat).week(), day: moment(dateValue, calendarSetting.momentFormat).day()};
    };

    function processPeriodsForEvent(periods,event){
        var index = -1;
        var occupied = null;
        for(var i=0; i<periods.length && index === -1; i++){
            if(moment(periods[i].endDate).isSame(event.sortingDate) ||
                moment(periods[i].startDate).isSame(event.sortingDate) ||
                moment(periods[i].endDate).isAfter(event.sortingDate) && moment(event.sortingDate).isAfter(periods[i].endDate)){
                index = i;
                occupied = angular.copy(periods[i]);
            }
        }

        if(index !== -1){
            periods.splice(index,1);
        }

        return {available: periods, occupied: occupied};
    };

    this.getPeriods = function(events, stage, enrollment, _periodOffset){

        if(!stage || !enrollment){
            return;
        }

        var referenceDate = enrollment.incidentDate ? enrollment.incidentDate : enrollment.enrollmentDate;
        var offset = stage.minDaysFromStart;

        if(stage.generatedByEnrollmentDate){
            referenceDate = enrollment.enrollmentDate;
        }

        var occupiedPeriods = [];
        var availablePeriods = [];
        var hasFuturePeriod = false;
        if(!stage.periodType){
            angular.forEach(events, function(event){
                occupiedPeriods.push({event: event.event, name: event.sortingDate, stage: stage.id});
            });
        }
        else{

            var startDate = DateUtils.format( moment(referenceDate, calendarSetting.momentFormat).add(offset, 'days') );
            var periodOffset = _periodOffset && dhis2.validation.isNumber( _periodOffset ) ? _periodOffset : splitDate(startDate).year - splitDate(DateUtils.getToday()).year;
            var eventDateOffSet = moment(referenceDate, calendarSetting.momentFormat).add('d', offset)._d;
            eventDateOffSet = $filter('date')(eventDateOffSet, calendarSetting.keyDateFormat);

            //generate availablePeriods
            var pt = new PeriodType();
            var d2Periods = pt.get(stage.periodType).generatePeriods({offset: periodOffset, filterFuturePeriods: false, reversePeriods: false});

            angular.forEach(d2Periods, function(p){
                p.endDate = DateUtils.formatFromApiToUser(p.endDate);
                p.startDate = DateUtils.formatFromApiToUser(p.startDate);

                if(moment(p.endDate, calendarSetting.momentFormat).isAfter(moment(eventDateOffSet,calendarSetting.momentFormat))){
                    availablePeriods.push( p );
                }

                if( !hasFuturePeriod && moment(p.endDate, calendarSetting.momentFormat).isAfter(DateUtils.getToday())){
                    hasFuturePeriod = true;
                }
            });

            //get occupied periods
            angular.forEach(events, function(event){
                var ps = processPeriodsForEvent(availablePeriods, event);
                availablePeriods = ps.available;
                if(ps.occupied){
                    occupiedPeriods.push(ps.occupied);
                }
            });
        }

        return {occupiedPeriods: occupiedPeriods, availablePeriods: availablePeriods, periodOffset: periodOffset, hasFuturePeriod: hasFuturePeriod};
    };

    this.managePeriods = function( periods, isNewEvent ){

        //remove future periods
        if( isNewEvent ){
            periods = $filter('removeFuturePeriod')(periods, {endDate: DateUtils.getToday()});
        }

        return periods;
    };
})

/* Factory to fetch optionSets */
.factory('OptionSetService', function($q, $rootScope, TCStorageService) {
    return {
        getAll: function(){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll('optionSets').done(function(optionSets){
                    $rootScope.$apply(function(){
                        def.resolve(optionSets);
                    });
                });
            });

            return def.promise;
        },
        get: function(uid){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.get('optionSets', uid).done(function(optionSet){
                    $rootScope.$apply(function(){
                        def.resolve(optionSet);
                    });
                });
            });
            return def.promise;
        },
        getCode: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].displayName){
                        return options[i].code;
                    }
                }
            }
            return key;
        },
        getName: function(options, key){
            if(options){
                for(var i=0; i<options.length; i++){
                    if( key === options[i].code){
                        return options[i].displayName;
                    }
                }
            }
            return key;
        }
    };
})

/* Factory to fetch relationships */
.factory('RelationshipFactory', function($q, $http, $rootScope, $translate, TCStorageService, NotificationService) {
    var errorHeader = $translate.instant("error");
    return {
        getAll: function(){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll('relationshipTypes').done(function(relationshipTypes){
                    $rootScope.$apply(function(){
                        def.resolve(relationshipTypes);
                    });
                });
            });

            return def.promise;
        },
        get: function(uid){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.get('relationshipTypes', uid).done(function(relationshipType){
                    $rootScope.$apply(function(){
                        def.resolve(relationshipType);
                    });
                });
            });
            return def.promise;
        },
        delete: function(uid){
            var promise = $http
                .delete( DHIS2URL + '/relationships/' +  uid)
                .then(function(response){
                    if(!response || !response.data || response.data.status !== 'OK'){
                        var errorBody = $translate.instant('failed_to_delete_relationship');
                        NotificationService.showNotifcationDialog(errorHeader, errorBody);
                        return $q.reject(errorBody);
                    }
                    return response && response.data;
                }, function(error) {
                    var errorBody = $translate.instant('failed_to_delete_relationship');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody);
                    return $q.reject(error);
                });
            return promise;
        }
    };
})

/* Factory to fetch programs */
.factory('ProgramFactory', function($q, $rootScope, $location, SessionStorageService, TCStorageService, orderByFilter, OrgUnitFactory, CommonUtils) {
    var access = null;
    return {
        get: function(uid){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.get('programs', uid).done(function(pr){
                    $rootScope.$apply(function(){
                        def.resolve(pr);
                    });
                });
            });
            return def.promise;
        },
        getAllAccesses: function(){
            var def = $q.defer();
            if(access){
                def.resolve(access);
            }else{
                TCStorageService.currentStore.open().done(function(){
                    TCStorageService.currentStore.getAll('programAccess').done(function(programAccess){
                        access = { programsById: {}, programStagesById: {}, programIdNameMap: {}};
                        angular.forEach(programAccess, function(program){
                            access.programsById[program.id] = program.access;
                            access.programIdNameMap[program.id] = program.displayName;
                            angular.forEach(program.programStages, function(programStage){
                                access.programStagesById[programStage.id] = programStage.access;
                            });
                        });
                        def.resolve(access);
                    });
                });
            }
            return def.promise;
            
        },
        getAll: function(){
            var roles = SessionStorageService.get('USER_PROFILE');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();

            this.getAllAccesses().then(function(accesses){
                TCStorageService.currentStore.open().done(function(){
                    TCStorageService.currentStore.getAll('programs').done(function(prs){
                        var programs = [];
                        angular.forEach(prs, function(pr){
                            if(accesses.programsById[pr.id] && accesses.programsById[pr.id].data.read){
                                if(pr.programTrackedEntityAttributes){
                                    pr.programTrackedEntityAttributes = pr.programTrackedEntityAttributes.filter(function(attr){
                                        return attr.access && attr.access.read;
                                    });
                                }
                                pr.access = accesses.programsById[pr.id];
                                var accessiblePrs = [];
                                angular.forEach(pr.programStages, function(prs){
                                    if(accesses.programStagesById[prs.id] && accesses.programStagesById[prs.id].data.read){
                                        if(prs.programStageDataElements){
                                            prs.programStageDataElements = prs.programStageDataElements.filter(function(de){
                                                return de.access && de.access.read;
                                            });
                                        }
                                        prs.access = accesses.programStagesById[prs.id];
                                        accessiblePrs.push(prs);
                                    }
                                });
                                pr.programStages = accessiblePrs;
                                programs.push(pr);
                            }
                        });
                        programs = orderByFilter(programs, '-displayName').reverse();
    
                        $rootScope.$apply(function(){
                            def.resolve({programs: programs});
                        });
                    });
                });
            });
            return def.promise;
        },

        getProgramsByOu: function(ou,loadSelectedProgram, selectedProgram){
            var roles = SessionStorageService.get('USER_PROFILE');
            var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
            var def = $q.defer();

            this.getAllAccesses().then(function(accesses){
                TCStorageService.currentStore.open().done(function(){
                    TCStorageService.currentStore.getAll('programs').done(function(prs){
                        var programs = [];
                        var teiFromURL = ($location.search()).tei;
                        angular.forEach(prs, function(pr){
                            if( (loadSelectedProgram && selectedProgram && pr.id == selectedProgram.id && teiFromURL) ||
                                (pr.organisationUnits && pr.organisationUnits.hasOwnProperty( ou.id ) && accesses.programsById[pr.id] && accesses.programsById[pr.id].data.read) ){
                                if(pr.programTrackedEntityAttributes){
                                    pr.programTrackedEntityAttributes = pr.programTrackedEntityAttributes.filter(function(attr){
                                        return attr.access && attr.access.read;
                                    });
                                }
                                pr.access = accesses.programsById[pr.id];
                                var accessiblePrs = [];
                                angular.forEach(pr.programStages, function(prs){
                                    if(accesses.programStagesById[prs.id] && accesses.programStagesById[prs.id].data.read){
                                        if(prs.programStageDataElements){
                                            prs.programStageDataElements = prs.programStageDataElements.filter(function(de){
                                                return de.access && de.access.read;
                                            });
                                        }
                                        prs.access = accesses.programStagesById[prs.id];
                                        accessiblePrs.push(prs);
                                    }
                                });
                                pr.allProgramStagesMetadataRead = pr.programStages;
                                pr.programStages = accessiblePrs;
                                programs.push(pr);
                            }
                        });
                        programs = orderByFilter(programs, '-displayName').reverse();
                        if(loadSelectedProgram){
                            if(programs.length === 0){
                                selectedProgram = null;
                            }
                            else if(programs.length === 1){
                                selectedProgram = programs[0];
                            }
                            else{
                                if(selectedProgram){
                                    var continueLoop = true;
                                    for(var i=0; i<programs.length && continueLoop; i++){
                                        if(programs[i].id === selectedProgram.id){
                                            selectedProgram = programs[i];
                                            continueLoop = false;
                                        }
                                    }
                                    if(continueLoop){
                                        selectedProgram = null;
                                    }
                                }
                            }
        
                            if(!selectedProgram || angular.isUndefined(selectedProgram) && programs.length > 0){
                                selectedProgram = programs[0];
                            }
                        }
    
                        $rootScope.$apply(function(){
                            def.resolve({programs: programs, selectedProgram: selectedProgram});
                        });
                    });
                });
            });
            return def.promise;
        },
        extendWithSearchGroups: function(programs, attributesById){
            angular.forEach(programs, function(program){
                var searchGroups = [];
                var group = { attributes: []};
                if(program.programAttributes){
                    angular.forEach(program.attributes, function(programAttribute){
                        var attr = attributesById[programAttribute.attribute];
                        if(attr.unique){
                            searchGroups.push({ attributes: [teAttribute]});
                        }else if(programAttribute.searchable){
                            group.attributes.push(programAttribute);
                        }
                    });
                }
            });
        }
    };
})

/* service to deal with TEI registration and update */
.service('RegistrationService', function(TEIService, $q){
    var convertFromUserToApi = function(tei){
        delete tei.enrollment;
        delete tei.programOwnersById;
        return tei;
    };

    return {
        registerOrUpdate: function(tei, optionSets, attributesById, programId){
            var apiTei = convertFromUserToApi(angular.copy(tei));
            if(apiTei){
                var def = $q.defer();
                if(apiTei.trackedEntityInstance){
                    TEIService.update(apiTei, optionSets, attributesById, programId).then(function(response){
                        def.resolve(response);
                    });
                }
                else{
                    TEIService.register(apiTei, optionSets, attributesById).then(function(response){
                        def.resolve(response);
                    });
                }
                return def.promise;
            }
        },
        processForm: function(existingTei, formTei, originalTei, attributesById){
            var tei = angular.copy(existingTei);
            tei.attributes = [];
            var formEmpty = true;
            for(var k in attributesById){
                if( k in formTei ){
                    var att = attributesById[k];
                    tei.attributes.push({attribute: att.id, value: formTei[k], displayName: att.displayName, valueType: att.valueType});
                    formEmpty = false;
                }
                delete tei[k];
            }
            formTei.attributes = tei.attributes;

            var formChanged = false;
            if (originalTei) {
                for (var k in attributesById) {
                    if (formTei[k] !== originalTei[k]) {
                        if (!formEmpty) {
                            formChanged = true;
                            break;
                        }
                        if (formEmpty && (formTei[k] || originalTei[k])) {
                            formChanged = true;
                            break;
                        }
                    }
                }
                angular.forEach(originalTei.attributes, function (att) {
                    if (tei[att.attribute]) {
                        delete tei[att.attribute];
                    }
                });
            }
            return {tei: tei, formEmpty: formEmpty, formChanged: formChanged};
        }
    };
})

/* Service to deal with enrollment */
.service('EnrollmentService', function($http, DHIS2URL, DateUtils, NotificationService, $translate, TeiAccessApiService) {

    var convertFromApiToUser = function(enrollment){
        if(enrollment.enrollments){
            angular.forEach(enrollment.enrollments, function(enrollment){
                enrollment.incidentDate = DateUtils.formatFromApiToUser(enrollment.incidentDate);
                enrollment.enrollmentDate = DateUtils.formatFromApiToUser(enrollment.enrollmentDate);
            });
        }
        else{
            enrollment.incidentDate = DateUtils.formatFromApiToUser(enrollment.incidentDate);
            enrollment.enrollmentDate = DateUtils.formatFromApiToUser(enrollment.enrollmentDate);
        }

        return enrollment;
    };
    var convertFromUserToApi = function(enrollment){
        enrollment.incidentDate = DateUtils.formatFromUserToApi(enrollment.incidentDate);
        enrollment.enrollmentDate = DateUtils.formatFromUserToApi(enrollment.enrollmentDate);
        delete enrollment.orgUnitName;
        delete enrollment.events;
        return enrollment;
    };
    var errorHeader = $translate.instant("error");
    return {
        get: function(enrollmentUid, teiUid, programUid){
            var url = DHIS2URL + '/enrollments/' + enrollmentUid;
            return TeiAccessApiService.get(teiUid, programUid, url).then(function(response){
                return convertFromApiToUser(response.data);
            }, function(response){
                var errorBody = $translate.instant('failed_to_fetch_enrollment');
                if (response && response.data && response.data.status === 'ERROR') {
                    if (response.data.message) {
                        errorBody = response.data.message
                    }
                }
                NotificationService.showNotifcationDialog(errorHeader, errorBody);
                return null;
            });
        },
        getByStartAndEndDate: function( program, orgUnit, ouMode, startDate, endDate, pageSize ){
            var paging = pageSize ? '&pageSize=' + pageSize : '&paging=false'
            var promise = $http.get(  DHIS2URL + '/enrollments.json?program=' + program + '&ou=' + orgUnit + '&ouMode='+ ouMode + '&programStartDate=' + startDate + '&programEndDate=' + endDate + '&fields=:all' + paging).then(function(response){
                return convertFromApiToUser(response.data);
            }, function(response){
                var errorBody = $translate.instant('failed_to_fetch_enrollment');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        enroll: function( enrollment ){
            var en = convertFromUserToApi(angular.copy(enrollment));
            var promise = TeiAccessApiService.post(enrollment.trackedEntityInstance, enrollment.program,  DHIS2URL + '/enrollments', en ).then(function(response){
                return response.data;
            }, function(response){
                var errorBody = $translate.instant('failed_to_save_enrollment');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        update: function( enrollment ){
            var en = convertFromUserToApi(angular.copy(enrollment));
            delete en.notes;
            var promise = TeiAccessApiService.put(enrollment.trackedEntityInstance, enrollment.program, DHIS2URL + '/enrollments/' + en.enrollment , en ).then(function(response){
                return response.data;
            }, function(response){
                var errorBody = $translate.instant('failed_to_update_enrollment');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        delete: function(enrollment){
            var promise = TeiAccessApiService.delete(enrollment.trackedEntityInstance, enrollment.program, DHIS2URL + '/enrollments/' + enrollment.enrollment).then(function(response){
                return response.data;
            }, function (response) {
                if (response && response.data && response.data.status === 'ERROR') {
                    var errorBody = $translate.instant('failed_to_delete_enrollment');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                }

                return response.data;
            });
            return promise;
        },
        updateForNote: function( enrollment ){
            var promise = TeiAccessApiService.post(enrollment.trackedEntityInstance, enrollment.program, DHIS2URL + '/enrollments/' + enrollment.enrollment + '/note', enrollment).then(function(response){
                return response.data;
            }, function(response){
                var errorBody = $translate.instant('failed_to_update_enrollment');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        }
    };
})
.factory('EnrollmentUtils', function(){
    return {
        isExpired: function(program, enrollment){

        }
    }
})


.factory('TeiAccessApiService', function($http,$q,$modal){
    var auditCancelledSettings = {};
    var needAuditError = {
        code: 401,
        message: "OWNERSHIP_ACCESS_DENIED"
    }
    var modalDefaultSettings = {
        templateUrl: 'components/teiAudit/tei-audit.html',
        controller: 'TeiAuditController'
    }
    var getModalSettings = function(tei,program){
        return {
            templateUrl: 'components/teiAudit/tei-audit.html',
            controller: 'TeiAuditController',
            resolve: {
                tei: function(){
                    return tei;
                },
                program: function(){
                    return program;
                },
                auditCancelledSettings: function(){
                    return auditCancelledSettings
                }
            }
        }
    }

    var handleSuccess = function(response){
        return response;
    }
    var handleError = function(error,tei,program, postAuditApiFn){
        if(error && error.data && error.data.httpStatusCode === needAuditError.code && error.data.message === needAuditError.message){
            return handleAudit(tei,program,postAuditApiFn);
        }else{
            var def = $q.defer();
            def.reject(error);
            return def.promise;
        }
    }

    var saveAuditMessage = function(tei,program,auditMessage){
        var obj = {}; /*{
            tei: tei,
            program: program,
            reason: auditMessage
        }*/
        return $http.post(DHIS2URL+'/tracker/ownership/override?trackedEntityInstance='+tei+'&program='+program+'&reason='+auditMessage, obj);
    }

    var handleAudit = function(tei,program, postAuditApiFn){
        return $modal.open(getModalSettings(tei,program)).result.then(function(result){
            return saveAuditMessage(tei,program,result.auditMessage).then(function(result){
                return callApi(postAuditApiFn, tei,program);
            }, function(error){
                var def = $q.defer();
                def.reject(error);
                return def.promise;
            });
        }, function(error){
            var def = $q.defer();
            def.reject(error);
            return def.promise;
        });
    }

    var service = {};

    var callApi = function(apiFn,tei,program){        
        return apiFn().then(function(response){
            return response;
        },function(error){
            return handleError(error,tei,program, apiFn);
        });
    }

    service.setAuditCancelledSettings = function(settings){
        auditCancelledSettings = settings;
    }
    service.get = function(tei, program, url){
        return callApi(function() { return $http.get(url) }, tei, program);
    }

    service.post = function(tei,program,url, data){
        return callApi(function() { return $http.post(url, data) }, tei, program);
    }

    service.put = function(tei,program,url, data){
        return callApi(function() { return $http.put(url, data) }, tei, program);
    }

    service.delete = function(tei,program,url, data){
        return callApi(function() { return $http.delete(url, data) }, tei, program);
    }
    return service;
})
/* Service for getting tracked entity */
.factory('TEService', function(TCStorageService, $q, $rootScope, AttributesFactory) {
    var allAccesses = null;
    return {
        getAll: function(){
            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){

                TCStorageService.currentStore.getAll('trackedEntityTypes').done(function(entities){
                    $rootScope.$apply(function(){
                        
                        def.resolve(entities);
                    });
                });
            });
            return def.promise;

        },
        get: function(uid){
            var def = $q.defer();
            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.get('trackedEntityTypes', uid).done(function(te){
                    def.resolve(te);
                });
            });
            return def.promise;
        },
        extendWithSearchGroups: function(trackedEntityTypes, attributesById){
            angular.forEach(trackedEntityTypes, function(te){
                var searchGroups = [];
                var group = { attributes: []};
                if(te.attributes){
                    angular.forEach(te.attributes, function(teAttribute){
                        var attr = attributesById[teAttribute.attribute];
                        var searchAttribute = teAttribute;
                        searchAttribute.attribute = angular.copy(attr);
                        if(attr.unique){
                            searchGroups.push({ attributes: [searchAttribute]});
                        }else if(searchAttribute.searchable){
                            group.attributes.push(searchAttribute);
                        }
                    });
                }
            });
        }
    };
})

/* Service for getting tracked entity instances */
.factory('TEIService', function($http, $translate, DHIS2URL, $q, AttributesFactory, CommonUtils, CurrentSelection, DateUtils, NotificationService, TeiAccessApiService) {
    var cachedTeiWithProgramData = null;
    var errorHeader = $translate.instant("error");
    var getSearchUrl = function(type,ouId, ouMode, queryUrl, programOrTETUrl, attributeUrl, pager, paging, format){
        var baseUrl = DHIS2URL + '/trackedEntityInstances/'+type;
        var url = baseUrl;
        var deferred = $q.defer();
        
        if (format === "csv") {
            url = url+'.csv?ou=' + ouId + '&ouMode=' + ouMode;
        } else if (format === "xml") {
            url = url+'.json?ou=' + ouId + '&ouMode=' + ouMode;
        }else {
            url = url+'.json?ou=' + ouId + '&ouMode=' + ouMode;
        }

        if(queryUrl){
            url = url + '&'+ queryUrl;
        }
        if(programOrTETUrl){
            url = url + '&' + programOrTETUrl;
        }
        if(attributeUrl){
            url = url + '&' + attributeUrl;
        }
        if(paging){
            var pgSize = (pager && pager.pageSize) || 50;
            var pg = (pager && pager.page) || 1;
            pgSize = pgSize > 1 ? pgSize  : 1;
            pg = pg > 1 ? pg : 1;
            url = url + '&pageSize=' + pgSize + '&page=' + pg;
            if(pager && pager.skipTotalPages) {
                url+= '&totalPages=false';
            }else{
                url+= '&totalPages=true';
            }
        }
        else{
            url = url + '&paging=false';
        }
        return url;
    }
    var setTeiAttributeValues = function(teiAttributes, optionSets, attributesById){
        teiAttributes.forEach(function(att) {
            if(attributesById[att.attribute]){
                att.displayName = attributesById[att.attribute].displayName;
                att.value = CommonUtils.formatDataValue(null, att.value, attributesById[att.attribute], optionSets, 'USER');
            }
        });
    }

    var convertFromUserToApi = function(tei){
        delete tei.enrollments;
        delete tei.programOwnersById;
        return tei;
    }
    return {
        getWithProgramData: function(entityUid, programUid, optionSets, attributesById, useCached){
            if(useCached && cachedTeiWithProgramData && cachedTeiWithProgramData.entityUid === entityUid && cachedTeiWithProgramData.programUid === programUid){
                var def = $q.defer();
                def.resolve(cachedTeiWithProgramData.data);
                return def.promise;
            }
            return TeiAccessApiService.get(entityUid, programUid, DHIS2URL+'/trackedEntityInstances/'+entityUid+'.json?program='+programUid+'&fields=*').then(function(response){
                var tei = response.data;
                setTeiAttributeValues(tei.attributes, optionSets, attributesById);
                if(tei.enrollments){
                    tei.enrollments.forEach(function(e) {
                        e.incidentDate = DateUtils.formatFromApiToUser(e.incidentDate);
                        e.enrollmentDate = DateUtils.formatFromApiToUser(e.enrollmentDate);
                    });
                }
                if(tei.programOwners){
                    tei.programOwnersById = tei.programOwners.reduce(function(map,po) {
                        map[po.program] = po.ownerOrgUnit;
                        return map;
                    }, {});
                }

                cachedTeiWithProgramData = {
                    entityUid: entityUid,
                    programUid: programUid,
                    data: tei
                }

                return tei;
            }, function(error){
                var def = $q.defer();
                def.reject(error);
                return def.promise;
            });
        },
        flushCachedTei: function() {
            cachedTeiWithProgramData = {};
        },
        get: function(entityUid, optionSets, attributesById){
            var promise = $http.get( DHIS2URL + '/trackedEntityInstances/' +  entityUid + '.json').then(function(response){
                var tei = response.data;
                setTeiAttributeValues(tei.attributes, optionSets, attributesById);
                return tei;

            }, function(error){
                if(error){
                    var headerText = errorHeader;
                    var bodyText = $translate.instant('access_denied');

                    if(error.statusText) {
                        headerText = error.statusText;
                    }
                    if(error.data && error.data.message) {
                        bodyText = error.data.message;
                    }
                    NotificationService.showNotifcationDialog( headerText,  bodyText);
                }
            });

            return promise;
        },
        getRelationships: function(uid) {
            var promise = $http.get( DHIS2URL + '/trackedEntityInstances/' + uid + '.json?fields=relationships').then(function(response){
                var tei = response.data;
                return tei.relationships;
            });
            return promise;
        },
        saveRelationship: function(relationship) {
            var promise = $http.post( DHIS2URL + '/relationships', relationship).then(function(response){
                return response.data;
            });
            return promise;
        },
        getPotentialDuplicatesForTei: function(uid) {
            var promise = $http.get( DHIS2URL + '/potentialDuplicates?teis=' + uid ).then(function(response){
                return response.data;
            });
            return promise;
        },
        markPotentialDuplicate: function(tei, isDuplicate) {
            tei.potentialDuplicate = isDuplicate;
            var formattedTei = convertFromUserToApi(angular.copy(tei));
            var promise = $http.put( DHIS2URL + '/trackedEntityInstances/' + tei.id, formattedTei).then(function(response){
                return response.data;
            });
            return promise;
        },
        delete: function(entityUid){
            var promise = $http.delete(DHIS2URL + '/trackedEntityInstances/' + entityUid).then(function(response){
                return response.data;
            }, function (response) {
                var errorBody;
                if (response && response.data && response.data.status === 'ERROR') {
                    errorBody = $translate.instant('delete_error_audit');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                }

                return response.data;
            });
            return promise;
        },
        searchCount: function(ouId, ouMode, queryUrl, programOrTETUrl, attributeUrl, pager, paging, format){
            var url = getSearchUrl("count",ouId, ouMode,queryUrl, programOrTETUrl, attributeUrl, pager, paging, format);
            return $http.get( url ).then(function(response)
            {
                if(response && response.data) return response.data;
                return 0;
            });
        },
        search: function(ouId, ouMode, queryUrl, programOrTETUrl, attributeUrl, pager, paging, format, attributesList, attrNamesIdMap, optionSets) {
            var deferred = $q.defer();
            var url = getSearchUrl("query",ouId, ouMode,queryUrl, programOrTETUrl, attributeUrl, pager, paging, format);
            $http.get( url ).then(function(response){
                var xmlData, rows, headers, index, itemName, value, jsonData;
                var trackedEntityInstance, attributesById;
                if (format) {
                    attributesById = CurrentSelection.getAttributesById();
                    if (format === "json") {
                        jsonData = {"trackedEntityInstances": []};
                        rows = response.data.rows;
                        headers = response.data.headers;
                        for (var i = 0; i < rows.length; i++) {
                            trackedEntityInstance = null;
                            for (var j = 0; j < rows[i].length; j++) {
                                index = attributesList.indexOf(headers[j].name);
                                itemName = headers[j].column;
                                value = rows[i][j].replace(/&/g, "&amp;");
                                if (attributesById[headers[j].name]) {
                                    value = CommonUtils.formatDataValue(null, value, attributesById[headers[j].name], optionSets, 'USER');
                                } else if ((headers[j].name === "created") || ((headers[j].name === "lastupdated"))) {
                                    value = DateUtils.formatFromApiToUser(value);
                                }

                                if (trackedEntityInstance === null) {
                                    trackedEntityInstance = {};
                                }

                                if (index > -1) {
                                    if (!trackedEntityInstance["attributes"]) {
                                        trackedEntityInstance["attributes"] = [];
                                    }
                                    trackedEntityInstance["attributes"].push({
                                        id: attrNamesIdMap[itemName], name: itemName,
                                        value: value
                                    });
                                } else {
                                    trackedEntityInstance[headers[j].name] = value;
                                }
                            }
                            if (trackedEntityInstance !== null) {
                                jsonData["trackedEntityInstances"].push(trackedEntityInstance);
                            }
                        }
                        if (jsonData) {
                            deferred.resolve(JSON.stringify(jsonData, null, 2));
                        }
                    } else if (format === "xml") {
                        xmlData = "";
                        if (response.data && response.data.rows) {
                            xmlData += "<trackedEntityInstances>";
                            rows = response.data.rows;
                            headers = response.data.headers;
                            for (var i = 0; i < rows.length; i++) {
                                xmlData += "<trackedEntityInstance>";
                                for (var j = 0; j < rows[i].length; j++) {
                                    index = attributesList.indexOf(headers[j].name);
                                    itemName = headers[j].column;
                                    value = rows[i][j].replace(/&/g, "&amp;");
                                    if (attributesById[headers[j].name]) {
                                        value = CommonUtils.formatDataValue(null, value, attributesById[headers[j].name], optionSets, 'USER');
                                    } else if ((headers[j].name === "created") || ((headers[j].name === "lastupdated"))) {
                                        value = DateUtils.formatFromApiToUser(value);
                                    }
                                    if (index > -1) {
                                        xmlData += '<attribute id="' + attrNamesIdMap[itemName] + '" ' +
                                            'name="' + itemName + '" value="' + value + '"></attribute>';
                                    } else {
                                        xmlData += '<' + headers[j].name + ' value="' + value + '"></' + headers[j].name + '>';
                                    }

                                }
                                xmlData += "</trackedEntityInstance>";

                            }
                            xmlData += "</trackedEntityInstances>";
                            deferred.resolve(xmlData);
                        }
                    } else if (format === "csv") {
                        deferred.resolve(response.data);
                    }
                } else {
                    deferred.resolve(response.data);
                }
            }, function(error){
                if(error && error.status === 403){
                    NotificationService.showNotifcationDialog( $translate.instant('error'),  $translate.instant('access_denied'));
                }
                deferred.reject(error);
            });
            return deferred.promise;
        },
        update: function(tei, optionSets, attributesById, programId){
            var formattedTei = convertFromUserToApi(angular.copy(tei));
            var attributes = [];
            angular.forEach(formattedTei.attributes, function(att){
                attributes.push({attribute: att.attribute, value: CommonUtils.formatDataValue(null, att.value, attributesById[att.attribute], optionSets, 'API')});
            });
            formattedTei.attributes = attributes;
            var programFilter = programId ? "?program=" + programId : "";
            var promise = $http.put( DHIS2URL + '/trackedEntityInstances/' + formattedTei.trackedEntityInstance + programFilter, formattedTei ).then(function(response){
                return response.data;
            }, function(response){
                NotificationService.showNotifcationDialog($translate.instant('update_error'), $translate.instant('failed_to_update_tei'), response);
                return null;
            });
            return promise;
        },
        register: function(tei, optionSets, attributesById){
            var formattedTei = convertFromUserToApi(angular.copy(tei));
            var attributes = [];
            angular.forEach(formattedTei.attributes, function(att){
                attributes.push({attribute: att.attribute, value: CommonUtils.formatDataValue(null, att.value, attributesById[att.attribute], optionSets, 'API')});
            });

            formattedTei.attributes = attributes;
            var promise = $http.post( DHIS2URL + '/trackedEntityInstances' , formattedTei ).then(function(response){
                return response.data;
            }, function(response){
                return response.data;
            });
            return promise;
        },
        processAttributes: function(selectedTei, selectedProgram, selectedEnrollment){
            var def = $q.defer();
            if(selectedTei.attributes){
                if(selectedProgram && selectedEnrollment){
                    //show attribute for selected program and enrollment
                    AttributesFactory.getByProgram(selectedProgram).then(function(atts){
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, true);
                        def.resolve(selectedTei);
                    });
                }
                if(selectedProgram && !selectedEnrollment){
                    //show attributes for selected program
                    AttributesFactory.getByProgram(selectedProgram).then(function(atts){
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, false);
                        def.resolve(selectedTei);
                    });
                }
                if(!selectedProgram && !selectedEnrollment){
                    //show attributes in no program
                    AttributesFactory.getWithoutProgram().then(function(atts){
                        selectedTei.attributes = AttributesFactory.showRequiredAttributes(atts,selectedTei.attributes, false);
                        def.resolve(selectedTei);
                    });
                }
            }
            return def.promise;
        },
        changeTeiProgramOwner: function(tei, program,ou){
            CurrentSelection.currentSelection.tei.programOwnersById[program] = ou;
            var url =  DHIS2URL+'/tracker/ownership/transfer?trackedEntityInstance='+tei+'&program='+program+'&ou='+ou;
            return $http.put(url,{});
        },

        pushToAggregatedDataValue: function( eventDataValue ){
            var deferred = $q.defer();
            //eventDataValue.program,eventDataValue.programStage
            //program "XdyicAxrGPC" programStage "Oy7oALmesOu"
            let dataValues = [];
            let tempEventDate = new Date(eventDataValue.eventDate);
            let quarter =  parseInt(tempEventDate.getMonth() / 3 ) + 1;
            let tempPeriod = parseInt(tempEventDate.getFullYear()) + "Q" + quarter;
            console.log(quarter);
            // PHC
            if (eventDataValue.program === 'XdyicAxrGPC' && eventDataValue.programStage === 'Oy7oALmesOu') {

                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'MgBNehilt4X';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValuePHCPlanningsExAnte = {};
                        dataValuePHCPlanningsExAnte.dataElement = 'RatMTqCbdoP';
                        dataValuePHCPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValuePHCPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValuePHCPlan_ExecutionExAnte = {};
                        dataValuePHCPlan_ExecutionExAnte.dataElement = 'NWVTwAuFhu8';
                        dataValuePHCPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValuePHCPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValuePHCAssesmentExAnte = {};
                        dataValuePHCAssesmentExAnte.dataElement = 'KyLrsPRsaOy';
                        dataValuePHCAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValuePHCAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCAssesmentExAnte);
                    }
                    if (eventDataValue.pMGCVgtvVOS !== '' && eventDataValue.pMGCVgtvVOS !== undefined) {
                        let dataValuePHCHWC_CBACExAnte = {};
                        dataValuePHCHWC_CBACExAnte.dataElement = 'O6uZ5wJSIDM';
                        dataValuePHCHWC_CBACExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_CBACExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_CBACExAnte.value = eventDataValue.pMGCVgtvVOS;
                        dataValuePHCHWC_CBACExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_CBACExAnte);
                    }

                    if (eventDataValue.cG5yglbpgRR !== '' && eventDataValue.cG5yglbpgRR !== undefined) {
                        let dataValuePHCHWC_OutreachExAnte = {};
                        dataValuePHCHWC_OutreachExAnte.dataElement = 'ywXq4mJDhC2';
                        dataValuePHCHWC_OutreachExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_OutreachExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_OutreachExAnte.value = eventDataValue.cG5yglbpgRR;
                        dataValuePHCHWC_OutreachExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_OutreachExAnte);
                    }

                    if (eventDataValue.oPZ91aEQbxC !== '' && eventDataValue.oPZ91aEQbxC !== undefined) {
                        let dataValuePHCHWC_MedicineExAnte = {};
                        dataValuePHCHWC_MedicineExAnte.dataElement = 'sRo0KYPtSSb';
                        dataValuePHCHWC_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_MedicineExAnte.value = eventDataValue.oPZ91aEQbxC;
                        dataValuePHCHWC_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_MedicineExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValuePHCLow_cost_MedicineExAnte = {};
                        dataValuePHCLow_cost_MedicineExAnte.dataElement = 'dEh5Ge4GMrr';
                        dataValuePHCLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValuePHCLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCLow_cost_MedicineExAnte);
                    }

                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValuePHCMedicine_Quality_TestExAnte = {};
                        dataValuePHCMedicine_Quality_TestExAnte.dataElement = 'fhkXHuejOe9';
                        dataValuePHCMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValuePHCMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCMedicine_Quality_TestExAnte);
                    }

                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValuePHCDrug_Store_QualityExAnte = {};
                        dataValuePHCDrug_Store_QualityExAnte.dataElement = 'uZ6gUvUnw7D';
                        dataValuePHCDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValuePHCDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValuePHCDrug_DispensationExAnte = {};
                        dataValuePHCDrug_DispensationExAnte.dataElement = 'PRsCYxCeTcx';
                        dataValuePHCDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValuePHCDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCDrug_DispensationExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValuePHCKnowledgeExAnte = {};
                        dataValuePHCKnowledgeExAnte.dataElement = 'ulBPG1KFoqF';
                        dataValuePHCKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValuePHCKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValuePHCBMWExAnte = {};
                        dataValuePHCBMWExAnte.dataElement = 'zDanki0LR8A';
                        dataValuePHCBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValuePHCBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCBMWExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValuePHCOutcome_QualityExAnte = {};
                        dataValuePHCOutcome_QualityExAnte.dataElement = 'b4yvHbtL0LP';
                        dataValuePHCOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValuePHCOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValuePHCAccountabilityExAnte = {};
                        dataValuePHCAccountabilityExAnte.dataElement = 'MiQWa6m05hn';
                        dataValuePHCAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValuePHCAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValuePHCPatient_Experience_ScoreExAnte = {};
                        dataValuePHCPatient_Experience_ScoreExAnte.dataElement = 'MncGRZOpz5P';
                        dataValuePHCPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValuePHCPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValuePHCGrievanceExAnte = {};
                        dataValuePHCGrievanceExAnte.dataElement = 'tze6k5digrL';
                        dataValuePHCGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValuePHCGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCGrievanceExAnte);
                    }

                    if (eventDataValue.SdPujxa8O9N !== '' && eventDataValue.SdPujxa8O9N !== undefined) {
                        let dataValueHMIS_ReportingExAnte = {};
                        dataValueHMIS_ReportingExAnte.dataElement = 'Rex3P2ddpnK';
                        dataValueHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueHMIS_ReportingExAnte.value = eventDataValue.SdPujxa8O9N;
                        dataValueHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueHMIS_ReportingExAnte);
                    }

                    if (eventDataValue.xSSLUxMZgqP !== '' && eventDataValue.xSSLUxMZgqP !== undefined) {
                        let dataValueNCD_ConsultationsExAnte = {};
                        dataValueNCD_ConsultationsExAnte.dataElement = 'tREbd3kCESt';
                        dataValueNCD_ConsultationsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueNCD_ConsultationsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueNCD_ConsultationsExAnte.value = eventDataValue.xSSLUxMZgqP;
                        dataValueNCD_ConsultationsExAnte.period = tempPeriod;
                        dataValues.push(dataValueNCD_ConsultationsExAnte);
                    }
                }
                // for Ex-Post Assessment
                else if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Pf2xD0Xi5mj';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValuePHCPlanningsExAnte = {};
                        dataValuePHCPlanningsExAnte.dataElement = 'DwDrjQBi90c';
                        dataValuePHCPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValuePHCPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValuePHCPlan_ExecutionExAnte = {};
                        dataValuePHCPlan_ExecutionExAnte.dataElement = 'aXKCWDX5hnu';
                        dataValuePHCPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValuePHCPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValuePHCAssesmentExAnte = {};
                        dataValuePHCAssesmentExAnte.dataElement = 'xOJUyfVSsZz';
                        dataValuePHCAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValuePHCAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCAssesmentExAnte);
                    }
                    if (eventDataValue.pMGCVgtvVOS !== '' && eventDataValue.pMGCVgtvVOS !== undefined) {
                        let dataValuePHCHWC_CBACExAnte = {};
                        dataValuePHCHWC_CBACExAnte.dataElement = 'W5GVAxG5LPb';
                        dataValuePHCHWC_CBACExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_CBACExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_CBACExAnte.value = eventDataValue.pMGCVgtvVOS;
                        dataValuePHCHWC_CBACExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_CBACExAnte);
                    }

                    if (eventDataValue.cG5yglbpgRR !== '' && eventDataValue.cG5yglbpgRR !== undefined) {
                        let dataValuePHCHWC_OutreachExAnte = {};
                        dataValuePHCHWC_OutreachExAnte.dataElement = 'kgCBnuc68Ip';
                        dataValuePHCHWC_OutreachExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_OutreachExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_OutreachExAnte.value = eventDataValue.cG5yglbpgRR;
                        dataValuePHCHWC_OutreachExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_OutreachExAnte);
                    }

                    if (eventDataValue.oPZ91aEQbxC !== '' && eventDataValue.oPZ91aEQbxC !== undefined) {
                        let dataValuePHCHWC_MedicineExAnte = {};
                        dataValuePHCHWC_MedicineExAnte.dataElement = 'aeOvRBBi8OH';
                        dataValuePHCHWC_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCHWC_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCHWC_MedicineExAnte.value = eventDataValue.oPZ91aEQbxC;
                        dataValuePHCHWC_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCHWC_MedicineExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValuePHCLow_cost_MedicineExAnte = {};
                        dataValuePHCLow_cost_MedicineExAnte.dataElement = 'PTiMIRhtJ4p';
                        dataValuePHCLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValuePHCLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCLow_cost_MedicineExAnte);
                    }

                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValuePHCMedicine_Quality_TestExAnte = {};
                        dataValuePHCMedicine_Quality_TestExAnte.dataElement = 'nQ3mhxS2ry3';
                        dataValuePHCMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValuePHCMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCMedicine_Quality_TestExAnte);
                    }

                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValuePHCDrug_Store_QualityExAnte = {};
                        dataValuePHCDrug_Store_QualityExAnte.dataElement = 'fZ1bWI4B62z';
                        dataValuePHCDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValuePHCDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValuePHCDrug_DispensationExAnte = {};
                        dataValuePHCDrug_DispensationExAnte.dataElement = 'dPsAozrM7kO';
                        dataValuePHCDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValuePHCDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCDrug_DispensationExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValuePHCKnowledgeExAnte = {};
                        dataValuePHCKnowledgeExAnte.dataElement = 'mckPM2YPhFc';
                        dataValuePHCKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValuePHCKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValuePHCBMWExAnte = {};
                        dataValuePHCBMWExAnte.dataElement = 'eFPCXtmas70';
                        dataValuePHCBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValuePHCBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCBMWExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValuePHCOutcome_QualityExAnte = {};
                        dataValuePHCOutcome_QualityExAnte.dataElement = 'u1NTzxc0p96';
                        dataValuePHCOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValuePHCOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValuePHCAccountabilityExAnte = {};
                        dataValuePHCAccountabilityExAnte.dataElement = 'sDbz1KBbqul';
                        dataValuePHCAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValuePHCAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValuePHCPatient_Experience_ScoreExAnte = {};
                        dataValuePHCPatient_Experience_ScoreExAnte.dataElement = 'wk5EHERlILV';
                        dataValuePHCPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValuePHCPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValuePHCGrievanceExAnte = {};
                        dataValuePHCGrievanceExAnte.dataElement = 'gbGGFzlWmRb';
                        dataValuePHCGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValuePHCGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCGrievanceExAnte);
                    }

                    if (eventDataValue.SdPujxa8O9N !== '' && eventDataValue.SdPujxa8O9N !== undefined) {
                        let dataValueHMIS_ReportingExAnte = {};
                        dataValueHMIS_ReportingExAnte.dataElement = 'GrQuzkOescD';
                        dataValueHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueHMIS_ReportingExAnte.value = eventDataValue.SdPujxa8O9N;
                        dataValueHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueHMIS_ReportingExAnte);
                    }

                    if (eventDataValue.xSSLUxMZgqP !== '' && eventDataValue.xSSLUxMZgqP !== undefined) {
                        let dataValueNCD_ConsultationsExAnte = {};
                        dataValueNCD_ConsultationsExAnte.dataElement = 'JnFHZA1ofJw';
                        dataValueNCD_ConsultationsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueNCD_ConsultationsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueNCD_ConsultationsExAnte.value = eventDataValue.xSSLUxMZgqP;
                        dataValueNCD_ConsultationsExAnte.period = tempPeriod;
                        dataValues.push(dataValueNCD_ConsultationsExAnte);
                    }

                }

            }
            // CHC
            else if (eventDataValue.program === 'goWEjxK4YXb' && eventDataValue.programStage === 'KB6QqF6Vcv6') {
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueCHCNQASExAnte = {};
                        dataValueCHCNQASExAnte.dataElement = 'hEmw1SgUk5B';
                        dataValueCHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueCHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueCHCPlanningsExAnte = {};
                        dataValueCHCPlanningsExAnte.dataElement = 'OApGB4RqNj2';
                        dataValueCHCPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueCHCPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueCHCPlan_ExecutionExAnte = {};
                        dataValueCHCPlan_ExecutionExAnte.dataElement = 'nVsUOeemfuM';
                        dataValueCHCPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueCHCPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValueCHCAssesmentExAnte = {};
                        dataValueCHCAssesmentExAnte.dataElement = 'Wag2MMDU11i';
                        dataValueCHCAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueCHCAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCAssesmentExAnte);
                    }

                    if (eventDataValue.atgisgKyF3t !== '' && eventDataValue.atgisgKyF3t !== undefined) {
                        let dataValueCHCBloodExAnte = {};
                        dataValueCHCBloodExAnte.dataElement = 'LxkcyG5uB6P';
                        dataValueCHCBloodExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCBloodExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCBloodExAnte.value = eventDataValue.atgisgKyF3t;
                        dataValueCHCBloodExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCBloodExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValueCHCLow_cost_MedicineExAnte = {};
                        dataValueCHCLow_cost_MedicineExAnte.dataElement = 'aVp0MdFg6Jz';
                        dataValueCHCLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValueCHCLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCLow_cost_MedicineExAnte);
                    }
                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValueCHCMedicine_Quality_TestExAnte = {};
                        dataValueCHCMedicine_Quality_TestExAnte.dataElement = 'qVwhxqrpHue';
                        dataValueCHCMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValueCHCMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCMedicine_Quality_TestExAnte);
                    }
                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueCHCDrug_Store_QualityExAnte = {};
                        dataValueCHCDrug_Store_QualityExAnte.dataElement = 'SlyWuCZrZlV';
                        dataValueCHCDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueCHCDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValueCHCDrug_DispensationExAnte = {};
                        dataValueCHCDrug_DispensationExAnte.dataElement = 'HGCD1m0dxXV';
                        dataValueCHCDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValueCHCDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCDrug_DispensationExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValueCHCKnowledgeExAnte = {};
                        dataValueCHCKnowledgeExAnte.dataElement = 'Qj70QIMbOIB';
                        dataValueCHCKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValueCHCKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValueCHCBMWExAnte = {};
                        dataValueCHCBMWExAnte.dataElement = 'JNU2mkoOQFx';
                        dataValueCHCBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValueCHCBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCBMWExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueCHCOutcome_QualityExAnte = {};
                        dataValueCHCOutcome_QualityExAnte.dataElement = 'AyT7JccdH3J';
                        dataValueCHCOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValueCHCOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueCHCAccountabilityExAnte = {};
                        dataValueCHCAccountabilityExAnte.dataElement = 'EnfVLUDAT2Y';
                        dataValueCHCAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueCHCAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValueCHCPatient_Experience_ScoreExAnte = {};
                        dataValueCHCPatient_Experience_ScoreExAnte.dataElement = 'AAQVlEg3Fpu';
                        dataValueCHCPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValueCHCPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueCHCGrievanceExAnte = {};
                        dataValueCHCGrievanceExAnte.dataElement = 'zdc2D3qvmgO';
                        dataValueCHCGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueCHCGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueCHCHMIS_ReportingExAnte = {};
                        dataValueCHCHMIS_ReportingExAnte.dataElement = 'bFW1Lm7xHgp';
                        dataValueCHCHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueCHCHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCHMIS_ReportingExAnte);
                    }

                }
                // CHC Ex-Post Assessment
                else if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueCHCNQASExAnte = {};
                        dataValueCHCNQASExAnte.dataElement = 'SlEOuSdn4t6';
                        dataValueCHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueCHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueCHCPlanningsExAnte = {};
                        dataValueCHCPlanningsExAnte.dataElement = 'QwFvcX2oRGx';
                        dataValueCHCPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueCHCPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueCHCPlan_ExecutionExAnte = {};
                        dataValueCHCPlan_ExecutionExAnte.dataElement = 'aUfTC3fQWgY';
                        dataValueCHCPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueCHCPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValueCHCAssesmentExAnte = {};
                        dataValueCHCAssesmentExAnte.dataElement = 'wSJsT5CR3n3';
                        dataValueCHCAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueCHCAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCAssesmentExAnte);
                    }

                    if (eventDataValue.atgisgKyF3t !== '' && eventDataValue.atgisgKyF3t !== undefined) {
                        let dataValueCHCBloodExAnte = {};
                        dataValueCHCBloodExAnte.dataElement = 'oPca7SZn15U';
                        dataValueCHCBloodExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCBloodExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCBloodExAnte.value = eventDataValue.atgisgKyF3t;
                        dataValueCHCBloodExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCBloodExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValueCHCLow_cost_MedicineExAnte = {};
                        dataValueCHCLow_cost_MedicineExAnte.dataElement = 'J5gstCNY8t4';
                        dataValueCHCLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValueCHCLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCLow_cost_MedicineExAnte);
                    }
                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValueCHCMedicine_Quality_TestExAnte = {};
                        dataValueCHCMedicine_Quality_TestExAnte.dataElement = 'QHlopEoN7b3';
                        dataValueCHCMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValueCHCMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCMedicine_Quality_TestExAnte);
                    }
                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueCHCDrug_Store_QualityExAnte = {};
                        dataValueCHCDrug_Store_QualityExAnte.dataElement = 'pjPz7XhMJi5';
                        dataValueCHCDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueCHCDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValueCHCDrug_DispensationExAnte = {};
                        dataValueCHCDrug_DispensationExAnte.dataElement = 'kysAi2zrMBA';
                        dataValueCHCDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValueCHCDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCDrug_DispensationExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValueCHCKnowledgeExAnte = {};
                        dataValueCHCKnowledgeExAnte.dataElement = 'HiR8SPybuKO';
                        dataValueCHCKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValueCHCKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValueCHCBMWExAnte = {};
                        dataValueCHCBMWExAnte.dataElement = 'KJKQgzDo3gA';
                        dataValueCHCBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValueCHCBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCBMWExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueCHCOutcome_QualityExAnte = {};
                        dataValueCHCOutcome_QualityExAnte.dataElement = 'NwCBCZ8nryJ';
                        dataValueCHCOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValueCHCOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueCHCAccountabilityExAnte = {};
                        dataValueCHCAccountabilityExAnte.dataElement = 'XILSmYprKGZ';
                        dataValueCHCAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueCHCAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValueCHCPatient_Experience_ScoreExAnte = {};
                        dataValueCHCPatient_Experience_ScoreExAnte.dataElement = 'thRJSdwxIAq';
                        dataValueCHCPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValueCHCPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueCHCGrievanceExAnte = {};
                        dataValueCHCGrievanceExAnte.dataElement = 'iMOah4eHcFE';
                        dataValueCHCGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueCHCGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueCHCHMIS_ReportingExAnte = {};
                        dataValueCHCHMIS_ReportingExAnte.dataElement = 'PO1c14NmHqS';
                        dataValueCHCHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueCHCHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueCHCHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueCHCHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueCHCHMIS_ReportingExAnte);
                    }
                }
            }

            // DH
            else if (eventDataValue.program === 'bWDC55iriq5' && eventDataValue.programStage === 'kcv8f5aW7E6') {
                // DH Ex-Ante Assessment
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueDHNQASExAnte = {};
                        dataValueDHNQASExAnte.dataElement = 'VxbUxDaAkWa';
                        dataValueDHNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueDHNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueDHPlanningsExAnte = {};
                        dataValueDHPlanningsExAnte.dataElement = 'RdSGHDTjdHG';
                        dataValueDHPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueDHPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueDHPlan_ExecutionExAnte = {};
                        dataValueDHPlan_ExecutionExAnte.dataElement = 'eMJJhDAc0Fa';
                        dataValueDHPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueDHPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValueDHAssesmentExAnte = {};
                        dataValueDHAssesmentExAnte.dataElement = 'GnrmKd87gSI';
                        dataValueDHAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueDHAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHAssesmentExAnte);
                    }

                    if (eventDataValue.OOCyt8UhcPS !== '' && eventDataValue.OOCyt8UhcPS !== undefined) {
                        let dataValueDHPortfolioExAnte = {};
                        dataValueDHPortfolioExAnte.dataElement = 'j4uggA952Vi';
                        dataValueDHPortfolioExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPortfolioExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPortfolioExAnte.value = eventDataValue.OOCyt8UhcPS;
                        dataValueDHPortfolioExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPortfolioExAnte);
                    }

                    if (eventDataValue.atgisgKyF3t !== '' && eventDataValue.atgisgKyF3t !== undefined) {
                        let dataValueDHBloodExAnte = {};
                        dataValueDHBloodExAnte.dataElement = 'tD6oBYAvn98';
                        dataValueDHBloodExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHBloodExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHBloodExAnte.value = eventDataValue.atgisgKyF3t;
                        dataValueDHBloodExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHBloodExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValueDHLow_cost_MedicineExAnte = {};
                        dataValueDHLow_cost_MedicineExAnte.dataElement = 'HYqtx7QRwew';
                        dataValueDHLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValueDHLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHLow_cost_MedicineExAnte);
                    }
                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValueDHMedicine_Quality_TestExAnte = {};
                        dataValueDHMedicine_Quality_TestExAnte.dataElement = 'RwsbRdO6buY';
                        dataValueDHMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValueDHMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHMedicine_Quality_TestExAnte);
                    }
                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueDHDrug_Store_QualityExAnte = {};
                        dataValueDHDrug_Store_QualityExAnte.dataElement = 'DUcaCVQcENy';
                        dataValueDHDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueDHDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValueDHDrug_DispensationExAnte = {};
                        dataValueDHDrug_DispensationExAnte.dataElement = 'UmgCJ4TRJ2z';
                        dataValueDHDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValueDHDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHDrug_DispensationExAnte);
                    }
                    if (eventDataValue.uAV0mbGmpU3 !== '' && eventDataValue.uAV0mbGmpU3 !== undefined) {
                        let dataValueDHMedicinesExAnte = {};
                        dataValueDHMedicinesExAnte.dataElement = 'HzWwN7ijfvO';
                        dataValueDHMedicinesExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHMedicinesExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHMedicinesExAnte.value = eventDataValue.uAV0mbGmpU3;
                        dataValueDHMedicinesExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHMedicinesExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValueDHKnowledgeExAnte = {};
                        dataValueDHKnowledgeExAnte.dataElement = 'rpbQ1GnS0dU';
                        dataValueDHKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValueDHKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValueDHBMWExAnte = {};
                        dataValueDHBMWExAnte.dataElement = 'sAoofnHxMdM';
                        dataValueDHBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValueDHBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHBMWExAnte);
                    }

                    if (eventDataValue.ZgnIWM2ZFN1 !== '' && eventDataValue.ZgnIWM2ZFN1 !== undefined) {
                        let dataValueDH_Surgical_safety_checklistExAnte = {};
                        dataValueDH_Surgical_safety_checklistExAnte.dataElement = 'lhkcJSi0858';
                        dataValueDH_Surgical_safety_checklistExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDH_Surgical_safety_checklistExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDH_Surgical_safety_checklistExAnte.value = eventDataValue.ZgnIWM2ZFN1;
                        dataValueDH_Surgical_safety_checklistExAnte.period = tempPeriod;
                        dataValues.push(dataValueDH_Surgical_safety_checklistExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueDHOutcome_QualityExAnte = {};
                        dataValueDHOutcome_QualityExAnte.dataElement = 'POPDaE96GfE';
                        dataValueDHOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValueDHOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHAccountabilityExAnte = {};
                        dataValueDHAccountabilityExAnte.dataElement = 'B5KFVFGnOh0';
                        dataValueDHAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValueDHPatient_Experience_ScoreExAnte = {};
                        dataValueDHPatient_Experience_ScoreExAnte.dataElement = 'FEZ0CMoRjwy';
                        dataValueDHPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValueDHPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueDHGrievanceExAnte = {};
                        dataValueDHGrievanceExAnte.dataElement = 'b6JPxOkX68O';
                        dataValueDHGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueDHGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDhHMIS_ReportingExAnte = {};
                        dataValueDhHMIS_ReportingExAnte.dataElement = 'YGM9kx0lv2C';
                        dataValueDhHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDhHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDhHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDhHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDhHMIS_ReportingExAnte);
                    }
                }

                // DH Ex-Post Assessment
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueDHNQASExAnte = {};
                        dataValueDHNQASExAnte.dataElement = 'tDRrBsV5eCj';
                        dataValueDHNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueDHNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueDHPlanningsExAnte = {};
                        dataValueDHPlanningsExAnte.dataElement = 'HBOVjynWP6a';
                        dataValueDHPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueDHPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueDHPlan_ExecutionExAnte = {};
                        dataValueDHPlan_ExecutionExAnte.dataElement = 'bE48aKPqBMh';
                        dataValueDHPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueDHPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.BNyKVjqlhtL !== '' && eventDataValue.BNyKVjqlhtL !== undefined) {
                        let dataValueDHAssesmentExAnte = {};
                        dataValueDHAssesmentExAnte.dataElement = 'asHJgUaIcLt';
                        dataValueDHAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHAssesmentExAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueDHAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHAssesmentExAnte);
                    }

                    if (eventDataValue.OOCyt8UhcPS !== '' && eventDataValue.OOCyt8UhcPS !== undefined) {
                        let dataValueDHPortfolioExAnte = {};
                        dataValueDHPortfolioExAnte.dataElement = 'O7hUl8Iw3SD';
                        dataValueDHPortfolioExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPortfolioExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPortfolioExAnte.value = eventDataValue.OOCyt8UhcPS;
                        dataValueDHPortfolioExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPortfolioExAnte);
                    }

                    if (eventDataValue.atgisgKyF3t !== '' && eventDataValue.atgisgKyF3t !== undefined) {
                        let dataValueDHBloodExAnte = {};
                        dataValueDHBloodExAnte.dataElement = 'zAjMWzU30QI';
                        dataValueDHBloodExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHBloodExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHBloodExAnte.value = eventDataValue.atgisgKyF3t;
                        dataValueDHBloodExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHBloodExAnte);
                    }

                    if (eventDataValue.zWCr9GKfyTz !== '' && eventDataValue.zWCr9GKfyTz !== undefined) {
                        let dataValueDHLow_cost_MedicineExAnte = {};
                        dataValueDHLow_cost_MedicineExAnte.dataElement = 'n8EMKkHzG08';
                        dataValueDHLow_cost_MedicineExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHLow_cost_MedicineExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHLow_cost_MedicineExAnte.value = eventDataValue.zWCr9GKfyTz;
                        dataValueDHLow_cost_MedicineExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHLow_cost_MedicineExAnte);
                    }
                    if (eventDataValue.TDPUQXGEy0n !== '' && eventDataValue.TDPUQXGEy0n !== undefined) {
                        let dataValueDHMedicine_Quality_TestExAnte = {};
                        dataValueDHMedicine_Quality_TestExAnte.dataElement = 'y67SDImvjmn';
                        dataValueDHMedicine_Quality_TestExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHMedicine_Quality_TestExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHMedicine_Quality_TestExAnte.value = eventDataValue.TDPUQXGEy0n;
                        dataValueDHMedicine_Quality_TestExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHMedicine_Quality_TestExAnte);
                    }
                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueDHDrug_Store_QualityExAnte = {};
                        dataValueDHDrug_Store_QualityExAnte.dataElement = 'VJXTEic6IY2';
                        dataValueDHDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueDHDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.NronO8j2Fft !== '' && eventDataValue.NronO8j2Fft !== undefined) {
                        let dataValueDHDrug_DispensationExAnte = {};
                        dataValueDHDrug_DispensationExAnte.dataElement = 'd1QQiEKyKLQ';
                        dataValueDHDrug_DispensationExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHDrug_DispensationExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHDrug_DispensationExAnte.value = eventDataValue.NronO8j2Fft;
                        dataValueDHDrug_DispensationExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHDrug_DispensationExAnte);
                    }
                    if (eventDataValue.uAV0mbGmpU3 !== '' && eventDataValue.uAV0mbGmpU3 !== undefined) {
                        let dataValueDHMedicinesExAnte = {};
                        dataValueDHMedicinesExAnte.dataElement = 'uZ3u08X2xa5';
                        dataValueDHMedicinesExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHMedicinesExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHMedicinesExAnte.value = eventDataValue.uAV0mbGmpU3;
                        dataValueDHMedicinesExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHMedicinesExAnte);
                    }

                    if (eventDataValue.LA8oFJGjiX3 !== '' && eventDataValue.LA8oFJGjiX3 !== undefined) {
                        let dataValueDHKnowledgeExAnte = {};
                        dataValueDHKnowledgeExAnte.dataElement = 'X0PLrZbHEeu';
                        dataValueDHKnowledgeExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHKnowledgeExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHKnowledgeExAnte.value = eventDataValue.LA8oFJGjiX3;
                        dataValueDHKnowledgeExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHKnowledgeExAnte);
                    }

                    if (eventDataValue.uIbs7yJJGEe !== '' && eventDataValue.uIbs7yJJGEe !== undefined) {
                        let dataValueDHBMWExAnte = {};
                        dataValueDHBMWExAnte.dataElement = 'T0e2EZp9H6q';
                        dataValueDHBMWExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHBMWExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHBMWExAnte.value = eventDataValue.uIbs7yJJGEe;
                        dataValueDHBMWExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHBMWExAnte);
                    }

                    if (eventDataValue.ZgnIWM2ZFN1 !== '' && eventDataValue.ZgnIWM2ZFN1 !== undefined) {
                        let dataValueDH_Surgical_safety_checklistExAnte = {};
                        dataValueDH_Surgical_safety_checklistExAnte.dataElement = 'JA6FkCQv14p';
                        dataValueDH_Surgical_safety_checklistExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDH_Surgical_safety_checklistExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDH_Surgical_safety_checklistExAnte.value = eventDataValue.ZgnIWM2ZFN1;
                        dataValueDH_Surgical_safety_checklistExAnte.period = tempPeriod;
                        dataValues.push(dataValueDH_Surgical_safety_checklistExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueDHOutcome_QualityExAnte = {};
                        dataValueDHOutcome_QualityExAnte.dataElement = 'y5LVmFyjmIu';
                        dataValueDHOutcome_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHOutcome_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHOutcome_QualityExAnte.value = eventDataValue.OjLkSpUqD2P;
                        dataValueDHOutcome_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHOutcome_QualityExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHAccountabilityExAnte = {};
                        dataValueDHAccountabilityExAnte.dataElement = 'NL6cZ0VvWdP';
                        dataValueDHAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHAccountabilityExAnte);
                    }

                    if (eventDataValue.mdbSU6XYoK3 !== '' && eventDataValue.mdbSU6XYoK3 !== undefined) {
                        let dataValueDHPatient_Experience_ScoreExAnte = {};
                        dataValueDHPatient_Experience_ScoreExAnte.dataElement = 'snsQHAZY7fv';
                        dataValueDHPatient_Experience_ScoreExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHPatient_Experience_ScoreExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHPatient_Experience_ScoreExAnte.value = eventDataValue.mdbSU6XYoK3;
                        dataValueDHPatient_Experience_ScoreExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHPatient_Experience_ScoreExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueDHGrievanceExAnte = {};
                        dataValueDHGrievanceExAnte.dataElement = 'eA4aHIvFJd9';
                        dataValueDHGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueDHGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDhHMIS_ReportingExAnte = {};
                        dataValueDhHMIS_ReportingExAnte.dataElement = 'tcFOLhtUEKl';
                        dataValueDhHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDhHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDhHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDhHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDhHMIS_ReportingExAnte);
                    }

                }
            }

            // DHT
            else if (eventDataValue.program === 'T9rLO6TLFrx' && eventDataValue.programStage === 'bgyWZTN72Is') {
                // DHT Ex-Ante Assessment
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueDHTNQASExAnte = {};
                        dataValueDHTNQASExAnte.dataElement = 'HMJl1ihGttQ';
                        dataValueDHTNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueDHTNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueDHTPlanningsExAnte = {};
                        dataValueDHTPlanningsExAnte.dataElement = 'BH0ne79iBdW';
                        dataValueDHTPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueDHTPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueDHTPlan_ExecutionExAnte = {};
                        dataValueDHTPlan_ExecutionExAnte.dataElement = 'rFYAyQBq5uZ';
                        dataValueDHTPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueDHTPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.XctfwttQv93 !== '' && eventDataValue.XctfwttQv93 !== undefined) {
                        let dataValueDHTAssesmentExAnte = {};
                        dataValueDHTAssesmentExAnte.dataElement = 'mvMxxUm7C1d';
                        dataValueDHTAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAssesmentExAnte.value = eventDataValue.XctfwttQv93;
                        dataValueDHTAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAssesmentExAnte);
                    }

                    if (eventDataValue.zYPbdrUOHCu !== '' && eventDataValue.zYPbdrUOHCu !== undefined) {
                        let dataValueDHTcoaching_visit_Quality_HRExAnte = {};
                        dataValueDHTcoaching_visit_Quality_HRExAnte.dataElement = 'kHRI6M7VeMq';
                        dataValueDHTcoaching_visit_Quality_HRExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTcoaching_visit_Quality_HRExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTcoaching_visit_Quality_HRExAnte.value = eventDataValue.zYPbdrUOHCu;
                        dataValueDHTcoaching_visit_Quality_HRExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTcoaching_visit_Quality_HRExAnte);
                    }

                    if (eventDataValue.sNSCyMN95ys !== '' && eventDataValue.sNSCyMN95ys !== undefined) {
                        let dataValueDHTDrug_QualityExAnte = {};
                        dataValueDHTDrug_QualityExAnte.dataElement = 'GfGniN4O5Ib';
                        dataValueDHTDrug_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTDrug_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTDrug_QualityExAnte.value = eventDataValue.sNSCyMN95ys;
                        dataValueDHTDrug_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTDrug_QualityExAnte);
                    }

                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueDHTDrug_Store_QualityExAnte = {};
                        dataValueDHTDrug_Store_QualityExAnte.dataElement = 'Pus6IXftvwT';
                        dataValueDHTDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueDHTDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.RyKtdJOt0mN !== '' && eventDataValue.RyKtdJOt0mN !== undefined) {
                        let dataValueDHTStore_quality_PHC_CHCExAnte = {};
                        dataValueDHTStore_quality_PHC_CHCExAnte.dataElement = 'MR6DTd8WfXj';
                        dataValueDHTStore_quality_PHC_CHCExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTStore_quality_PHC_CHCExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTStore_quality_PHC_CHCExAnte.value = eventDataValue.RyKtdJOt0mN;
                        dataValueDHTStore_quality_PHC_CHCExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTStore_quality_PHC_CHCExAnte);
                    }
                    if (eventDataValue.RXbBpPnx2yl !== '' && eventDataValue.RXbBpPnx2yl !== undefined) {
                        let dataValueDHTPharmacy_reviewExAnte = {};
                        dataValueDHTPharmacy_reviewExAnte.dataElement = 'krs4kVOxr6s';
                        dataValueDHTPharmacy_reviewExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPharmacy_reviewExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPharmacy_reviewExAnte.value = eventDataValue.RXbBpPnx2yl;
                        dataValueDHTPharmacy_reviewExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPharmacy_reviewExAnte);
                    }

                    if (eventDataValue.lgK2dP5Zp8S !== '' && eventDataValue.lgK2dP5Zp8S !== undefined) {
                        let dataValueDHTNursing_reviewExAnte = {};
                        dataValueDHTNursing_reviewExAnte.dataElement = 'CHa6lWCvzUa';
                        dataValueDHTNursing_reviewExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNursing_reviewExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNursing_reviewExAnte.value = eventDataValue.lgK2dP5Zp8S;
                        dataValueDHTNursing_reviewExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNursing_reviewExAnte);
                    }
                    if (eventDataValue.ZABLh7HEOko !== '' && eventDataValue.ZABLh7HEOko !== undefined) {
                        let dataValueDHTEmergency_TrainingExAnte = {};
                        dataValueDHTEmergency_TrainingExAnte.dataElement = 'kRWBZFZbseb';
                        dataValueDHTEmergency_TrainingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTEmergency_TrainingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTEmergency_TrainingExAnte.value = eventDataValue.ZABLh7HEOko;
                        dataValueDHTEmergency_TrainingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTEmergency_TrainingExAnte);
                    }
                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHTAccountabilityExAnte = {};
                        dataValueDHTAccountabilityExAnte.dataElement = 'bKb96k49lpq';
                        dataValueDHTAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHTAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAccountabilityExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueDHTGrievanceExAnte = {};
                        dataValueDHTGrievanceExAnte.dataElement = 'sriHepQzObV';
                        dataValueDHTGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueDHTGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDHTHMIS_ReportingExAnte = {};
                        dataValueDHTHMIS_ReportingExAnte.dataElement = 'nnGPlabpjOx';
                        dataValueDHTHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDHTHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTHMIS_ReportingExAnte);
                    }


                    if (eventDataValue.CMGA0AX5PTf !== 'NaN' && eventDataValue.CMGA0AX5PTf !== '' && eventDataValue.CMGA0AX5PTf !== undefined) {
                        let dataValueDHTCondemnation_medical_equipmentExAnte = {};
                        dataValueDHTCondemnation_medical_equipmentExAnte.dataElement = 'xWJHsHBdENm';
                        dataValueDHTCondemnation_medical_equipmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTCondemnation_medical_equipmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTCondemnation_medical_equipmentExAnte.value = eventDataValue.CMGA0AX5PTf;
                        dataValueDHTCondemnation_medical_equipmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTCondemnation_medical_equipmentExAnte);
                    }

                    if (eventDataValue.mnFzdiwV2cB !== '' && eventDataValue.mnFzdiwV2cB !== undefined) {
                        let dataValueDHTCondemnation_VehiclesExAnte = {};
                        dataValueDHTCondemnation_VehiclesExAnte.dataElement = 'x0eOZt7dq67';
                        dataValueDHTCondemnation_VehiclesExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTCondemnation_VehiclesExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTCondemnation_VehiclesExAnte.value = eventDataValue.mnFzdiwV2cB;
                        dataValueDHTCondemnation_VehiclesExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTCondemnation_VehiclesExAnte);
                    }

                    if (eventDataValue.Nnfhzkv2Hzi !== '' && eventDataValue.Nnfhzkv2Hzi !== undefined) {
                        let dataValueDHTNCD_Screening_Data_SubmissionExAnte = {};
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.dataElement = 'LwvDauUsAB9';
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.value = eventDataValue.Nnfhzkv2Hzi;
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNCD_Screening_Data_SubmissionExAnte);
                    }
                }
                // DHT Ex-Post Assessment
                else if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueDHTNQASExAnte = {};
                        dataValueDHTNQASExAnte.dataElement = 'QEewp3DChqs';
                        dataValueDHTNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueDHTNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueDHTPlanningsExAnte = {};
                        dataValueDHTPlanningsExAnte.dataElement = 'HAWBvWWEI36';
                        dataValueDHTPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueDHTPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPlanningsExAnte);
                    }
                    if (eventDataValue.WSAbtRZhxM5 !== '' && eventDataValue.WSAbtRZhxM5 !== undefined) {
                        let dataValueDHTPlan_ExecutionExAnte = {};
                        dataValueDHTPlan_ExecutionExAnte.dataElement = 'JpxheEiIr8c';
                        dataValueDHTPlan_ExecutionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPlan_ExecutionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPlan_ExecutionExAnte.value = eventDataValue.WSAbtRZhxM5;
                        dataValueDHTPlan_ExecutionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPlan_ExecutionExAnte);
                    }
                    if (eventDataValue.XctfwttQv93 !== '' && eventDataValue.XctfwttQv93 !== undefined) {
                        let dataValueDHTAssesmentExAnte = {};
                        dataValueDHTAssesmentExAnte.dataElement = 'dgBgKBKcQb6';
                        dataValueDHTAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAssesmentExAnte.value = eventDataValue.XctfwttQv93;
                        dataValueDHTAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAssesmentExAnte);
                    }

                    if (eventDataValue.zYPbdrUOHCu !== '' && eventDataValue.zYPbdrUOHCu !== undefined) {
                        let dataValueDHTcoaching_visit_Quality_HRExAnte = {};
                        dataValueDHTcoaching_visit_Quality_HRExAnte.dataElement = 'cOhkSQPTDEG';
                        dataValueDHTcoaching_visit_Quality_HRExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTcoaching_visit_Quality_HRExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTcoaching_visit_Quality_HRExAnte.value = eventDataValue.zYPbdrUOHCu;
                        dataValueDHTcoaching_visit_Quality_HRExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTcoaching_visit_Quality_HRExAnte);
                    }

                    if (eventDataValue.sNSCyMN95ys !== '' && eventDataValue.sNSCyMN95ys !== undefined) {
                        let dataValueDHTDrug_QualityExAnte = {};
                        dataValueDHTDrug_QualityExAnte.dataElement = 'coQENsePTcN';
                        dataValueDHTDrug_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTDrug_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTDrug_QualityExAnte.value = eventDataValue.sNSCyMN95ys;
                        dataValueDHTDrug_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTDrug_QualityExAnte);
                    }

                    if (eventDataValue.mwBMY6pBnNt !== '' && eventDataValue.mwBMY6pBnNt !== undefined) {
                        let dataValueDHTDrug_Store_QualityExAnte = {};
                        dataValueDHTDrug_Store_QualityExAnte.dataElement = 'LxAJLLxJ3mp';
                        dataValueDHTDrug_Store_QualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTDrug_Store_QualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTDrug_Store_QualityExAnte.value = eventDataValue.mwBMY6pBnNt;
                        dataValueDHTDrug_Store_QualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTDrug_Store_QualityExAnte);
                    }

                    if (eventDataValue.RyKtdJOt0mN !== '' && eventDataValue.RyKtdJOt0mN !== undefined) {
                        let dataValueDHTStore_quality_PHC_CHCExAnte = {};
                        dataValueDHTStore_quality_PHC_CHCExAnte.dataElement = 'iT1Hn4x9MZl';
                        dataValueDHTStore_quality_PHC_CHCExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTStore_quality_PHC_CHCExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTStore_quality_PHC_CHCExAnte.value = eventDataValue.RyKtdJOt0mN;
                        dataValueDHTStore_quality_PHC_CHCExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTStore_quality_PHC_CHCExAnte);
                    }
                    if (eventDataValue.RXbBpPnx2yl !== '' && eventDataValue.RXbBpPnx2yl !== undefined) {
                        let dataValueDHTPharmacy_reviewExAnte = {};
                        dataValueDHTPharmacy_reviewExAnte.dataElement = 'VPGsJ0SSjd7';
                        dataValueDHTPharmacy_reviewExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTPharmacy_reviewExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTPharmacy_reviewExAnte.value = eventDataValue.RXbBpPnx2yl;
                        dataValueDHTPharmacy_reviewExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTPharmacy_reviewExAnte);
                    }

                    if (eventDataValue.lgK2dP5Zp8S !== '' && eventDataValue.lgK2dP5Zp8S !== undefined) {
                        let dataValueDHTNursing_reviewExAnte = {};
                        dataValueDHTNursing_reviewExAnte.dataElement = 'IXfG3ffcVDW';
                        dataValueDHTNursing_reviewExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNursing_reviewExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNursing_reviewExAnte.value = eventDataValue.lgK2dP5Zp8S;
                        dataValueDHTNursing_reviewExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNursing_reviewExAnte);
                    }
                    if (eventDataValue.ZABLh7HEOko !== '' && eventDataValue.ZABLh7HEOko !== undefined) {
                        let dataValueDHTEmergency_TrainingExAnte = {};
                        dataValueDHTEmergency_TrainingExAnte.dataElement = 'yiVDmnkFe9c';
                        dataValueDHTEmergency_TrainingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTEmergency_TrainingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTEmergency_TrainingExAnte.value = eventDataValue.ZABLh7HEOko;
                        dataValueDHTEmergency_TrainingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTEmergency_TrainingExAnte);
                    }
                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHTAccountabilityExAnte = {};
                        dataValueDHTAccountabilityExAnte.dataElement = 'WNZvDM6NAN7';
                        dataValueDHTAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHTAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAccountabilityExAnte);
                    }

                    if (eventDataValue.uj9OgZ2awL0 !== '' && eventDataValue.uj9OgZ2awL0 !== undefined) {
                        let dataValueDHTGrievanceExAnte = {};
                        dataValueDHTGrievanceExAnte.dataElement = 'bUcEUrVPIMd';
                        dataValueDHTGrievanceExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTGrievanceExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTGrievanceExAnte.value = eventDataValue.uj9OgZ2awL0;
                        dataValueDHTGrievanceExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTGrievanceExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDHTHMIS_ReportingExAnte = {};
                        dataValueDHTHMIS_ReportingExAnte.dataElement = 'QN5mAwfWAF9';
                        dataValueDHTHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDHTHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTHMIS_ReportingExAnte);
                    }


                    if (eventDataValue.CMGA0AX5PTf !== 'NaN' && eventDataValue.CMGA0AX5PTf !== '' && eventDataValue.CMGA0AX5PTf !== undefined) {
                        let dataValueDHTCondemnation_medical_equipmentExAnte = {};
                        dataValueDHTCondemnation_medical_equipmentExAnte.dataElement = 'FUEj9575KD4';
                        dataValueDHTCondemnation_medical_equipmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTCondemnation_medical_equipmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTCondemnation_medical_equipmentExAnte.value = eventDataValue.CMGA0AX5PTf;
                        dataValueDHTCondemnation_medical_equipmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTCondemnation_medical_equipmentExAnte);
                    }

                    if (eventDataValue.mnFzdiwV2cB !== '' && eventDataValue.mnFzdiwV2cB !== undefined) {
                        let dataValueDHTCondemnation_VehiclesExAnte = {};
                        dataValueDHTCondemnation_VehiclesExAnte.dataElement = 'P3ENCyN6gP4';
                        dataValueDHTCondemnation_VehiclesExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTCondemnation_VehiclesExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTCondemnation_VehiclesExAnte.value = eventDataValue.mnFzdiwV2cB;
                        dataValueDHTCondemnation_VehiclesExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTCondemnation_VehiclesExAnte);
                    }

                    if (eventDataValue.Nnfhzkv2Hzi !== '' && eventDataValue.Nnfhzkv2Hzi !== undefined) {
                        let dataValueDHTNCD_Screening_Data_SubmissionExAnte = {};
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.dataElement = 'YvpQ5BwHYQL';
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.value = eventDataValue.Nnfhzkv2Hzi;
                        dataValueDHTNCD_Screening_Data_SubmissionExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTNCD_Screening_Data_SubmissionExAnte);
                    }
                }
            }

            // DHT
            else if (eventDataValue.program === 'T9rLO6TLFrx' && eventDataValue.programStage === 'PT9rqtMc6vU') {
                // DHT Ex-Ante Assessment
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.rOb9Xs9yC93 !== '' && eventDataValue.rOb9Xs9yC93 !== undefined) {
                        let dataValueDHTIndicator1ExAnte = {};
                        dataValueDHTIndicator1ExAnte.dataElement = 'FHh0DreGwAg';
                        dataValueDHTIndicator1ExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTIndicator1ExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTIndicator1ExAnte.value = eventDataValue.rOb9Xs9yC93;
                        dataValueDHTIndicator1ExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTIndicator1ExAnte);
                    }
                    if (eventDataValue.PGP05ncWrql !== '' && eventDataValue.PGP05ncWrql !== undefined) {
                        let dataValueDHTIndicator2ExAnte = {};
                        dataValueDHTIndicator2ExAnte.dataElement = 'IhQHr47XxSx';
                        dataValueDHTIndicator2ExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTIndicator2ExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTIndicator2ExAnte.value = eventDataValue.PGP05ncWrql;
                        dataValueDHTIndicator2ExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTIndicator2ExAnte);
                    }
                }
                // DHT Ex-Post Assessment
                else if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.rOb9Xs9yC93 !== '' && eventDataValue.rOb9Xs9yC93 !== undefined) {
                        let dataValueDHTIndicator1ExAnte = {};
                        dataValueDHTIndicator1ExAnte.dataElement = 'axLC51g4iQj';
                        dataValueDHTIndicator1ExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTIndicator1ExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTIndicator1ExAnte.value = eventDataValue.rOb9Xs9yC93;
                        dataValueDHTIndicator1ExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTIndicator1ExAnte);
                    }
                    if (eventDataValue.PGP05ncWrql !== '' && eventDataValue.PGP05ncWrql !== undefined) {
                        let dataValueDHTIndicator2ExAnte = {};
                        dataValueDHTIndicator2ExAnte.dataElement = 'DnNsrf3v8fl';
                        dataValueDHTIndicator2ExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTIndicator2ExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTIndicator2ExAnte.value = eventDataValue.PGP05ncWrql;
                        dataValueDHTIndicator2ExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTIndicator2ExAnte);
                    }
                }
            }

            // SHT
            else if (eventDataValue.program === 'J2WLAhMNTa9' && eventDataValue.programStage === 'RgeKAiRQ3yo') {
                // SHT Ex-Ante Assessment
                if( eventDataValue.hqDoSMfLh8F === 'Ex-Ante Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'NxpizrKetxX';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'dHuVSKPUOtv';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    
                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueSHTNQASExAnte = {};
                        dataValueSHTNQASExAnte.dataElement = 't74ltsSf68i';
                        dataValueSHTNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueSHTNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueSHTPlanningsExAnte = {};
                        dataValueSHTPlanningsExAnte.dataElement = 'Df7VRgqMvEp';
                        dataValueSHTPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueSHTPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPlanningsExAnte);
                    }

                    if (eventDataValue.XctfwttQv93 !== '' && eventDataValue.XctfwttQv93 !== undefined) {
                        let dataValueSHTAssesmentExAnte = {};
                        dataValueSHTAssesmentExAnte.dataElement = 'OIezn65tpN5';
                        dataValueSHTAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTAssesmentExAnte.value = eventDataValue.XctfwttQv93;
                        dataValueSHTAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTAssesmentExAnte);
                    }

                    if (eventDataValue.YTAbmm1yY1a !== '' && eventDataValue.YTAbmm1yY1a !== undefined) {
                        let dataValueSHTState_HR_PolicyExAnte = {};
                        dataValueSHTState_HR_PolicyExAnte.dataElement = 'C8YsYJzaegB';
                        dataValueSHTState_HR_PolicyExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTState_HR_PolicyExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTState_HR_PolicyExAnte.value = eventDataValue.YTAbmm1yY1a;
                        dataValueSHTState_HR_PolicyExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTState_HR_PolicyExAnte);
                    }
                    if (eventDataValue.fnF8q74shy9 !== '' && eventDataValue.fnF8q74shy9 !== undefined) {
                        let dataValueSHTPolicy_procurementExAnte = {};
                        dataValueSHTPolicy_procurementExAnte.dataElement = 'm9QOEyGCXLq';
                        dataValueSHTPolicy_procurementExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_procurementExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_procurementExAnte.value = eventDataValue.fnF8q74shy9;
                        dataValueSHTPolicy_procurementExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_procurementExAnte);
                    }
                    if (eventDataValue.GEnbQ2z3sYm !== '' && eventDataValue.GEnbQ2z3sYm !== undefined) {
                        let dataValueSHTpolicy_low_cost_supplyExAnte = {};
                        dataValueSHTpolicy_low_cost_supplyExAnte.dataElement = 'YoLFvclGCa3';
                        dataValueSHTpolicy_low_cost_supplyExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTpolicy_low_cost_supplyExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTpolicy_low_cost_supplyExAnte.value = eventDataValue.GEnbQ2z3sYm;
                        dataValueSHTpolicy_low_cost_supplyExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTpolicy_low_cost_supplyExAnte);
                    }

                    if (eventDataValue.lYr5l9KrV66 !== '' && eventDataValue.lYr5l9KrV66 !== undefined) {
                        let dataValueSHTPolicy_drug_qualityExAnte = {};
                        dataValueSHTPolicy_drug_qualityExAnte.dataElement = 'nLLsH2AOTAN';
                        dataValueSHTPolicy_drug_qualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_qualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_qualityExAnte.value = eventDataValue.lYr5l9KrV66;
                        dataValueSHTPolicy_drug_qualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_qualityExAnte);
                    }

                    if (eventDataValue.qxwrCsihPNn !== '' && eventDataValue.qxwrCsihPNn !== undefined) {
                        let dataValueSHTPolicy_drug_Store_low_costExAnte = {};
                        dataValueSHTPolicy_drug_Store_low_costExAnte.dataElement = 'V3OgbCiZHUJ';
                        dataValueSHTPolicy_drug_Store_low_costExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_Store_low_costExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_Store_low_costExAnte.value = eventDataValue.qxwrCsihPNn;
                        dataValueSHTPolicy_drug_Store_low_costExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_Store_low_costExAnte);
                    }
                    if (eventDataValue.Q2qJAUF1LGn !== '' && eventDataValue.Q2qJAUF1LGn !== undefined) {
                        let dataValueSHTPolicy_drug_Inventory_trainingExAnte = {};
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.dataElement = 'je23VNqB5hs';
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.value = eventDataValue.Q2qJAUF1LGn;
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_Inventory_trainingExAnte);
                    }

                    if (eventDataValue.iWsvaVa1WgB !== '' && eventDataValue.iWsvaVa1WgB !== undefined) {
                        let dataValueSHTdrug_prescription_Stock_reportingExAnte = {};
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.dataElement = 'mVLROjY20Ib';
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.value = eventDataValue.iWsvaVa1WgB;
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTdrug_prescription_Stock_reportingExAnte);
                    }

                    if (eventDataValue.v5igqtf3Voc !== '' && eventDataValue.v5igqtf3Voc !== undefined) {
                        let dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte = {};
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.dataElement = 'GvDDhBesf5y';
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.value = eventDataValue.v5igqtf3Voc;
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte);
                    }

                    if (eventDataValue.ujW3zJfdGjQ !== '' && eventDataValue.ujW3zJfdGjQ !== undefined) {
                        let dataValueSHTcoachingExAnte = {};
                        dataValueSHTcoachingExAnte.dataElement = 'pdXzJIaTpJ6';
                        dataValueSHTcoachingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTcoachingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTcoachingExAnte.value = eventDataValue.ujW3zJfdGjQ;
                        dataValueSHTcoachingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTcoachingExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHTAccountabilityExAnte = {};
                        dataValueDHTAccountabilityExAnte.dataElement = 'Nf8NfMw6wAN';
                        dataValueDHTAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHTAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAccountabilityExAnte);
                    }


                    if (eventDataValue.alGDwMT8VsD !== '' && eventDataValue.alGDwMT8VsD !== undefined) {
                        let dataValueDHTgrievance_accountabilityExAnte = {};
                        dataValueDHTgrievance_accountabilityExAnte.dataElement = 'NM7Rfr4HSPa';
                        dataValueDHTgrievance_accountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTgrievance_accountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTgrievance_accountabilityExAnte.value = eventDataValue.alGDwMT8VsD;
                        dataValueDHTgrievance_accountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTgrievance_accountabilityExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDHTHMIS_ReportingExAnte = {};
                        dataValueDHTHMIS_ReportingExAnte.dataElement = 'Skl2xFuYZvA';
                        dataValueDHTHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDHTHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTHMIS_ReportingExAnte);
                    }


                    if (eventDataValue.DEwB2WbxHkq !== '' && eventDataValue.DEwB2WbxHkq !== undefined) {
                        let dataValueDHTInsurance_Efficiency_Medical_AuditExAnte = {};
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.dataElement = 'WQJj6ZvuGeM';
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.value = eventDataValue.DEwB2WbxHkq;
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTInsurance_Efficiency_Medical_AuditExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueDHTQuality_Outcome_reportingAnte = {};
                        dataValueDHTQuality_Outcome_reportingAnte.dataElement = 'DZUSFXHl974';
                        dataValueDHTQuality_Outcome_reportingAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTQuality_Outcome_reportingAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTQuality_Outcome_reportingAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueDHTQuality_Outcome_reportingAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTQuality_Outcome_reportingAnte);
                    }

                }
                // SHT Ex-Post Assessment
                else if( eventDataValue.hqDoSMfLh8F === 'Ex-Post Assessment'){

                    if ( eventDataValue.i2afLnjFrdh !== 'NaN' && eventDataValue.i2afLnjFrdh !== '' && eventDataValue.i2afLnjFrdh !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'Qk8Rqen858g';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.i2afLnjFrdh;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }
                    if (eventDataValue.wJ3A5NF5Acj !== 'NaN' && eventDataValue.wJ3A5NF5Acj !== '' && eventDataValue.wJ3A5NF5Acj !== undefined) {
                        let dataValuePHCNQASExAnte = {};
                        dataValuePHCNQASExAnte.dataElement = 'mAWraF09EcL';
                        dataValuePHCNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValuePHCNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValuePHCNQASExAnte.value = eventDataValue.wJ3A5NF5Acj;
                        dataValuePHCNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValuePHCNQASExAnte);
                    }

                    if (eventDataValue.tm5mca1RtIi !== '' && eventDataValue.tm5mca1RtIi !== undefined) {
                        let dataValueSHTNQASExAnte = {};
                        dataValueSHTNQASExAnte.dataElement = 'AnnVOEDRRDw';
                        dataValueSHTNQASExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTNQASExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTNQASExAnte.value = eventDataValue.tm5mca1RtIi;
                        dataValueSHTNQASExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTNQASExAnte);
                    }
                    if (eventDataValue.yiLQuZMuSmj !== '' && eventDataValue.yiLQuZMuSmj !== undefined) {
                        let dataValueSHTPlanningsExAnte = {};
                        dataValueSHTPlanningsExAnte.dataElement = 'U7DLoUy0FvN';
                        dataValueSHTPlanningsExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPlanningsExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPlanningsExAnte.value = eventDataValue.yiLQuZMuSmj;
                        dataValueSHTPlanningsExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPlanningsExAnte);
                    }

                    if (eventDataValue.XctfwttQv93 !== '' && eventDataValue.XctfwttQv93 !== undefined) {
                        let dataValueSHTAssesmentExAnte = {};
                        dataValueSHTAssesmentExAnte.dataElement = 'vG4dKnrUJ2V';
                        dataValueSHTAssesmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTAssesmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTAssesmentExAnte.value = eventDataValue.XctfwttQv93;
                        dataValueSHTAssesmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTAssesmentExAnte);
                    }

                    if (eventDataValue.YTAbmm1yY1a !== '' && eventDataValue.YTAbmm1yY1a !== undefined) {
                        let dataValueSHTState_HR_PolicyExAnte = {};
                        dataValueSHTState_HR_PolicyExAnte.dataElement = 'LLD0n9NRHO8';
                        dataValueSHTState_HR_PolicyExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTState_HR_PolicyExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTState_HR_PolicyExAnte.value = eventDataValue.YTAbmm1yY1a;
                        dataValueSHTState_HR_PolicyExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTState_HR_PolicyExAnte);
                    }
                    if (eventDataValue.fnF8q74shy9 !== '' && eventDataValue.fnF8q74shy9 !== undefined) {
                        let dataValueSHTPolicy_procurementExAnte = {};
                        dataValueSHTPolicy_procurementExAnte.dataElement = 'e9lO4I25CEM';
                        dataValueSHTPolicy_procurementExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_procurementExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_procurementExAnte.value = eventDataValue.fnF8q74shy9;
                        dataValueSHTPolicy_procurementExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_procurementExAnte);
                    }
                    if (eventDataValue.GEnbQ2z3sYm !== '' && eventDataValue.GEnbQ2z3sYm !== undefined) {
                        let dataValueSHTpolicy_low_cost_supplyExAnte = {};
                        dataValueSHTpolicy_low_cost_supplyExAnte.dataElement = 'XyFe3tD0J0B';
                        dataValueSHTpolicy_low_cost_supplyExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTpolicy_low_cost_supplyExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTpolicy_low_cost_supplyExAnte.value = eventDataValue.GEnbQ2z3sYm;
                        dataValueSHTpolicy_low_cost_supplyExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTpolicy_low_cost_supplyExAnte);
                    }

                    if (eventDataValue.lYr5l9KrV66 !== '' && eventDataValue.lYr5l9KrV66 !== undefined) {
                        let dataValueSHTPolicy_drug_qualityExAnte = {};
                        dataValueSHTPolicy_drug_qualityExAnte.dataElement = 'XgnnVnokpyb';
                        dataValueSHTPolicy_drug_qualityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_qualityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_qualityExAnte.value = eventDataValue.lYr5l9KrV66;
                        dataValueSHTPolicy_drug_qualityExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_qualityExAnte);
                    }

                    if (eventDataValue.qxwrCsihPNn !== '' && eventDataValue.qxwrCsihPNn !== undefined) {
                        let dataValueSHTPolicy_drug_Store_low_costExAnte = {};
                        dataValueSHTPolicy_drug_Store_low_costExAnte.dataElement = 'AHBXYlLOx9d';
                        dataValueSHTPolicy_drug_Store_low_costExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_Store_low_costExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_Store_low_costExAnte.value = eventDataValue.qxwrCsihPNn;
                        dataValueSHTPolicy_drug_Store_low_costExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_Store_low_costExAnte);
                    }
                    if (eventDataValue.Q2qJAUF1LGn !== '' && eventDataValue.Q2qJAUF1LGn !== undefined) {
                        let dataValueSHTPolicy_drug_Inventory_trainingExAnte = {};
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.dataElement = 'vvSQcqBCjdy';
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.value = eventDataValue.Q2qJAUF1LGn;
                        dataValueSHTPolicy_drug_Inventory_trainingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTPolicy_drug_Inventory_trainingExAnte);
                    }

                    if (eventDataValue.iWsvaVa1WgB !== '' && eventDataValue.iWsvaVa1WgB !== undefined) {
                        let dataValueSHTdrug_prescription_Stock_reportingExAnte = {};
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.dataElement = 'P90CTG9boey';
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.value = eventDataValue.iWsvaVa1WgB;
                        dataValueSHTdrug_prescription_Stock_reportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTdrug_prescription_Stock_reportingExAnte);
                    }

                    if (eventDataValue.v5igqtf3Voc !== '' && eventDataValue.v5igqtf3Voc !== undefined) {
                        let dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte = {};
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.dataElement = 'mc6BxtGekuE';
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.value = eventDataValue.v5igqtf3Voc;
                        dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTMonitoring_of_Condemnation_medicalequipmentExAnte);
                    }

                    if (eventDataValue.ujW3zJfdGjQ !== '' && eventDataValue.ujW3zJfdGjQ !== undefined) {
                        let dataValueSHTcoachingExAnte = {};
                        dataValueSHTcoachingExAnte.dataElement = 'ECovFol5TYr';
                        dataValueSHTcoachingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueSHTcoachingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueSHTcoachingExAnte.value = eventDataValue.ujW3zJfdGjQ;
                        dataValueSHTcoachingExAnte.period = tempPeriod;
                        dataValues.push(dataValueSHTcoachingExAnte);
                    }

                    if (eventDataValue.FuBMShCvsTa !== '' && eventDataValue.FuBMShCvsTa !== undefined) {
                        let dataValueDHTAccountabilityExAnte = {};
                        dataValueDHTAccountabilityExAnte.dataElement = 'XIRc7MAERCt';
                        dataValueDHTAccountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTAccountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTAccountabilityExAnte.value = eventDataValue.FuBMShCvsTa;
                        dataValueDHTAccountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTAccountabilityExAnte);
                    }


                    if (eventDataValue.alGDwMT8VsD !== '' && eventDataValue.alGDwMT8VsD !== undefined) {
                        let dataValueDHTgrievance_accountabilityExAnte = {};
                        dataValueDHTgrievance_accountabilityExAnte.dataElement = 'PZIjiYHwVpD';
                        dataValueDHTgrievance_accountabilityExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTgrievance_accountabilityExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTgrievance_accountabilityExAnte.value = eventDataValue.alGDwMT8VsD;
                        dataValueDHTgrievance_accountabilityExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTgrievance_accountabilityExAnte);
                    }

                    if (eventDataValue.aYF1TLh8Wgo !== '' && eventDataValue.aYF1TLh8Wgo !== undefined) {
                        let dataValueDHTHMIS_ReportingExAnte = {};
                        dataValueDHTHMIS_ReportingExAnte.dataElement = 'FS5F3mhuTOt';
                        dataValueDHTHMIS_ReportingExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTHMIS_ReportingExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTHMIS_ReportingExAnte.value = eventDataValue.aYF1TLh8Wgo;
                        dataValueDHTHMIS_ReportingExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTHMIS_ReportingExAnte);
                    }


                    if (eventDataValue.DEwB2WbxHkq !== '' && eventDataValue.DEwB2WbxHkq !== undefined) {
                        let dataValueDHTInsurance_Efficiency_Medical_AuditExAnte = {};
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.dataElement = 'liAttWOUAzg';
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.value = eventDataValue.DEwB2WbxHkq;
                        dataValueDHTInsurance_Efficiency_Medical_AuditExAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTInsurance_Efficiency_Medical_AuditExAnte);
                    }

                    if (eventDataValue.OjLkSpUqD2P !== '' && eventDataValue.OjLkSpUqD2P !== undefined) {
                        let dataValueDHTQuality_Outcome_reportingAnte = {};
                        dataValueDHTQuality_Outcome_reportingAnte.dataElement = 'poky1ni6zoZ';
                        dataValueDHTQuality_Outcome_reportingAnte.categoryOptionCombo = 'HllvX50cXC0';
                        dataValueDHTQuality_Outcome_reportingAnte.orgUnit = eventDataValue.orgUnit;
                        dataValueDHTQuality_Outcome_reportingAnte.value = eventDataValue.BNyKVjqlhtL;
                        dataValueDHTQuality_Outcome_reportingAnte.period = tempPeriod;
                        dataValues.push(dataValueDHTQuality_Outcome_reportingAnte);
                    }
                }
            }

            let dataValueSet = {};
            dataValueSet.dataValues = dataValues;
            console.log(" final dataValueSet : " + dataValueSet );
            let dataJSON = JSON.stringify(dataValueSet);
            $.ajax({
                type: "POST",
                async: false,
                dataType: "json",
                contentType: "application/json",
                data: dataJSON,
                url: DHIS2URL + '/dataValueSets',

                success: function (response) {
                    //console.log( __rowNum__ + " -- "+ row.event + "Event updated with " + row.value + "response: " + response );

                    console.log("response : " + response);
                    console.log("conflicts : " + response.response.conflicts);

                    let impCount = response.response.importCount.imported;
                    let upCount = response.response.importCount.updated;
                    let igCount = response.response.importCount.ignored;
                    let conflictsDetails   = response.response.conflicts;

                    console.log(  "impCount - " + impCount + " upCount - " + upCount + " igCount - " + igCount + " conflictsDetails - " + conflictsDetails  );

                    deferred.resolve(response);
                },
                error: function (response) {
                    console.log("error : " + response.status );
                    deferred.resolve(response);
                },
                warning: function (response) {
                    console.log("warning : " + response.status );
                    deferred.resolve(response);
                }

            });

            return deferred.promise;

        }

    };





})

/* Factory for getting tracked entity attributes */
.factory('AttributesFactory', function($q, $rootScope, TCStorageService, orderByFilter, DateUtils, OptionSetService, OperatorFactory) {

    return {
        getAll: function(){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll('attributes').done(function(attributes){
                    $rootScope.$apply(function(){
                        def.resolve(attributes);
                    });
                });
            });
            return def.promise;
        },
        getByProgram: function(program){
            var def = $q.defer();
            this.getAll().then(function(atts){

                if(program && program.id){
                    var attributes = [];
                    var programAttributes = [];
                    angular.forEach(atts, function(attribute){
                        attributes[attribute.id] = attribute;
                    });

                    angular.forEach(program.programTrackedEntityAttributes, function(pAttribute){
                        var att = attributes[pAttribute.trackedEntityAttribute.id];
                        
                        if (att) {
                            att.programTrackedEntityAttribute = pAttribute;
                            att.mandatory = pAttribute.mandatory;
                            att.displayInListNoProgram = pAttribute.displayInList;
                            
                            if(pAttribute.renderOptionsAsRadio){
                                att.renderOptionsAsRadio = pAttribute.renderOptionsAsRadio;
                            }
                            if(pAttribute.searchable)
                            {
                                att.searchable = pAttribute.searchable;
                            }
                            att.allowFutureDate = pAttribute.allowFutureDate;
                            programAttributes.push(att);
                        }
                    });

                    def.resolve(programAttributes);
                }
                else{
                    var attributes = [];
                    angular.forEach(atts, function(attribute){
                        if (attribute.displayInListNoProgram) {
                            attributes.push(attribute);
                        }
                    });

                    attributes = orderByFilter(attributes, '-sortOrderInListNoProgram').reverse();
                    def.resolve(attributes);
                }
            });
            return def.promise;
        },
        getByTrackedEntityType: function(trackedEntityType){
            var def = $q.defer();
            this.getAll().then(function(atts){

                if(trackedEntityType && trackedEntityType.id){
                    var attributes = [];
                    var trackedEntityTypeAttributes = [];
                    angular.forEach(atts, function(attribute){
                        attributes[attribute.id] = attribute;
                    });

                    angular.forEach(trackedEntityType.trackedEntityTypeAttributes, function(teAttribute){
                        var att = attributes[teAttribute.trackedEntityAttribute.id];
                        if (att) {
                            att.mandatory = teAttribute.mandatory;
                            if (teAttribute.displayInList) {
                                att.displayInListNoProgram = true;
                            }
                            if(teAttribute.renderOptionsAsRadio){
                                att.renderOptionsAsRadio = teAttribute.renderOptionsAsRadio;
                            }
                            if(teAttribute.searchable)
                            {
                                att.searchable = teAttribute.searchable;
                            }
                            trackedEntityTypeAttributes.push(att);
                        }
                    });

                    def.resolve(trackedEntityTypeAttributes);
                }
                else{
                    var attributes = [];
                    angular.forEach(atts, function(attribute){
                        if (attribute.displayInListNoProgram) {
                            attributes.push(attribute);
                        }
                    });

                    attributes = orderByFilter(attributes, '-sortOrderInListNoProgram').reverse();
                    def.resolve(attributes);
                }
            });
            return def.promise;
        },
        getWithoutProgram: function(){

            var def = $q.defer();
            this.getAll().then(function(atts){
                var attributes = [];
                angular.forEach(atts, function(attribute){
                    if (attribute.displayInListNoProgram) {
                        attributes.push(attribute);
                    }
                });
                def.resolve(attributes);
            });
            return def.promise;
        },
        getMissingAttributesForEnrollment: function(tei, program){
            var def = $q.defer();
            this.getByProgram(program).then(function(atts){
                var programAttributes = atts;
                var existingAttributes = tei.attributes;
                var missingAttributes = [];

                for(var i=0; i<programAttributes.length; i++){
                    var exists = false;
                    for(var j=0; j<existingAttributes.length && !exists; j++){
                        if(programAttributes[i].id === existingAttributes[j].attribute){
                            exists = true;
                        }
                    }
                    if(!exists){
                        missingAttributes.push(programAttributes[i]);
                    }
                }
                def.resolve(missingAttributes);
            });
            return def.promise();
        },
        showRequiredAttributes: function(requiredAttributes, teiAttributes, fromEnrollment){

            //first reset teiAttributes
            for(var j=0; j<teiAttributes.length; j++){
                teiAttributes[j].show = false;
            }

            //identify which ones to show
            for(var i=0; i<requiredAttributes.length; i++){
                var processed = false;
                for(var j=0; j<teiAttributes.length && !processed; j++){
                    if(requiredAttributes[i].id === teiAttributes[j].attribute){
                        processed = true;
                        teiAttributes[j].show = true;
                        teiAttributes[j].order = i;
                        teiAttributes[j].mandatory = requiredAttributes[i].mandatory ? requiredAttributes[i].mandatory : false;
                        teiAttributes[j].allowFutureDate = requiredAttributes[i].allowFutureDate ? requiredAttributes[i].allowFutureDate : false;
                        teiAttributes[j].displayName = requiredAttributes[i].displayName;
                    }
                }

                if(!processed && fromEnrollment){//attribute was empty, so a chance to put some value
                    teiAttributes.push({show: true, order: i, allowFutureDate: requiredAttributes[i].allowFutureDate ? requiredAttributes[i].allowFutureDate : false, mandatory: requiredAttributes[i].mandatory ? requiredAttributes[i].mandatory : false, attribute: requiredAttributes[i].id, displayName: requiredAttributes[i].displayName, type: requiredAttributes[i].valueType, value: ''});
                }
            }

            teiAttributes = orderByFilter(teiAttributes, '-order');
            teiAttributes.reverse();
            return teiAttributes;
        },
        generateAttributeFilters: function(attributes){
            angular.forEach(attributes, function(attribute){
                if(attribute.valueType === 'NUMBER' || attribute.valueType === 'DATE' || attribute.valueType === 'DATETIME'){
                    attribute.operator = OperatorFactory.defaultOperators[0];
                }
            });
            return attributes;
        }
    };
})

/* factory for handling events */
.factory('DHIS2EventFactory', function($http, DHIS2URL, NotificationService, $translate, TeiAccessApiService) {

    var skipPaging = "&skipPaging=true";
    var errorHeader = $translate.instant("error");

    var getContextEvent = function(dhis2Event){
        if(Array.isArray(dhis2Event)){
            return dhis2Event[0];
        }
        return dhis2Event;
    }

    return {

        getEventsByStatus: function(entity, orgUnit, program, programStatus){
            var promise = TeiAccessApiService.get(entity, program, DHIS2URL + '/events.json?ouMode=ACCESSIBLE&' + 'trackedEntityInstance=' + entity + '&orgUnit=' + orgUnit + '&program=' + program + '&programStatus=' + programStatus  + skipPaging).then(function(response){
                return response.data.events;
            }, function (response) {

                var errorBody = $translate.instant('failed_to_fetch_events');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
            });

            return promise;
        },
        getEventsByProgram: function(entity, program, attributeCategory){
            var url = DHIS2URL + '/events.json?ouMode=ACCESSIBLE&' + 'trackedEntityInstance=' + entity + skipPaging;

            url = url + '&program=' + program;

            if( attributeCategory && !attributeCategory.default){
                url = url + '&attributeCc=' + attributeCategory.cc + '&attributeCos=' + attributeCategory.cp;
            }

            var promise = TeiAccessApiService.get(entity,program, url ).then(function(response){
                return response.data.events;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_fetch_events');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        getEventsByProgramStage: function(entity, program, programStage){
            var url = DHIS2URL + '/events.json?ouMode=ACCESSIBLE&' + 'trackedEntityInstance=' + entity + skipPaging;
            if(programStage){
                url += '&programStage='+programStage;
            }
            var promise = TeiAccessApiService.get(entity,program, url).then(function(response){
                return response.data.events;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_fetch_events');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        getByOrgUnitAndProgram: function(orgUnit, ouMode, program, startDate, endDate, pageSize){
            var url;
            var paging = pageSize ? '&pageSize=' + pageSize : skipPaging;
            if(startDate && endDate){
                url = DHIS2URL + '/events.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program + '&startDate=' + startDate + '&endDate=' + endDate + paging;
            }
            else{
                url = DHIS2URL + '/events.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program + paging;
            }
            var promise = $http.get( url ).then(function(response){
                return response.data.events;
            }, function(response){
                if( response && response.data && response.data.status === 'ERROR'){
                    var errorBody = $translate.instant('unable_to_fetch_data_from_server');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                }
            });
            return promise;
        },
        get: function(teiUid, programUid, eventUid){
            var promise = TeiAccessApiService.get(teiUid, programUid, DHIS2URL + '/events/' + eventUid + '.json').then(function(response){
                return response.data;
            }, function (response) {
                if (response && response.data && response.data.status === 'ERROR') {
                    var errorBody = $translate.instant('failed_to_fetch_events');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                }
            });
            return promise;
        },
        getEventWithoutRegistration: function(eventId) {
            var url = DHIS2URL + '/events/' + eventId;

            var promise = $http.get( url ).then(function(response){
                return response.data;
            }, function(response){
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        create: function(dhis2Event){
            var contextEvent = getContextEvent(dhis2Event);
            var promise = TeiAccessApiService.post(contextEvent.trackedEntityInstance, contextEvent.program, DHIS2URL + '/events.json', dhis2Event).then(function(response){
                return response.data;
            }, function (response) {
                if (response && response.data && (response.data.status === 'ERROR' || response.data.status === 'WARNING')) {
                    var errorBody = $translate.instant('event_creation_error');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                    return null;
                }
            });
            return promise;
        },
        delete: function(dhis2Event){
            var contextEvent = getContextEvent(dhis2Event);
            var promise = TeiAccessApiService.delete(contextEvent.trackedEntityInstance, contextEvent.program, DHIS2URL + '/events/' + dhis2Event.event).then(function(response){
                return response.data;
            }, function (response) {
                if (response && response.data && response.data.status === 'ERROR') {
                    var errorBody = $translate.instant('delete_error_audit');
                    NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                }
            });
            return promise;
        },
        update: function(dhis2Event){
            var contextEvent = getContextEvent(dhis2Event);
            var promise = TeiAccessApiService.put(contextEvent.trackedEntityInstance, contextEvent.program, DHIS2URL + '/events/' + dhis2Event.event, dhis2Event).then(function(response){
                return response.data;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
            });
            return promise;
        },
        updateForSingleValue: function(singleValue){
            var promise = TeiAccessApiService.put(singleValue.trackedEntityInstance, singleValue.program, DHIS2URL + '/events/' + singleValue.event + '/' + singleValue.dataValues[0].dataElement, singleValue ).then(function(response){
                return response.data;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        updateForNote: function(dhis2Event){
            var contextEvent = getContextEvent(dhis2Event);
            var promise = TeiAccessApiService.post(contextEvent.trackedEntityInstance, contextEvent.program, DHIS2URL + '/events/' + dhis2Event.event + '/note', dhis2Event).then(function(response){
                return response.data;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        },
        updateForEventDate: function(dhis2Event){
            var contextEvent = getContextEvent(dhis2Event);
            var promise = TeiAccessApiService.put(contextEvent.trackedEntityInstance, contextEvent.program, DHIS2URL + '/events/' + dhis2Event.event + '/eventDate', dhis2Event).then(function(response){
                return response.data;
            }, function (response) {
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        }
    };
})

/* factory for handling event reports */
.factory('EventReportService', function($http, DHIS2URL, $translate, NotificationService) {
    var errorHeader = $translate.instant("error");
    return {

        getEventReport: function(orgUnit, ouMode, program, startDate, endDate, programStatus, eventStatus, pager){

            var url = DHIS2URL + '/events/eventRows.json?' + 'orgUnit=' + orgUnit + '&ouMode='+ ouMode + '&program=' + program;

            if( programStatus ){
                url = url + '&programStatus=' + programStatus;
            }

            if( eventStatus ){
                url = url + '&eventStatus=' + eventStatus;
            }

            if(startDate && endDate){
                url = url + '&startDate=' + startDate + '&endDate=' + endDate ;
            }

            if( pager ){
                var pgSize = pager ? pager.pageSize : 50;
                var pg = pager ? pager.page : 1;
                pgSize = pgSize > 1 ? pgSize  : 1;
                pg = pg > 1 ? pg : 1;
                url = url + '&pageSize=' + pgSize + '&page=' + pg;
            }

            var promise = $http.get( url ).then(function(response){
                return response.data;
            }, function(response){
                var errorBody = $translate.instant('failed_to_update_event');
                NotificationService.showNotifcationDialog(errorHeader, errorBody, response);
                return null;
            });
            return promise;
        }
    };
})

.factory('OperatorFactory', function($translate){

    var defaultOperators = [$translate.instant('IS'), $translate.instant('RANGE') ];
    var boolOperators = [$translate.instant('yes'), $translate.instant('no')];
    var textOperators = [$translate.instant('EQ')];
    return{
        defaultOperators: defaultOperators,
        boolOperators: boolOperators,
        textOperators: textOperators
    };
})
/* factory to fetch and process metadata */
.factory('MetaDataFactory', function($q, $rootScope, TCStorageService) {
    return {
        get: function(store, uid){

            var def = $q.defer();

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.get(store, uid).done(function(pv){
                    $rootScope.$apply(function(){
                        def.resolve(pv);
                    });
                });
            });
            return def.promise;
        },
        getByProgram: function(store, program){
            var def = $q.defer();
            var obj = [];

            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll(store, program).done(function(pvs){
                    angular.forEach(pvs, function(pv){
                        if(pv.program.id === program){
                            obj.push(pv);
                        }
                    });

                    $rootScope.$apply(function(){
                        def.resolve(obj);
                    });
                });
            });
            return def.promise;
        },
        getAll: function(store){
            var def = $q.defer();
            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll(store).done(function(pvs){
                    $rootScope.$apply(function(){
                        def.resolve(pvs);
                    });
                });
            });
            return def.promise;
        }
    };
})

/* Returns a function for getting rules for a specific program */
.factory('TrackerRulesFactory', function($q,MetaDataFactory,$filter){
    var staticReplacements =
        [{regExp:new RegExp("([^\w\d])(and)([^\w\d])","gi"), replacement:"$1&&$3"},
            {regExp:new RegExp("([^\w\d])(or)([^\w\d])","gi"), replacement:"$1||$3"},
            {regExp:new RegExp("V{execution_date}","g"), replacement:"V{event_date}"}];

    var performStaticReplacements = function(expression) {
        angular.forEach(staticReplacements, function(staticReplacement) {
            expression = expression.replace(staticReplacement.regExp, staticReplacement.replacement);
        });

        return expression;
    };

    return{
        getRules : function(programUid){
            var def = $q.defer();
            MetaDataFactory.getAll('constants').then(function(constants) {
                MetaDataFactory.getByProgram('programIndicators',programUid).then(function(pis){
                    var variables = [];
                    var programRules = [];
                    angular.forEach(pis, function(pi){
                        if(pi.displayInForm){
                            var newAction = {
                                id:pi.id,
                                content:pi.displayDescription ? pi.displayDescription : pi.displayName,
                                displayContent:pi.displayName,
                                data:pi.expression,
                                programRuleActionType:'DISPLAYKEYVALUEPAIR',
                                location:'indicators'
                            };
                            var newRule = {
                                name:pi.displayName,
                                id: pi.id,
                                shortname:pi.shortname,
                                code:pi.code,
                                program:pi.program,
                                description:pi.description,
                                condition:pi.filter ? pi.filter : 'true',
                                programRuleActions: [newAction]
                            };

                            programRules.push(newRule);

                            var variablesInCondition = newRule.condition.match(/[A#]{\w+.?\w*}/g);
                            var variablesInData = newAction.data.match(/[A#]{\w+.?\w*}/g);
                            var valueCountPresent = newRule.condition.indexOf("V{value_count}") >= 0
                                || newAction.data.indexOf("V{value_count}") >= 0;
                            var positiveValueCountPresent = newRule.condition.indexOf("V{zero_pos_value_count}") >= 0
                                || newAction.data.indexOf("V{zero_pos_value_count}") >= 0;
                            var variableObjectsCurrentExpression = [];

                            var pushDirectAddressedVariable = function(variableWithCurls) {
                                var variableName = $filter('trimvariablequalifiers')(variableWithCurls);
                                var variableNameParts = variableName.split('.');

                                var newVariableObject;

                                if(variableNameParts.length === 2) {
                                    //this is a programstage and dataelement specification. translate to program variable:
                                    newVariableObject = {
                                        displayName:variableName,
                                        programRuleVariableSourceType:'DATAELEMENT_NEWEST_EVENT_PROGRAM_STAGE',
                                        dataElement:variableNameParts[1],
                                        valueType:'TEXT',
                                        programStage:variableNameParts[0],
                                        program:programUid,
                                        useCodeForOptionSet:true
                                    };
                                }
                                else if(variableNameParts.length === 1)
                                {
                                    //This is an attribute - let us translate to program variable:
                                    newVariableObject = {
                                        displayName:variableName,
                                        programRuleVariableSourceType:'TEI_ATTRIBUTE',
                                        valueType:'TEXT',
                                        trackedEntityAttribute:variableNameParts[0],
                                        program:programUid,
                                        useCodeForOptionSet:true
                                    };
                                }
                                variables.push(newVariableObject);

                                return newVariableObject;

                            };

                            angular.forEach(variablesInCondition, function(variableInCondition) {
                                var pushed = pushDirectAddressedVariable(variableInCondition);
                            });

                            angular.forEach(variablesInData, function(variableInData) {
                                var pushed = pushDirectAddressedVariable(variableInData);

                                //We only count the number of values in the data part of the rule
                                //(Called expression in program indicators)
                                variableObjectsCurrentExpression.push(pushed);
                            });

                            //Change expression or data part of the rule to match the program rules execution model

                            if(valueCountPresent) {
                                var valueCountText;
                                angular.forEach(variableObjectsCurrentExpression, function(variableCurrentRule) {
                                    if(valueCountText) {
                                        //This is not the first value in the value count part of the expression.
                                        valueCountText +=  ' + d2:count(\'' + variableCurrentRule.displayName + '\')';
                                    }
                                    else
                                    {
                                        //This is the first part value in the value count expression:
                                        valueCountText = '(d2:count(\'' + variableCurrentRule.displayName + '\')';
                                    }
                                });
                                //To finish the value count expression we need to close the paranthesis:
                                valueCountText += ')';

                                //Replace all occurrences of value counts in both the data and expression:
                                newRule.condition = newRule.condition.replace(new RegExp("V{value_count}", 'g'),valueCountText);
                                newAction.data = newAction.data.replace(new RegExp("V{value_count}", 'g'),valueCountText);
                            }
                            if(positiveValueCountPresent) {
                                var zeroPosValueCountText;
                                angular.forEach(variableObjectsCurrentExpression, function(variableCurrentRule) {
                                    if(zeroPosValueCountText) {
                                        //This is not the first value in the value count part of the expression.
                                        zeroPosValueCountText +=  '+ d2:countifzeropos(\'' + variableCurrentRule.displayName + '\')';
                                    }
                                    else
                                    {
                                        //This is the first part value in the value count expression:
                                        zeroPosValueCountText = '(d2:countifzeropos(\'' + variableCurrentRule.displayName + '\')';
                                    }
                                });
                                //To finish the value count expression we need to close the paranthesis:
                                zeroPosValueCountText += ')';

                                //Replace all occurrences of value counts in both the data and expression:
                                newRule.condition = newRule.condition.replace(new RegExp("V{zero_pos_value_count}", 'g'),zeroPosValueCountText);
                                newAction.data = newAction.data.replace(new RegExp("V{zero_pos_value_count}", 'g'),zeroPosValueCountText);
                            }

                            newAction.data = performStaticReplacements(newAction.data);
                            newRule.condition = performStaticReplacements(newRule.condition);
                        }
                    });

                    var programIndicators = {rules:programRules, variables:variables};

                    MetaDataFactory.getByProgram('programRuleVariables',programUid).then(function(programVariables){
                        MetaDataFactory.getByProgram('programRules',programUid).then(function(prs){
                            var programRules = [];
                            angular.forEach(prs, function(rule){
                                rule.actions = [];
                                rule.programStageId = rule.programStage && rule.programStage.id ? rule.programStage.id : null;
                                programRules.push(rule);
                            });
                            def.resolve({constants: constants, programIndicators: programIndicators, programVariables: programVariables, programRules: programRules});
                        });
                    });

                });
            });
            return def.promise;
        }
    };
})

.service('EntityQueryFactory', function(OperatorFactory, DateUtils){

    this.getAttributesQuery = function(attributes, enrollment){

        var query = {url: null, hasValue: false};
        
        angular.forEach(attributes, function(attribute){

            if(attribute.valueType === 'DATE' || attribute.valueType === 'NUMBER' || attribute.valueType === 'DATETIME'){
                var q = '';

                if(attribute.operator === OperatorFactory.defaultOperators[0]){
                    if(attribute.exactValue && attribute.exactValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'DATE' || attribute.valueType === 'DATETIME'){
                            attribute.exactValue = DateUtils.formatFromUserToApi(attribute.exactValue);
                        }

                        if(attribute.valueType === 'DATETIME') {
                            q += 'LIKE:' + attribute.exactValue + ':';
                        } else {
                            q += 'EQ:' + attribute.exactValue + ':';
                        }
                    }
                }
                if(attribute.operator === OperatorFactory.defaultOperators[1]){
                    if(attribute.startValue && attribute.startValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'DATE' || attribute.valueType === 'DATETIME'){
                            attribute.startValue = DateUtils.formatFromUserToApi(attribute.startValue);
                        }
                        q += 'GT:' + attribute.startValue + ':';
                    }
                    if(attribute.endValue && attribute.endValue !== ''){
                        query.hasValue = true;
                        if(attribute.valueType === 'DATE' || attribute.valueType === 'DATETIME'){
                            attribute.endValue = DateUtils.formatFromUserToApi(attribute.endValue);
                        }
                        q += 'LT:' + attribute.endValue + ':';
                    }
                }
                if(query.url){
                    if(q){
                        q = q.substr(0,q.length-1);
                        query.url = query.url + '&filter=' + attribute.id + ':' + q;
                    }
                }
                else{
                    if(q){
                        q = q.substr(0,q.length-1);
                        query.url = 'filter=' + attribute.id + ':' + q;
                    }
                }
            }
            else{
                if(attribute.value && attribute.value !== ''){
                    query.hasValue = true;

                    if(angular.isArray(attribute.value)){
                        var q = '';
                        angular.forEach(attribute.value, function(val){
                            q += val + ';';
                        });

                        q = q.substr(0,q.length-1);

                        if(query.url){
                            if(q){
                                query.url = query.url + '&filter=' + attribute.id + ':IN:' + q;
                            }
                        }
                        else{
                            if(q){
                                query.url = 'filter=' + attribute.id + ':IN:' + q;
                            }
                        }
                    }
                    else{
                        if(query.url){
                            query.url = query.url + '&filter=' + attribute.id + ':LIKE:' + attribute.value;
                        }
                        else{
                            query.url = 'filter=' + attribute.id + ':LIKE:' + attribute.value;
                        }
                    }
                }
            }
        });

        if(enrollment){
            var q = '';
            if(enrollment.programEnrollmentStartDate && enrollment.programEnrollmentStartDate !== ''){
                query.hasValue = true;
                q += '&programEnrollmentStartDate=' + DateUtils.formatFromUserToApi(enrollment.programEnrollmentStartDate);
            }
            if(enrollment.programEnrollmentEndDate && enrollment.programEnrollmentEndDate !== ''){
                query.hasValue = true;
                q += '&programEnrollmentEndDate=' + DateUtils.formatFromUserToApi(enrollment.programEnrollmentEndDate);
            }
            if(enrollment.programIncidentStartDate && enrollment.programIncidentStartDate !== ''){
                query.hasValue = true;
                q += '&programIncidentStartDate=' + DateUtils.formatFromUserToApi(enrollment.programIncidentStartDate);
            }
            if(enrollment.programIncidentEndDate && enrollment.programIncidentEndDate !== ''){
                query.hasValue = true;
                q += '&programIncidentEndDate=' + DateUtils.formatFromUserToApi(enrollment.programIncidentEndDate);
            }
            if(q){
                if(query.url){
                    query.url = query.url + q;
                }
                else{
                    query.url = q;
                }
            }
        }
        return query;

    };

    this.resetAttributesQuery = function(attributes, enrollment){

        angular.forEach(attributes, function(attribute){
            attribute.exactValue = '';
            attribute.startValue = '';
            attribute.endValue = '';
            attribute.value = '';
        });

        if(enrollment){
            enrollment.programStartDate = '';
            enrollment.programEndDate = '';
        }
        return attributes;
    };
})

.service('TEIGridService', function(OptionSetService, CommonUtils, CurrentSelection, DateUtils, $location, $translate, $filter){
    var setShowGridColumn = function(column, columnIndex, config, savedGridColumnsKeyMap){
        if(config.showAll){
            column.show = true;
        }
        else if(savedGridColumnsKeyMap && savedGridColumnsKeyMap[column.id]){
            column.show = savedGridColumnsKeyMap[column.id].show;
        }else if(config.defaultRange && config.defaultRange.start && config.defaultRange.end){
            if(columnIndex >= config.defaultRange.start && columnIndex <= config.defaultRange.end){
                column.show = true;
            }
        }else{
            column.show = false;
        }
    }
    return {
        format: function(selectedOrgUnitId, grid, map, optionSets, invalidTeis, isFollowUp){
            var ouId = ($location.search()).ou;
            if (!ouId) {
                ouId = selectedOrgUnitId;
            }

            invalidTeis = !invalidTeis ? [] : invalidTeis;
            if (!grid || !grid.rows) {
                return;
            }

            //grid.headers[0-7] = Instance, Created, Last updated, OU ID, Ou Name, Tracked entity, Inactive, Potential duplicate
            //grid.headers[8..] = Attribute, Attribute,....
            var attributes = [];
            for (var i = 8; i < grid.headers.length; i++) {
                attributes.push({
                    id: grid.headers[i].name,
                    displayName: grid.headers[i].column,
                    type: grid.headers[i].type,
                    hideInList: grid.headers[i].hideInList,
                });
            }

            var entityList = {own: [], other: []};

            var attributesById = CurrentSelection.getAttributesById();

            angular.forEach(grid.rows, function (row) {
                if (invalidTeis.indexOf(row[0]) === -1) {
                    var entity = {};

                    entity.id = row[0];
                    entity.created = DateUtils.formatFromApiToUser(row[1]);

                    entity.orgUnit = row[3];
                    entity.orgUnitName = row[4];
                    entity.type = row[5];
                    entity.inactive = row[6] === "" ? "" : row[6];
                    entity.potentialDuplicate = row[7] === "true";
                    entity.followUp = isFollowUp;

                    for (var i = 8; i < row.length; i++) {
                        if (row[i] && row[i] !== '') {
                            var val = row[i];

                            if (attributesById[grid.headers[i].name] &&
                                attributesById[grid.headers[i].name].optionSetValue &&
                                optionSets &&
                                attributesById[grid.headers[i].name].optionSet &&
                                optionSets[attributesById[grid.headers[i].name].optionSet.id]) {
                                val = OptionSetService.getName(optionSets[attributesById[grid.headers[i].name].optionSet.id].options, val);
                            }
                            if (attributesById[grid.headers[i].name] && attributesById[grid.headers[i].name].valueType ) {
                                if ( attributesById[grid.headers[i].name].valueType === "DATE"){
                                    val = DateUtils.formatFromApiToUser(val);
                                }
                            }

                            entity[grid.headers[i].name] = val;
                        }
                    }

                    if (map) {
                        entityList[entity.id] = entity;
                    }
                    else {
                        if (entity.orgUnit === ouId) {
                            entityList.own.push(entity);
                        }
                        else {
                            entityList.other.push(entity);
                        }
                    }
                }
            });

            var len = entityList.own.length + entityList.other.length;
            return {headers: attributes.filter(a => !a.hideInList), rows: entityList, pager: grid.metaData.pager, length: len};
        },
        generateGridColumns: function(attributes, ouMode, nonConfidential){

            if( ouMode === null ){
                ouMode = 'SELECTED';
            }
            var filterTypes = {}, filterText = {};
            var columns = [];

            var returnAttributes = [];
            if(nonConfidential) {
                //Filter out attributes that is confidential, so they will not be part of any grid:
                returnAttributes = angular.copy($filter('nonConfidential')(attributes));
            }
            else
            {
                returnAttributes = angular.copy(attributes);
            }

            //also add extra columns which are not part of attributes (orgunit for example)
            columns.push({id: 'orgUnitName', displayName: $translate.instant('registering_unit'), valueType: 'TEXT', displayInListNoProgram: false, attribute: false});
            columns.push({id: 'created', displayName: $translate.instant('registration_date'), valueType: 'DATE', displayInListNoProgram: false, attribute: false});
            columns.push({id: 'inactive', displayName: $translate.instant('inactive'), valueType: 'BOOLEAN', displayInListNoProgram: false, attribute: false});
            columns = columns.concat(returnAttributes ? returnAttributes : []);

            //generate grid column for the selected program/attributes
            angular.forEach(columns, function(column){
                column.attribute = angular.isUndefined(column.attribute) ? true : false;
                column.show = false;

                if( (column.id === 'orgUnitName' && ouMode !== 'SELECTED') ||
                    column.displayInListNoProgram ||
                    column.displayInList){
                    column.show = true;
                }
                column.showFilter = false;
                filterTypes[column.id] = column.valueType;
                if(column.valueType === 'DATE' || column.valueType === 'NUMBER' ){
                    filterText[column.id]= {};
                }
            });
            return {columns: columns, filterTypes: filterTypes, filterText: filterText};
        },
        makeGridColumns: function(attributes,config, savedGridColumnsKeyMap){
            var gridColumns = [
                {id: 'orgUnitName', displayName: $translate.instant('registering_unit'), show: false, valueType: 'TEXT'},
                {id: 'created', displayName: $translate.instant('registration_date'), show: false, valueType: 'DATE'},
                {id: 'inactive', displayName: $translate.instant('inactive'), show: false, valueType: 'BOOLEAN'}
            ];
            setShowGridColumn(gridColumns[0],0, config, savedGridColumnsKeyMap);
            setShowGridColumn(gridColumns[1],1, config, savedGridColumnsKeyMap);
            setShowGridColumn(gridColumns[2],2, config, savedGridColumnsKeyMap);

            var gridColumnIndex = 2;
            
            angular.forEach(attributes, function(attr){
                if(attr.displayInListNoProgram){
                    gridColumnIndex++;
                    var gridColumn = {id: attr.id, displayName: attr.displayName, formName: attr.formName, show: false, valueType: attr.valueType};
                    setShowGridColumn(gridColumn,gridColumnIndex, config, savedGridColumnsKeyMap);
                    gridColumns.push(gridColumn);
                }
            });
            return gridColumns;
        },
        generateGridColumnsForSearch: function(existedColumns, attributes, ouMode, nonConfidential){
            if( ouMode === null ){
                ouMode = 'SELECTED';
            }
            var filterTypes = {}, filterText = {};
            var columns = [];

            var returnAttributes = [];

            if ( attributes )
            {
                if( nonConfidential ) {
                    //Filter out attributes that is confidential, so they will not be part of any grid:
                    returnAttributes = angular.copy($filter('nonConfidential')(attributes));
                }
                else
                {
                    returnAttributes = angular.copy( attributes );
                }
            }

            if ( !existedColumns ) {
                //also add extra columns which are not part of attributes (orgunit for example)
                columns.push({id: 'orgUnitName', displayName: $translate.instant('registering_unit'), valueType: 'TEXT', displayInListNoProgram: false, attribute: false});
                columns.push({id: 'created', displayName: $translate.instant('registration_date'), valueType: 'DATE', displayInListNoProgram: false, attribute: false});
                columns.push({id: 'inactive', displayName: $translate.instant('inactive'), valueType: 'BOOLEAN', displayInListNoProgram: false, attribute: false});
                columns = columns.concat(returnAttributes ? returnAttributes : []);
                //generate grid column for the selected program/attributes
                angular.forEach(columns, function(column)
                {
                    column.attribute = angular.isUndefined(column.attribute) ? true : false;
                    column.show = false;

                    if( (column.id === 'orgUnitName' && ouMode !== 'SELECTED') || column.displayInListNoProgram || column.displayInList )
                    {
                        column.show = true
                    }
                    column.showFilter = false;
                    filterTypes[column.id] = column.valueType;
                    if(column.valueType === 'DATE' || column.valueType === 'NUMBER' )
                    {
                        filterText[column.id]= {};
                    }

                });
            }
            else
            {
                for ( var i = 0; i <  Object.keys( returnAttributes ).length; i ++ )
                {
                    var existed = false;
                    var col = returnAttributes[i];
                    for ( var j = 0; j < Object.keys( existedColumns ).length; j++ )
                    {
                        if ( col.id == existedColumns[j].id )
                        {
                            columns.push(existedColumns[j]);
                            existed = true;
                            break;
                        }
                    }

                    if ( !existed )
                    {
                        col.attribute = angular.isUndefined(col.attribute) ? true : false;
                        col.show = false;
                        col.showFilter = false;
                        filterTypes[col.id] = col.valueType;
                        if(col.valueType === 'DATE' || col.valueType === 'NUMBER' ){
                            filterText[col.id]= {};
                        }
                        columns.push(col);
                    }
                }
            }
            return {columns: columns, filterTypes: filterTypes, filterText: filterText};
        },
        getData: function(rows, columns){
            var data = [];
            angular.forEach(rows, function(row){
                var d = {};
                angular.forEach(columns, function(col){
                    if(col.show){
                        d[col.displayName] = row[col.id];
                    }
                });
                data.push(d);
            });
            return data;
        },
        getHeader: function(columns){
            var header = [];
            angular.forEach(columns, function(col){
                if(col.show){
                    header.push($translate.instant(col.displayName));
                }
            });
            return header;
        }
    };
})

.service('EventUtils', function(DateUtils, CommonUtils, PeriodService, CalendarService, CurrentSelection, $translate, $filter, $rootScope, orderByFilter){

    var getEventDueDate = function(eventsByStage, programStage, enrollment){

        var referenceDate = enrollment.incidentDate ? enrollment.incidentDate : enrollment.enrollmentDate,
            offset = programStage.minDaysFromStart,
            calendarSetting = CalendarService.getSetting(),
            dueDate;

        if(programStage.generatedByEnrollmentDate){
            referenceDate = enrollment.enrollmentDate;
        }

        if(programStage.repeatable){
            var evs = [];
            angular.forEach(eventsByStage, function(ev){
                if(ev.eventDate){
                    evs.push(ev);
                }
            });

            if(evs.length > 0){
                evs = orderByFilter(evs, '-eventDate');
                if(programStage.periodType){

                }
                else{
                    referenceDate = evs[0].eventDate;
                    offset = programStage.standardInterval;
                }
            }
        }
        dueDate = moment(referenceDate, calendarSetting.momentFormat).add('d', offset)._d;
        dueDate = $filter('date')(dueDate, calendarSetting.keyDateFormat);
        return dueDate;
    };

    var getEventDuePeriod = function(eventsByStage, programStage, enrollment){

        var evs = [];
        angular.forEach(eventsByStage, function(ev){
            if(ev.eventDate){
                evs.push(ev);
            }
        });

        if(evs.length > 0){
            evs = orderByFilter(evs, '-eventDate');
        }

        return PeriodService.getPeriods(evs,programStage, enrollment);
    };

    var reconstructEvent = function(dhis2Event, programStage, optionSets){
        var e = {dataValues: [],
            event: dhis2Event.event,
            program: dhis2Event.program,
            programStage: dhis2Event.programStage,
            orgUnit: dhis2Event.orgUnit,
            trackedEntityInstance: dhis2Event.trackedEntityInstance,
            status: dhis2Event.status,
            dueDate: DateUtils.formatFromUserToApi(dhis2Event.dueDate),
            geometry: dhis2Event.geometry,
            assignedUser: dhis2Event.assignedUser
        };

        angular.forEach(programStage.programStageDataElements, function(prStDe){
            if(dhis2Event[prStDe.dataElement.id] || dhis2Event[prStDe.dataElement.id] === 0){
                var value = CommonUtils.formatDataValue(dhis2Event.event, dhis2Event[prStDe.dataElement.id], prStDe.dataElement, optionSets, 'API');
                var val = {value: value, dataElement: prStDe.dataElement.id};
                if(dhis2Event.providedElsewhere[prStDe.dataElement.id]){
                    val.providedElsewhere = dhis2Event.providedElsewhere[prStDe.dataElement.id];
                }
                e.dataValues.push(val);
            }
        });

        if(dhis2Event.eventDate){
            e.eventDate = DateUtils.formatFromUserToApi(dhis2Event.eventDate);
        }

        return e;
    };

    return {
        createDummyEvent: function(eventsPerStage, tei, program, programStage, orgUnit, enrollment){
            var today = DateUtils.getToday();
            var dummyEvent = {trackedEntityInstance: tei.trackedEntityInstance,
                programStage: programStage.id,
                program: program.id,
                orgUnit: orgUnit.id,
                orgUnitName: orgUnit.displayName ? orgUnit.displayName : orgUnit.n ? orgUnit.n : null,
                name: programStage.displayName,
                executionDateLabel: programStage.executionDateLabel ? programStage.executionDateLabel : $translate.instant('report_date'),
                enrollmentStatus: 'ACTIVE',
                enrollment: enrollment.enrollment,
                status: 'SCHEDULED'};

            if(programStage.periodType){
                var prds = getEventDuePeriod(eventsPerStage, programStage, enrollment);
                var periods = prds && prds.availablePeriods && prds.availablePeriods.length ? prds.availablePeriods : [];
                if( periods.length > 0 ){
                    dummyEvent.dueDate = periods[0].endDate;
                    dummyEvent.periodName = periods[0].displayName;
                    dummyEvent.eventDate = dummyEvent.dueDate;
                    dummyEvent.periods = periods;
                    dummyEvent.periodOffset = prds.periodOffset;
                    dummyEvent.hasFuturePeriod = prds.hasFuturePeriod;
                }
            }
            else{
                dummyEvent.dueDate = getEventDueDate(eventsPerStage, programStage, enrollment);
            }

            dummyEvent.sortingDate = dummyEvent.dueDate;


            if(programStage.captureCoordinates){
                dummyEvent.coordinate = {};
            }

            dummyEvent.statusColor = 'alert-warning';//'stage-on-time';
            if(moment(today).isAfter(dummyEvent.dueDate)){
                dummyEvent.statusColor = 'alert-danger';//'stage-overdue';
            }
            return dummyEvent;
        },
        getEventStatusColor: function(dhis2Event){
            var eventDate = DateUtils.getToday();
            var calendarSetting = CalendarService.getSetting();

            if(dhis2Event.eventDate){
                eventDate = dhis2Event.eventDate;
            }

            if(dhis2Event.status === 'COMPLETED'){
                return 'custom-tracker-complete';//'stage-completed';
            }
            else if(dhis2Event.status === 'SKIPPED'){
                return 'alert-default'; //'stage-skipped';
            }
            else{
                if(dhis2Event.eventDate){
                    return 'alert-warning'; //'stage-executed';
                }
                else{
                    if(moment(eventDate, calendarSetting.momentFormat).isAfter(moment(dhis2Event.dueDate, calendarSetting.momentFormat))){
                        return 'alert-danger';//'stage-overdue';
                    }
                    return 'alert-success';//'stage-on-time';
                }
            }
        },
        autoGenerateEvents: function(teiId, program, orgUnit, enrollment, availableEvent){
            var dhis2Events = {events: []};
            if(teiId && program && orgUnit && enrollment){
                angular.forEach(program.programStages, function(stage){
                    if(availableEvent && availableEvent.programStage && availableEvent.programStage === stage.id){
                        var ev = availableEvent;
                        ev.dueDate = ev.dueDate ? ev.dueDate : ev.eventDate;
                        ev.trackedEntityInstance = teiId;
                        ev.enrollment = enrollment.enrollment;
                        delete ev.event;
                        ev = reconstructEvent(ev, stage, CurrentSelection.getOptionSets());
                        dhis2Events.events.push(ev);
                    }

                    if(stage.autoGenerateEvent && (!availableEvent || availableEvent && availableEvent.programStage && availableEvent.programStage !== stage.id)){
                        var newEvent = {
                            trackedEntityInstance: teiId,
                            program: program.id,
                            programStage: stage.id,
                            orgUnit: orgUnit.id,
                            enrollment: enrollment.enrollment
                        };
                        if(stage.periodType){
                            var periods = getEventDuePeriod(null, stage, enrollment);
                            newEvent.dueDate = DateUtils.formatFromUserToApi(periods[0].endDate);
                            newEvent.eventDate = newEvent.dueDate;
                        }
                        else{
                            newEvent.dueDate = DateUtils.formatFromUserToApi(getEventDueDate(null,stage, enrollment));
                        }

                        if(stage.openAfterEnrollment){
                            if(stage.reportDateToUse === 'incidentDate'){
                                newEvent.eventDate = DateUtils.formatFromUserToApi(enrollment.incidentDate);
                            }
                            else{
                                newEvent.eventDate = DateUtils.formatFromUserToApi(enrollment.enrollmentDate);
                            }
                        }

                        newEvent.status = newEvent.eventDate ? 'ACTIVE' : 'SCHEDULE';

                        dhis2Events.events.push(newEvent);
                    }
                });
            }

            return dhis2Events;
        },
        reconstruct: function(dhis2Event, programStage, optionSets){
            return reconstructEvent(dhis2Event, programStage, optionSets);
        },
        processEvent: function(event, stage, optionSets, prStDes){
            event.providedElsewhere = {};
            angular.forEach(event.dataValues, function(dataValue){

                var prStDe = prStDes[dataValue.dataElement];

                if( prStDe ){
                    var val = dataValue.value;
                    if(prStDe.dataElement){
                        val = CommonUtils.formatDataValue(event.event, val, prStDe.dataElement, optionSets, 'USER');
                    }
                    event[dataValue.dataElement] = val;
                    if(dataValue.providedElsewhere){
                        event.providedElsewhere[dataValue.dataElement] = dataValue.providedElsewhere;
                    }

                    switch( prStDe.dataElement.valueType ){
                        case "ORGANISATION_UNIT":
                            CommonUtils.checkAndSetOrgUnitName( val );
                            break;
                    }
                }

            });

            if(stage.captureCoordinates){
                event.coordinate = {latitude: event.coordinate.latitude ? event.coordinate.latitude : '',
                    longitude: event.coordinate.longitude ? event.coordinate.longitude : ''};
            }

            event.allowProvidedElsewhereExists = false;
            for(var i=0; i<stage.programStageDataElements.length; i++){
                if(stage.programStageDataElements[i].allowProvidedElsewhere){
                    event.allowProvidedElsewhereExists = true;
                    break;
                }
            }
            return event;
        },
        getGridColumns: function(stage, prStDes){
            var partial = [], allColumns = [];
            partial.push({id: 'sortingDate', valueType: 'DATE', name: stage.executionDateLabel ? stage.executionDateLabel : $translate.instant('report_date')});
            partial.push({id: 'orgUnitName', valueType: 'TEXT', name: $translate.instant('org_unit')});
            allColumns.push({id: 'sortingDate', valueType: 'DATE', name: stage.executionDateLabel ? stage.executionDateLabel : $translate.instant('report_date')});
            allColumns.push({id: 'orgUnitName', valueType: 'TEXT', name: $translate.instant('org_unit')});
            if(stage.enableUserAssignment) {
                partial.push({id: 'assignedUserUsername', valueType: 'TEXT', name: $translate.instant('assigned_user')});
                allColumns.push({id: 'assignedUserUsername', valueType: 'TEXT', name: $translate.instant('assigned_user')});
            }

            var displayInReports = $filter('filter')(stage.programStageDataElements, {displayInReports: true});
            if( displayInReports.length > 0 ){
                angular.forEach(displayInReports, function(c){
                    if ( prStDes[c.dataElement.id] && prStDes[c.dataElement.id].dataElement) {
                        partial.push({id: c.dataElement.id, valueType: prStDes[c.dataElement.id].dataElement.valueType, name: prStDes[c.dataElement.id].dataElement.displayFormName});
                    }
                });
            }
            for(var i=0; i<stage.programStageDataElements.length; i++){
                if( i < $rootScope.maxGridColumnSize && displayInReports.length === 0){
                    partial.push({id: stage.programStageDataElements[i].dataElement.id, valueType: stage.programStageDataElements[i].dataElement.valueType, name: prStDes[stage.programStageDataElements[i].dataElement.id].dataElement.displayFormName});
                }
                allColumns.push({id: stage.programStageDataElements[i].dataElement.id, valueType: stage.programStageDataElements[i].dataElement.valueType, name: prStDes[stage.programStageDataElements[i].dataElement.id].dataElement.displayFormName});
            }
            return {partial: partial, all: allColumns};
        },
        getEditingStatus: function(dhis2Event, stage, orgUnit, tei, enrollment,program, searchOrgUnits){
            return dhis2Event.orgUnit !== orgUnit.id || (stage.blockEntryForm && dhis2Event.status === 'COMPLETED') || tei.inactive || enrollment.status !== 'ACTIVE';
        },
        isExpired: function(program, event){
            var expired = !DateUtils.verifyExpiryDate(event.eventDate, program.expiryPeriodType, program.expiryDays, false);
            if(expired) return true;

            if(event.status === 'COMPLETED' && program.completeEventsExpiryDays && program.completeEventsExpiryDays > 0){
                var expiryDate = moment(event.completedDate).add(program.completeEventsExpiryDays, 'days');
                var now = moment();
                if(expiryDate < now) return true;
            }
            return false;
        }
    };
})

.service('EventCreationService', function($modal){

    this.showModal = function(eventsByStage, stage, availableStages, writableStages, programStages,selectedEntity,selectedProgram,selectedOrgUnit,selectedEnrollment, autoCreate, eventCreationAction,allEventsSorted, selectedCategories){
        var modalInstance = $modal.open({
            templateUrl: 'components/dataentry/new-event.html',
            controller: 'EventCreationController',
            windowClass: 'modal-new-event-window',
            resolve: {
                eventsByStage: function () {
                    return eventsByStage;
                },
                stage: function () {
                    return stage;
                },
                stages: function(){
                    return availableStages;
                },
                writableStages: function(){
                    return writableStages;
                },
                allStages: function(){
                    return programStages;
                },
                tei: function(){
                    return selectedEntity;
                },
                program: function(){
                    return selectedProgram;
                },
                orgUnit: function(){
                    return selectedOrgUnit;
                },
                enrollment: function(){
                    return selectedEnrollment;
                },
                autoCreate: function () {
                    return autoCreate;
                },
                eventCreationAction: function(){
                    return eventCreationAction;
                },
                events: function(){
                    return allEventsSorted;
                },
                selectedCategories: function () {
                    return selectedCategories;
                }
            }
        }).result;
        return modalInstance;
    };
    this.eventCreationActions = { add: 'ADD',  schedule: 'SCHEDULE', referral: 'REFERRAL'};
})

.service('MessagingService', function($http, $translate,  NotificationService, DHIS2URL){
    return {
        sendMessage: function(message){
            var promise = $http.post( DHIS2URL + '/messages' , message).then(function(response){
                var headerText, bodyText;
                if (response && response.data && response.data.summaries) {
                    var summary = response.data.summaries[0];
                    if (summary.status) {
                        headerText = summary.status;
                        if (summary.responseMessage) {
                            bodyText = summary.responseMessage;
                        } else if (summary.errorMessage) {
                            bodyText = summary.errorMessage;
                        }else {
                            bodyText = $translate.instant("failed_to_send_message");
                        }
                        NotificationService.showNotifcationDialog(headerText, bodyText);
                    }
                }
                return response.data;
            }, function(response){
                var headerText = $translate.instant('error');
                var bodyText = $translate.instant('failed_to_send_message');
                if (response && response.summaries && response.summaries[0].errorMessage) {
                    bodyText = response.summaries[0].errorMessage;
                }
                NotificationService.showNotifcationDialog(headerText, bodyText);
                return null;
            });
            return promise;
        }
    };
})
.service('ProgramWorkingListService', function($http,$q,$filter, orderByFilter,orderByKeyFilter, TEIService){
    var workingListsByProgram = null;
    var cachedMultipleEventFiltersData = {};
    var getDefaultWorkingLists = function(program){
        //Temporary until working list is implemented
        var defaultWorkingLists = [
            {
                name: "active_enrollment",
                description: "active_enrollment",
                program: {id: program.id},
                enrollmentStatus: "ACTIVE",
                style: {icon: "fa fa-circle-o"},
                sortOrder: 1
            },
            {
                name: "all_enrollments",
                description: "all_enrollment",
                program: {id: program.id},
                style: {icon: "fa fa-list"},
                sortOrder: 0
            },
            {
                name: "completed_enrollment",
                description: "completed_enrollment",
                program: {id: program.id},
                style: {icon: "fa fa-check"},
                enrollmentStatus: "COMPLETED",
                sortOrder: 2
            },
            {
                name: "cancelled_enrollment",
                description: "cancelled_enrollment",
                program: {id: program.id},
                style: {icon: "fa fa-times" },
                enrollmentStatus: "CANCELLED",
                sortOrder: 3
            }
        ];
        return defaultWorkingLists;
    }
    var getPeriodDate = function(days){
        return moment().add(days,'days').format('YYYY-MM-DD');
    }
    var getEventUrl = function(eventFilter){
        var eventUrl = "";
        if(eventFilter)
        {
            if(eventFilter.eventStatus) eventUrl = "eventStatus="+eventFilter.eventStatus;
            if(eventFilter.eventCreatedPeriod){
                if(eventUrl) eventUrl+= "&";
                eventUrl+="eventStartDate="+getPeriodDate(eventFilter.eventCreatedPeriod.periodFrom);
                eventUrl+="&eventEndDate="+getPeriodDate(eventFilter.eventCreatedPeriod.periodTo);
            }
            if(eventFilter.programStage){
                if(eventUrl) eventUrl+="&";
                eventUrl+="programStage="+eventFilter.programStage;
            }
            if(eventFilter.assignedUserMode){
                if(eventUrl) eventUrl+="&";
                eventUrl += "assignedUserMode="+eventFilter.assignedUserMode;
            }
            if(!eventFilter.assignedUserMode || eventFilter.assignedUserMode == "PROVIDED" 
            && eventFilter.assignedUsers && eventFilter.assignedUsers.length > 0){
                if(eventUrl) eventUrl+="&";
                eventUrl += "assignedUser=";
                for(var i = 0; i < eventFilter.assignedUsers.length; i++){
                    if(i > 0) eventUrl += ";";
                    eventUrl += eventFilter.assignedUsers[i];
                }
            }
        }
        return eventUrl;
    }
    var getCachedMultipleEventFiltersData = function(workingList, pager, sortColumn){
        var cachedData = cachedMultipleEventFiltersData[workingList.name];
        if(!pager) pager = { page: 1, pageSize: 50, pageCount: Math.ceil(cachedData.rows.length/50)};
        var pageEnd = (pager.pageSize*pager.page);
        var pageStart = pageEnd - pager.pageSize;

        var pageRows = cachedData.rows.slice(pageStart, pageEnd);
        var data = {
            rows: pageRows, 
            height: pageRows.length,
            width: cachedData.width,
            headers: cachedData.headers,
            metaData: {pager: pager}
        }
        return data;
    }
    var getWorkingListDataWithMultipleEventFilters = function(searchParams, workingList, pager, sortColumn){
        var def = $q.defer();
        if(workingList.cachedSorting === searchParams.sortUrl && workingList.cachedOrgUnit === searchParams.orgUnitId){
            var data = getCachedMultipleEventFiltersData(workingList,pager);
            def.resolve(data);
        }else{
            var promises = [];
            angular.forEach(workingList.eventFilters, function(eventFilter){
                var eventUrl = getEventUrl(eventFilter);
                var tempPager = {
                    pageSize:1000,
                    page: 1
                }
                promises.push(TEIService.search(searchParams.orgUnitId, "SELECTED", searchParams.sortUrl, searchParams.programUrl, eventUrl,tempPager, true));
            });
            $q.all(promises).then(function(response){
                var data = { height: 0, width: 0, rows: []};
                var existingTeis = {};
                var allRows = [];
                angular.forEach(response, function(responseData){
                    data.headers = data.headers && data.headers.length > responseData.headers.length ? data.headers : responseData.headers;
                    data.width  = data.width > responseData.width ? data.width : responseData.width;
                    allRows = allRows.concat(responseData.rows);
                });
                //Getting distinct list
                var existing = {};
                data.rows = allRows.filter(function(d){
                    if(existing[d[0]])return false;
                    existing[d[0]] = true;
                    return true;
                });
                var sortColumnIndex = data.headers.findIndex(function(h){ return h.name === sortColumn.id});
                if(sortColumnIndex) data.rows = orderByKeyFilter(data.rows, sortColumnIndex, sortColumn.direction);
                //order list
                cachedMultipleEventFiltersData[workingList.name] = data;
                workingList.cachedSorting = searchParams.sortUrl;
                workingList.cachedOrgUnit = searchParams.orgUnitId;
                var data = getCachedMultipleEventFiltersData(workingList, pager, sortColumn);
                def.resolve(data);
            });
        }
        return def.promise;
    }

    this.getWorkingListsForProgram = function(program){
        if(!program){
            return $q.when([]);
        }

        var fetchPromise = workingListsByProgram ? $q.when() :
            $http.get(DHIS2URL+"/trackedEntityInstanceFilters?fields=*&paging=false").then(function(response){
                workingListsByProgram = {};
                if(response && response.data && response.data.trackedEntityInstanceFilters && response.data.trackedEntityInstanceFilters.length > 0){
                    angular.forEach(response.data.trackedEntityInstanceFilters, function(workingList){
                        if(!workingListsByProgram[workingList.program.id]) workingListsByProgram[workingList.program.id] = [];
                        workingListsByProgram[workingList.program.id].push(workingList);
                    });

                    for(var key in workingListsByProgram){
                        if(angular.isArray(workingListsByProgram[key])){
                            workingListsByProgram[key] = orderByKeyFilter(workingListsByProgram[key], 'sortOrder', 'asc');
                        }
                    }
                }  
            });
        
        return fetchPromise
            .then(() => {
                var workingLists = workingListsByProgram[program.id];
                if(!workingLists){
                    workingLists = orderByKeyFilter(getDefaultWorkingLists(program), 'sortOrder', 'asc');
                    workingListsByProgram[program.id] = workingLists;
                }
                return workingLists;
            });
    }

    this.getWorkingListData = function(orgUnit, workingList, pager, sortColumn){
        var searchParams = {
            orgUnitId: orgUnit.id,
            programUrl: "program="+workingList.program.id,
            eventUrl: null
        }
        if(workingList.enrollmentStatus){
            searchParams.programUrl += "&programStatus="+workingList.enrollmentStatus;
        }
        if(workingList.followup){
            searchParams.programUrl += "&followUp=true"
        }
        if(sortColumn){
            searchParams.sortUrl = "&order="+sortColumn.id+':'+sortColumn.direction;
        }
        if(workingList.enrollmentCreatedPeriod){
            var enrollmentStartDate = moment().add(workingList.enrollmentCreatedPeriod.periodFrom, 'days').format("YYYY-MM-DD");
            var enrollmentEndDate = moment().add(workingList.enrollmentCreatedPeriod.periodTo, 'days').format("YYYY-MM-DD");
            searchParams.programUrl += "&programStartDate="+enrollmentStartDate+"&programEndDate="+enrollmentEndDate;
        }
        if(workingList.eventFilters){
            if(workingList.eventFilters.length > 1){
                return getWorkingListDataWithMultipleEventFilters(searchParams, workingList, pager, sortColumn);
            }
            searchParams.eventUrl = getEventUrl(workingList.eventFilters[0]);
        }
        return TEIService.search(searchParams.orgUnitId, "SELECTED", searchParams.sortUrl, searchParams.programUrl, searchParams.eventUrl, pager, true);
    }
    this.setTrackedEntityList = function(trackedEntityList){
        this.trackedEntityList = trackedEntityList;
    }
})
.service("SearchGroupService", function(TEIService, $q, OperatorFactory, AttributesFactory, DateUtils){
    var programSearchConfigsById = {};
    var trackedEntityTypeSearchConfigsById = {};
    var defaultOperators = OperatorFactory.defaultOperators;
    var textOperators = OperatorFactory.textOperators;
    var searchScopes = { PROGRAM: "PROGRAM", TET: "TET"};

    this.getSearchScopes = function(){ return searchScopes;}
    var makeSearchConfig = function(dimensionAttributes, minAttributesRequiredToSearch,orgUnitUniqueAsSearchGroup){
        var searchConfig = { searchGroups: [], searchGroupsByAttributeId: {}};
        if(dimensionAttributes){
            var defaultSearchGroup = { id: dhis2.util.uid(), attributes: [], ouMode: {name: 'ACCESSIBLE'}, orgunitUnique: false};
            var attributes = AttributesFactory.generateAttributeFilters(angular.copy(dimensionAttributes));
            angular.forEach(attributes, function(attr){
                if(attr.searchable || (attr.unique && !attr.orgunitScope)){
                    searchConfig.searchGroupsByAttributeId[attr.id] = {};
                    if(attr.unique){
                        var uniqueAttr = attr.orgunitScope ? angular.copy(attr) : attr;
                        uniqueAttr.operator = ["DATETIME", "NUMBER", "DATE"].includes(uniqueAttr.valueType) ? defaultOperators[0] : textOperators[0];
                        var uniqueSearchGroup = {
                            id: dhis2.util.uid(),
                            uniqueGroup: true,
                            orgunitUnique: uniqueAttr.orgunitScope,
                            attributes: [uniqueAttr],
                            ouMode: {name: 'ACCESSIBLE'},
                            minAttributesRequiredToSearch: 1
                        }
                        if(uniqueAttr.orgunitScope) uniqueSearchGroup.ouMode = {name: 'SELECTED'};
                        searchConfig.searchGroups.push(uniqueSearchGroup);
                        searchConfig.searchGroupsByAttributeId[uniqueAttr.id].unique = uniqueSearchGroup;
                    }
                    if(!attr.unique || attr.orgunitScope){
                        if(attr.optionSetValue && attr.valueType === "TEXT") attr.operator = textOperators[0];
                        defaultSearchGroup.attributes.push(attr);
                        searchConfig.searchGroupsByAttributeId[attr.id].default = defaultSearchGroup;
                    }

                }
            });
            if(defaultSearchGroup.attributes.length !== 0){
                defaultSearchGroup.minAttributesRequiredToSearch = minAttributesRequiredToSearch;
                searchConfig.searchGroups.push(defaultSearchGroup);
            }
        }
        return searchConfig;
    }

    var getSearchParams = function(searchGroup, program, trackedEntityType, orgUnit, pager, searchScope, onGetFieldArgs){
        var uniqueSearch = false;
        var numberOfSetAttributes = 0;
        var filteredAttributes = {};
        var query = {url: null, hasValue: false};
        if(searchGroup){
            angular.forEach(searchGroup.attributes, function(attr){
                if(searchGroup.uniqueGroup) uniqueSearch = true;
                if(attr.valueType === 'DATE' || attr.valueType === 'AGE' || attr.valueType === 'NUMBER' || attr.valueType === 'DATETIME'){
                    var q = '';
    
                    if(attr.operator === OperatorFactory.defaultOperators[0]){
                        var exactValue = searchGroup[attr.id] ? searchGroup[attr.id].exactValue : null;
                        if(exactValue == null) exactValue = searchGroup[attr.id];


                        if(exactValue && exactValue !== ''){
                            query.hasValue = true;
                            if(attr.valueType === 'DATE' || attr.valueType === 'AGE' || attr.valueType === 'DATETIME'){
                                exactValue = DateUtils.formatFromUserToApi(exactValue);
                            }
                            if(attr.valueType === 'DATETIME') {
                                q += 'LIKE:' + exactValue + ':';
                            } else {
                                q += 'EQ:' + exactValue + ':';
                            }
                        }
                    }
                    if(attr.operator === OperatorFactory.defaultOperators[1]){
                        var startValue =  searchGroup[attr.id] ? searchGroup[attr.id].startValue : null;
                        var endValue = searchGroup[attr.id] ? searchGroup[attr.id].endValue : null;
                        if(startValue && startValue !== ''){
                            query.hasValue = true;
                            if(attr.valueType === 'DATE' || attr.valueType === 'AGE' || attr.valueType === 'DATETIME'){
                                startValue = DateUtils.formatFromUserToApi(startValue);
                            }
                            q += 'GT:' + startValue + ':';
                        }
                        if(endValue && endValue !== ''){
                            query.hasValue = true;
                            if(attr.valueType === 'DATE' || attr.valueType === 'AGE' || attr.valueType === 'DATETIME'){
                                endValue = DateUtils.formatFromUserToApi(endValue);
                            }
                            q += 'LT:' + endValue + ':';
                        }
                    }
                    if(query.url){
                        if(q){
                            numberOfSetAttributes++;
                            filteredAttributes[attr.id] = true;
                            q = q.substr(0,q.length-1);
                            query.url = query.url + '&attribute=' + attr.id + ':' + q;
                        }
                    }
                    else{
                        if(q){
                            numberOfSetAttributes++;
                            filteredAttributes[attr.id] = true;
                            q = q.substr(0,q.length-1);
                            query.url = 'attribute=' + attr.id + ':' + q;
                        }
                    }
                }
                else{
                    var value = searchGroup[attr.id] ? searchGroup[attr.id].value : null;
                    if(value == null) value = searchGroup[attr.id];
                    if(value && value !== ''){
                        query.hasValue = true;
    
                        if(angular.isArray(value)){
                            var q = '';
                            angular.forEach(value, function(val){
                                q += val + ';';
                            });
    
                            q = q.substr(0,q.length-1);
    
                            if(query.url){
                                if(q){
                                    numberOfSetAttributes++;
                                    filteredAttributes[attr.id] = true;
                                    query.url = query.url + '&attribute=' + attr.id + ':IN:' + q;
                                }
                            }
                            else{
                                if(q){
                                    numberOfSetAttributes++;
                                    filteredAttributes[attr.id] = true;
                                    query.url = 'attribute=' + attr.id + ':IN:' + q;
                                }
                            }
                        }
                        else{
                            if(query.url){
                                numberOfSetAttributes++;
                                filteredAttributes[attr.id] = true;
                                if(attr.operator === textOperators[0]){
                                    query.url = query.url + '&attribute=' + attr.id + ':EQ:' + value;
                                }else{
                                    query.url = query.url + '&attribute=' + attr.id + ':LIKE:' + value;
                                }
                                
                            }
                            else{
                                numberOfSetAttributes++;
                                filteredAttributes[attr.id] = true;
                                if(attr.operator === textOperators[0]){
                                    query.url = 'attribute=' + attr.id + ':EQ:' + value;
                                }else{
                                    query.url = 'attribute=' + attr.id + ':LIKE:' + value;
                                }
                                
                            }
                        }
                    }
                }
            });
        }
        if(query.hasValue &&(uniqueSearch || numberOfSetAttributes >= searchGroup.minAttributesRequiredToSearch)){
            if (onGetFieldArgs) {
                var fieldsArgs = onGetFieldArgs(filteredAttributes);
                query.url += fieldsArgs;
            }
            var programOrTETUrl = searchScope === searchScopes.PROGRAM ? "program="+program.id :"trackedEntityType="+trackedEntityType.id;

            var searchOrgUnit = searchGroup.orgUnit ? searchGroup.orgUnit : orgUnit;
            return { orgUnit: searchOrgUnit, ouMode: searchGroup.ouMode.name, programOrTETUrl: programOrTETUrl, queryUrl: query.url, pager: pager, paging: !uniqueSearch, uniqueSearch: uniqueSearch };
        }
    }
    
    this.getSearchConfigForProgram = function(program, orgUnitUniqueAsSearchGroup) {
        var def = $q.defer();
        if(!programSearchConfigsById[program.id]){
            return AttributesFactory.getByProgram(program).then(function(attributes)
            {
                var searchConfig = makeSearchConfig(attributes, program.minAttributesRequiredToSearch,orgUnitUniqueAsSearchGroup);
                programSearchConfigsById[program.id] = searchConfig;
                def.resolve(angular.copy(searchConfig));
                return def.promise;
            });
        }
        def.resolve(angular.copy(programSearchConfigsById[program.id]));
        return def.promise;
    }
    this.getSearchConfigForTrackedEntityType = function(trackedEntityType,orgUnitUniqueAsSearchGroup){
        var def = $q.defer();
        if(!trackedEntityTypeSearchConfigsById[trackedEntityType.id]){
            return AttributesFactory.getByTrackedEntityType(trackedEntityType).then(function(attributes)
            {
                var searchConfig = makeSearchConfig(attributes, trackedEntityType.minAttributesRequiredToSearch,orgUnitUniqueAsSearchGroup);
                trackedEntityTypeSearchConfigsById[trackedEntityType.id] = searchConfig;
                def.resolve(angular.copy(searchConfig));
                return def.promise;
            });
        }
        def.resolve(angular.copy(trackedEntityTypeSearchConfigsById[trackedEntityType.id]));
        return def.promise;
    }

    this.programScopeSearchCount = function(searchGroup,tetSearchGroup, program, trackedEntityType, orgUnit){
        var params = getSearchParams(searchGroup, program, trackedEntityType, orgUnit, null, searchScopes.PROGRAM);
        if(params){
            return TEIService.searchCount(params.orgUnit.id, params.ouMode,null, params.programOrTETUrl, params.queryUrl, null, false).then(function(response){
                if(response || response === 0){
                    return response;
                }else{
                    return tetScopeSearchCount(tetSearchGroup, trackedEntityType, orgUnit);
                }
                return 0;
            },function(error){
                return 0;
            });
        }else{
            var def = $q.defer();
            def.resolve(0);
            return def.promise;
        }
    }
    var tetScopeSearchCount = this.tetScopeSearchCount = function(tetSearchGroup, trackedEntityType, orgUnit){
        var params = getSearchParams(tetSearchGroup, null, trackedEntityType, orgUnit, null, searchScopes.TET);
        if(params){
            return TEIService.searchCount(params.orgUnit.id, params.ouMode,null, params.programOrTETUrl, params.queryUrl, null, false).then(function(response){
                if(response){
                    return response;
                }
                return 0;
            },function(error){
                return 0;
            });
        }else{
            var def = $q.defer();
            def.resolve(0);
            return def.promise;
        }
    }

    this.findTetSearchGroup = function(programSearchGroup, tetSearchConfig){
        var uniqueGroup = programSearchGroup.uniqueGroup;
        if (uniqueGroup) {
            var attributeId =
                programSearchGroup.attributes &&
                programSearchGroup.attributes.length > 0 &&
                programSearchGroup.attributes[0].id;

            if (!attributeId){
                return null;
            }

            return tetSearchConfig
                .searchGroups
                .find(group =>
                    group.uniqueGroup &&
                    group.attributes &&
                    group.attributes.length > 0 &&
                    group.attributes[0].id === attributeId);
        }

        return tetSearchConfig
            .searchGroups
            .find(group => !group.uniqueGroup);
    }

    this.findValidTetSearchGroup = function(programSeachGroup,tetSearchConfig, attributesById){
        for(var sg = 0; sg < tetSearchConfig.searchGroups.length; sg++){
            var searchGroup = tetSearchConfig.searchGroups[sg];
            for(var a=0; a < tetSearchConfig.searchGroups[sg].attributes.length; a++){
                var attr = tetSearchConfig.searchGroups[sg].attributes[a];
                var value = programSeachGroup[attr.id];
                if(value){
                    searchGroup[attr.id] = value;
                }
            }
            if(this.isValidSearchGroup(searchGroup, attributesById)){
                return searchGroup;
            }
        }
    }

    this.isValidSearchGroup = function(searchGroup, attributesById){
        var nrOfSetAttributes = 0;
        for(var key in searchGroup){
            var attr = attributesById[key];
            if(attr){
                if(attr.valueType === "TEXT" && searchGroup[key] && searchGroup[key].value !== "") nrOfSetAttributes++;
                else if(attr.valueType !== "TEXT" && attr.valueType === "TRUE_ONLY") nrOfSetAttributes++;
                else if(attr.valueType !== "TEXT" && attr.valueType !== "TRUE_ONLY" && searchGroup[key]) nrOfSetAttributes++;
            }
        }
        if(searchGroup.minAttributesRequiredToSearch > nrOfSetAttributes){
            return false;
        }
        return true;
    }

    this.programScopeSearch = function(programSearchGroup, tetSearchGroup, program, trackedEntityType, orgUnit, pager, sortColumn, onEditHeadersFromReponse){
        var params = getSearchParams(programSearchGroup, program, trackedEntityType, orgUnit, pager, searchScopes.PROGRAM);
        
        if(params){
            var programScopeFetchAsyncFn = (pager, sortColumn) => {
                var order = sortColumn && "order=" + sortColumn.id + ":" + sortColumn.direction;
                return TEIService
                    .search(params.orgUnit.id, params.ouMode, order, params.programOrTETUrl, params.queryUrl, pager, params.paging);
            };

            return programScopeFetchAsyncFn(params.pager, sortColumn).then(function(response){
                    if(response && response.rows && response.rows.length > 0){
                        if (onEditHeadersFromReponse) {
                            response.headers = onEditHeadersFromReponse(response.headers, program.programTrackedEntityAttributes);
                        }
                        var result = { data: response, callingScope: searchScopes.PROGRAM, resultScope: searchScopes.PROGRAM, onRefetch: programScopeFetchAsyncFn };

                        var def = $q.defer();
                        if(params.uniqueSearch){
                            result.status = "UNIQUE";
                        }else{
                            result.status = "MATCHES";
                        }
                        def.resolve(result);
                        return def.promise;
                    }else{
                        if(tetSearchGroup){
                            return tetScopeSearch(tetSearchGroup, trackedEntityType, orgUnit, pager, undefined, onEditHeadersFromReponse)
                                .then(function(result){
                                    result.callingScope = searchScopes.PROGRAM;
                                    return result;
                                },function(){
                                    return {status: "NOMATCH"};
                                });
                        }else{
                            var def = $q.defer();
                            def.resolve({status: "NOMATCH"});
                            return def.promise;
                        }

                    }
                },function(error){
                    var d = $q.defer();
                    if(error && error.data && error.data.message === "maxteicountreached"){
                        d.resolve({ status: "TOOMANYMATCHES", data: null});
                    } 
                    else {
                        d.reject(error);
                    }
                    return d.promise;
                });
        } else {
            var def = $q.defer();
            def.resolve({status: "NOMATCH"});
            return def.promise;
        }
    }
    var tetScopeSearch = this.tetScopeSearch = function(tetSearchGroup,trackedEntityType, orgUnit, pager, sortColumn, onEditHeadersFromReponse){
        var params = getSearchParams(tetSearchGroup, null, trackedEntityType, orgUnit, pager, searchScopes.TET);
        if(params){
            var tetScopeFetchAsyncFn = (pager, sortColumn) => {
                var order = sortColumn && "order=" + sortColumn.id + ":" + sortColumn.direction;
                return TEIService.search(params.orgUnit.id, params.ouMode, order, params.programOrTETUrl, params.queryUrl, pager, params.paging);
            }
            
            return tetScopeFetchAsyncFn(params.pager, sortColumn).then(function(response){
                if (onEditHeadersFromReponse) {
                    response.headers = onEditHeadersFromReponse(response.headers, trackedEntityType.trackedEntityTypeAttributes);
                }
                var result = {data: response, callingScope: searchScopes.TET, resultScope: searchScopes.TET, onRefetch: tetScopeFetchAsyncFn };
                if(response && response.rows && response.rows.length > 0){
                    if(params.uniqueSearch){
                        result.status = "UNIQUE";
                    }else{
                        result.status = "MATCHES";
                    }
                }else{
                    result.status = "NOMATCH";
                }
                return result;
            },function(error){
                var d = $q.defer();
                if(error && error.data && error.data.message === "maxteicountreached"){
                    d.resolve({ status: "TOOMANYMATCHES", data: null});
                } 
                else {
                    d.reject(error);
                }
                return d.promise;
            });
        }else{
            var def = $q.defer();
            def.resolve({status: "NOMATCH"});
            return def.promise;
        }
    }
})
.factory('RuleBoundFactory', function()
{
    var initData = function(){
        return {
            textInEffect: false,
            keyDataInEffect: false,
            displayTextEffects: {},
            displayKeyDataEffects: {}
        }
    }

    return {
        getDisplayEffects: function(ruleBoundData, event, ruleeffects, location){
            if(!ruleBoundData) ruleBoundData = initData();

            ruleBoundData.textInEffect = false;
            ruleBoundData.keyDataInEffect = false;

            if(!event || event === 'registration') return;
    
            //In case the 
            if(ruleBoundData.lastEventUpdated !== event) {
                ruleBoundData.displayTextEffects = {};
                ruleBoundData.displayKeyDataEffects = {};
                ruleBoundData.lastEventUpdated = event;
            }
            
            if(ruleeffects && ruleeffects[event]){
                angular.forEach(ruleeffects[event], function(effect) {
                    var g= 1;
                    var u = g+1;
                    if(effect.location === location){
                        //This effect is affecting the local widget
                        
                        //Round data to two decimals if it is a number:
                        if(dhis2.validation.isNumber(effect.data)){
                            effect.data = Math.round(effect.data*100)/100;
                        }
                        
                        if(effect.action === "DISPLAYTEXT") {
                            //this action is display text. Make sure the displaytext is
                            //added to the local list of displayed texts
                            if(!angular.isObject(ruleBoundData.displayTextEffects[effect.id])){
                                ruleBoundData.displayTextEffects[effect.id] = effect;
                            }
                            if(effect.ineffect)
                            {
                                ruleBoundData.textInEffect = true;
                            }
                        }
                        else if(effect.action === "DISPLAYKEYVALUEPAIR") {                    
                            //this action is display text. Make sure the displaytext is
                            //added to the local list of displayed texts
                            if(!angular.isObject(ruleBoundData.displayTextEffects[effect.id])){
                                ruleBoundData.displayKeyDataEffects[effect.id] = effect;
                            }
                            if(effect.ineffect)
                            {
                                ruleBoundData.keyDataInEffect = true;
                            }
                        }
                        else if(effect.action === "ASSIGN") {
                            //the dataentry control saves the variable and or dataelement
                        }
                    }
                });
            }

            return ruleBoundData;
        }
    }
})
.service('AccessUtils', function($q, TCStorageService){

    this.anyWritable = function(accessKeyValuePair){
        if(accessKeyValuePair){
            for(var accessKey in accessKeyValuePair){
                var access = accessKeyValuePair[accessKey];
                if(access && access.data && access.data.write) return true;
            }
        }
        return false;
    }
    this.isReadable = function(obj){
        if(obj && obj.access && obj.access.data && obj.access.data.read){
            return true;
        }
        return false;
    }
    this.isWritable = function(obj){
        if(obj.access && obj.access.data && obj.access.data.write){
            return true;
        }
        return false;
    }

    this.toWritable = function(arr){
        var service = this;
        if(!arr) return arr;
        var writable = [];
        angular.forEach(arr, function(obj){
            if(service.isWritable(obj)){
                writable.push(obj);
            }
        });
        return writable;
    }
})
.service('TCOrgUnitService', function($q, $rootScope, TCStorageService, OrgUnitFactory){
    this.get = function(uid) {
        var def = $q.defer();
        TCStorageService.currentStore.open().done(function(){
            TCStorageService.currentStore.get('organisationUnits', uid).done(function(orgUnit){
                $rootScope.$apply(function(){
                    def.resolve(orgUnit);
                });
            });
        });
        return def.promise;
    };

    this.getSearchOrgUnitTree = function(){
        return OrgUnitFactory.getSearchTreeRoot().then(function(res){
            var allSearchOrgUnits = res.organisationUnits;
            var filtered = allSearchOrgUnits.filter(function(orgUnit){
                return !isPathInOrgUnitList(orgUnit.path, allSearchOrgUnits);
            });
            return filtered;
        });
    }
    var getOrgUnitIdsFromPath = this.getOrgUnitIdsFromPath = function(orgUnitPath) {
        var formattedPath = orgUnitPath.replace(/^\/|\/$/g, '');
        return formattedPath.split('/');
    }
    var isPathInOrgUnitList = this.isPathInOrgUnitList = function(path, orgUnits){
        var idsFromPath = getOrgUnitIdsFromPath(path);
        var lastId = idsFromPath[idsFromPath.length-1];
        return idsFromPath.some(function(idFromPath){
            return orgUnits.some(function(orgUnit){
                return orgUnit.id === idFromPath && orgUnit.id !== lastId;
            });
        });
    }
});


