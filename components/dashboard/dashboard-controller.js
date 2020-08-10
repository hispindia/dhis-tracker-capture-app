/* global trackerCapture, angular */

//Controller for dashboard
var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('DashboardController',
    function ($rootScope,
            $scope,
            $location,
            $modal,
            $timeout,
            $filter,
            $translate,
            $q,
            $route,
            $templateCache,
            TCStorageService,
            orderByFilter,
            SessionStorageService,
            TEIService,
            TEService,
            MetaDataFactory,
            EnrollmentService,
            ProgramFactory,
            DHIS2EventFactory,
            DashboardLayoutService,
            AttributesFactory,
            CurrentSelection,
            ModalService,
            AuthorityService,
            OrgUnitFactory,
            NotificationService,
            TeiAccessApiService) {


    var preAuditCancelled = function(){
        var modalOptions = {
            closeButtonText: "Cancel",
            actionButtonText: 'OK',
            headerText: 'Cancel audit',
            bodyText: 'Cancelling audit will redirect you back to home. Any changes that are not saved will be lost'
        };
        return ModalService.showModal({},modalOptions);

    }
    TeiAccessApiService.setAuditCancelledSettings({
        preAuditCancelled: preAuditCancelled,
        postAuditCancelled: function(){
            window.location.hash = '#/';
            window.location.reload();
        }
    });

    $scope.duplicateExists = false;
    $rootScope.hasAccess = false;
    $scope.APIURL = DHIS2URL;
    //selections
    var orgUnitUrl = ($location.search()).ou;
    var fromAudit = ($location.search()).fromAudit;
    $scope.topBarConfig = {};
    $scope.displayEnrollment = false;
    $scope.dataEntryMainMenuItemSelected = false;    
    $scope.metaDataCached = false;
    $scope.model = {orgUnitClosed: false};
    if ( !dhis2.tc.metaDataCached){
        downloadMetaData().then(function () {
            updateDashboard();
        });
    }
    else {
        updateDashboard();
    }

    function getOrgUnit() {
        var def = $q.defer();
        var selection = CurrentSelection.get();
        if(selection.orgUnit && selection.orgUnit.id === orgUnitUrl) {
            def.resolve(selection.orgUnit);
        } else {
            OrgUnitFactory.getFromStoreOrServer(orgUnitUrl).then(function(ou){
                def.resolve(ou);
            });
        }
        return def.promise;
    }

    var loadTrackedEntityType = function(){
        return TEService.get($scope.selectedTei.trackedEntityType).then(function (te) {
            $scope.trackedEntityType = te;
        });
    }

    function updateDashboard() {
        
        $scope.metaDataCached = true;

        getOrgUnit().then(function (orgUnit) {
            if (!orgUnit) {
                return;
            }

            $scope.selectedTeiId = ($location.search()).tei;
            $scope.selectedProgramId = $scope.selectedProgram ? $scope.selectedProgram.id : ($location.search()).program;
            $scope.selectedOrgUnit = orgUnit;
            $scope.userAuthority = AuthorityService.getUserAuthorities(SessionStorageService.get('USER_PROFILE'));
            $scope.sortedTeiIds = CurrentSelection.getSortedTeiIds();
            $scope.showSettingsButton = true;
            $scope.topbarClass = $scope.showSettingsButton ? "dashboard-info-box-sm" : "dashboard-info-box-lg";
            $scope.topbarRightSizeClass = $scope.showSettingsButton ? "dashboard-info-btn-right-two-buttons" : "dashboard-info-btn-right-one-button";

            //Labels
            $scope.removeLabel = $translate.instant('remove');
            $scope.expandLabel = $translate.instant('expand');
            $scope.collapseLabel = $translate.instant('collapse');
            $scope.noDataReportLabel = $translate.instant('no_data_report');
            $scope.noRelationshipLabel = $translate.instant('no_relationship');
            $scope.settingsLabel = $translate.instant('settings');
            $scope.showHideWidgetsLabel = $translate.instant('show_hide_widgets');
            $scope.notEnrolledLabel = $translate.instant('not_yet_enrolled_data_entry');
            $scope.stickLabel = $translate.instant('stick_right_widgets');
            $scope.unstickLabel = $translate.instant('unstick_right_widgets');

            $scope.model.stickyDisabled = true;
            $scope.previousTeiExists = false;
            $scope.nextTeiExists = false;

            $scope.temporaryHideWidgets = [];
            $scope.temporaryShowWidgets = [];

            if ($scope.sortedTeiIds && $scope.sortedTeiIds.length > 0) {
                var current = $scope.sortedTeiIds.indexOf($scope.selectedTeiId);

                if (current !== -1) {
                    if ($scope.sortedTeiIds.length - 1 > current) {
                        $scope.nextTeiExists = true;
                    }

                    if (current > 0) {
                        $scope.previousTeiExists = true;
                    }
                }
            }

            //get ouLevels
            TCStorageService.currentStore.open().done(function () {
                TCStorageService.currentStore.getAll('ouLevels').done(function (response) {
                    var ouLevels = angular.isObject(response) ? orderByFilter(response, '-level').reverse() : [];
                    CurrentSelection.setOuLevels(orderByFilter(ouLevels, '-level').reverse());
                });
            });

            if ($scope.selectedTeiId) {

                TEIService.getPotentialDuplicatesForTei($scope.selectedTeiId).then(function(duplicates){
                    $scope.potentialDuplicates = duplicates.identifiableObjects;
                    $scope.duplicateExists = $scope.potentialDuplicates.length > 0 ? true : false;
                });
                
                //get option sets
                $scope.optionSets = [];
                MetaDataFactory.getAll('optionGroups').then(function(optionGroups){
                    var optionGroupsById = optionGroups.toHashMap('id', function(map,obj,key) { obj.optionsById = obj.options.toHashMap('id'); });
                    CurrentSelection.setOptionGroupsById(optionGroupsById);

                    MetaDataFactory.getAll('optionSets').then(function (optionSets) {
                        angular.forEach(optionSets, function (optionSet) {
                            $scope.optionSets[optionSet.id] = optionSet;
                        });
    
                        AttributesFactory.getAll().then(function (atts) {
    
                            $scope.attributesById = [];
                            angular.forEach(atts, function (att) {
                                $scope.attributesById[att.id] = att;
                            });
    
                            CurrentSelection.setAttributesById($scope.attributesById);
                            var teiPromise;

                            if($scope.selectedProgramId){
                                teiPromise = TEIService.getWithProgramData($scope.selectedTeiId, $scope.selectedProgramId, $scope.optionSets, $scope.attributesById, fromAudit);
                            }else{
                                teiPromise = TEIService.get($scope.selectedTeiId,$scope.optionSets, $scope.attributesById);
                            }
                            //Fetch the selected entity
                            teiPromise.then(function (response) {
                                $rootScope.hasAccess = true;
                                if (response) {
                                    $scope.selectedTei = response;

                                    //get the entity type
                                    loadTrackedEntityType().then(function () {
                                        var enrollments = ($scope.selectedTei && $scope.selectedTei.enrollments) || [];
                                        $scope.allEnrollments = angular.copy(enrollments);
                                        var selectedEnrollment = null;
                                        if(enrollments){
                                            selectedEnrollment = enrollments.find(function(e){ return e.program === $scope.selectedProgramId && e.status === 'ACTIVE'; });
                                        }

                                        ProgramFactory.getProgramsByOu($scope.selectedOrgUnit, false).then(function (response) {
                                            $scope.programs = [];
                                            $scope.programNames = [];
                                            $scope.programStageNames = [];

                                            //get programs valid for the selected ou and tei
                                            angular.forEach(response.programs, function (program) {
                                                if (program.trackedEntityType && program.trackedEntityType.id === $scope.selectedTei.trackedEntityType) {
                                                    $scope.programs.push(program);
                                                    $scope.programNames[program.id] = {
                                                        id: program.id,
                                                        displayName: program.displayName
                                                    };
                                                    angular.forEach(program.programStages, function (stage) {
                                                        $scope.programStageNames[stage.id] = {
                                                            id: stage.id,
                                                            displayName: stage.displayName
                                                        };
                                                    });

                                                    if ($scope.selectedProgramId && program.id === $scope.selectedProgramId) {
                                                        $scope.selectedProgram = program;
                                                    }
                                                }
                                            });

                                            var events = enrollments.reduce(function(previousEvents,e) {
                                                var events = previousEvents.concat(e.events);
                                                return events;
                                            },[]);

                                            //var events = (selectedEnrollment && selectedEnrollment.events) || [];
                                            //prepare selected items for broadcast
                                            CurrentSelection.setSelectedTeiEvents(events);
                                            CurrentSelection.set({
                                                tei: $scope.selectedTei,
                                                te: $scope.trackedEntityType,
                                                prs: $scope.programs,
                                                pr: $scope.selectedProgram,
                                                prNames: $scope.programNames,
                                                prStNames: $scope.programStageNames,
                                                enrollments: enrollments,
                                                selectedEnrollment: selectedEnrollment,
                                                optionSets: $scope.optionSets,
                                                orgUnit: $scope.selectedOrgUnit
                                            });
                                            getDashboardLayout();
                                        });
                                    });
                                }
                            }, function(error){
                                if(error && error.auditDismissed){
                                    $rootScope.hasAccess = false;
                                }
                            });
                        });
                    });
                });
            }            
        });
    }
    
    //dashboard items
    var getDashboardLayout = function () {
        $scope.topBarConfig.settings = {};
        $rootScope.defaultDashboardWidgetsByTitle = {};
        $rootScope.dashboardWidgets = [];
        $scope.widgetsChanged = [];
        $scope.dashboardStatus = [];
        $scope.dashboardWidgetsOrder = {biggerWidgets: [], smallerWidgets: []};
        $scope.orderChanged = false;
        
        DashboardLayoutService.getLockedList().then(function(r){
            if(!r || r === '') {
                $scope.lockedList = {};
                DashboardLayoutService.saveLockedList($scope.lockedList);
            } else {
                $scope.lockedList = r;                
            }
        });

        DashboardLayoutService.get().then(function (response) {
            $scope.dashboardLayouts = response;
            var defaultLayout = $scope.dashboardLayouts.defaultLayout['DEFAULT'];
            var selectedLayout = null;
            if ($scope.selectedProgram && $scope.selectedProgram.id) {
                selectedLayout = $scope.dashboardLayouts.customLayout && $scope.dashboardLayouts.customLayout[$scope.selectedProgram.id] ? $scope.dashboardLayouts.customLayout[$scope.selectedProgram.id] : $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id];
            }
            selectedLayout = !selectedLayout ? defaultLayout : selectedLayout;

            if($scope.selectedProgram && $scope.lockedList[$scope.selectedProgram.id]) {
                selectedLayout = $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id] ? $scope.dashboardLayouts.defaultLayout[$scope.selectedProgram.id] : defaultLayout;
            }
            
            $scope.model.stickyDisabled = selectedLayout.stickRightSide ? !selectedLayout.stickRightSide : true;
            
            angular.forEach(selectedLayout.widgets, function (widget) {
                if (widget.title !== "activePrograms") {
                    $rootScope[widget.title + 'Widget'] = widget;
                    $rootScope.dashboardWidgets.push($rootScope[widget.title + 'Widget']);
                    $scope.dashboardStatus[widget.title] = angular.copy(widget);
                }
            });

            angular.forEach(defaultLayout.widgets, function (w) {
                if (!$scope.dashboardStatus[w.title]) {
                    $rootScope[w.title + 'Widget'] = w;
                    $rootScope.dashboardWidgets.push($rootScope[w.title + 'Widget']);
                    $scope.dashboardStatus[w.title] = angular.copy(w);
                }
                $rootScope.defaultDashboardWidgetsByTitle[w.title] = w;
            });

            if(selectedLayout.topBarSettings){
                $scope.topBarConfig.settings = selectedLayout.topBarSettings;
            }else{
                selectedLayout.topBarSettings = $scope.topBarConfig.settings;
            }

            $scope.hasBigger = false;
            angular.forEach(orderByFilter($filter('filter')($scope.dashboardWidgets, {parent: "biggerWidget"}), 'order'), function (w) {
                if (w.show) {
                    $scope.hasBigger = true;
                }
                $scope.dashboardWidgetsOrder.biggerWidgets.push(w.title);
            });

            $scope.hasSmaller = false;
            angular.forEach(orderByFilter($filter('filter')($scope.dashboardWidgets, {parent: "smallerWidget"}), 'order'), function (w) {
                if (w.show) {
                    $scope.hasSmaller = true;
                }
                $scope.dashboardWidgetsOrder.smallerWidgets.push(w.title);
            });

            setWidgetsSize();
            $scope.broadCastSelections();
            setInactiveMessage();
        });
    };

    $rootScope.getWidget = function(widgetTitle){
        var result = $.grep($rootScope.dashboardWidgets, function(widget)
        { 
            return widget.title === widgetTitle;
        });
        if(result.length > 0) return result[0];
        return null;
    }

    var setWidgetsSize = function () {

        $scope.widgetSize = {smaller: "col-sm-6 col-md-4", bigger: "col-sm-6 col-md-8"};

        if (!$scope.hasSmaller) {
            $scope.widgetSize = {smaller: "col-sm-1", bigger: "col-sm-11"};
        }

        if (!$scope.hasBigger) {
            $scope.widgetSize = {smaller: "col-sm-11", bigger: "col-sm-1"};
        }
    };

    var setInactiveMessage = function () {
        if ($scope.selectedTei.inactive) {
            var teName = $scope.trackedEntityType && $scope.trackedEntityType.displayName ? $scope.trackedEntityType.displayName : $translate.instance('tracked_entity_instance');
            setHeaderDelayMessage(teName + " " + $translate.instant('tei_inactive_only_read'));
        }
    };
    
    //listen for any change to program selection
    //it is possible that such could happen during enrollment.
    $scope.$on('mainDashboard', function (event, args) {
        var selections = CurrentSelection.get();
        $scope.selectedProgram = null;
        angular.forEach($scope.programs, function (pr) {
            if (pr.id === selections.pr) {
                $scope.selectedProgram = pr;
            }
        });

        $scope.applySelectedProgram();
    });

    function getCurrentDashboardLayout() {
        var widgets = [];
        $scope.hasBigger = false;
        $scope.hasSmaller = false;
        angular.forEach($rootScope.dashboardWidgets, function (widget) {
            var w = angular.copy(widget);
            if ($scope.orderChanged) {
                if ($scope.widgetsOrder.biggerWidgets.indexOf(w.title) !== -1) {
                    $scope.hasBigger = $scope.hasBigger || w.show;
                    w.parent = 'biggerWidget';
                    w.order = $scope.widgetsOrder.biggerWidgets.indexOf(w.title);
                }

                if ($scope.widgetsOrder.smallerWidgets.indexOf(w.title) !== -1) {
                    $scope.hasSmaller = $scope.hasSmaller || w.show;
                    w.parent = 'smallerWidget';
                    w.order = $scope.widgetsOrder.smallerWidgets.indexOf(w.title);
                }
            }
            widgets.push(w);
        });

        return {widgets: widgets, topBarSettings: $scope.topBarConfig.settings, program: $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT', programStageTimeLineLayout: DashboardLayoutService.getProgramStageLayout()};
    }

    function saveDashboardLayout() {
        var currentLayout = $scope.dashboardLayouts.customLayout ? angular.copy($scope.dashboardLayouts.customLayout) : {};
        var programId = $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT';        
        currentLayout[programId] = getCurrentDashboardLayout();
        
        DashboardLayoutService.saveLayout(currentLayout, false).then(function () {
            if (!$scope.orderChanged) {
                $scope.hasSmaller = $filter('filter')($scope.dashboardWidgets, {
                    parent: "smallerWidget",
                    show: true
                }).length > 0;
                $scope.hasBigger = $filter('filter')($scope.dashboardWidgets, {
                    parent: "biggerWidget",
                    show: true
                }).length > 0;
            }
            setWidgetsSize();
        });
    };
    
    $scope.saveDashboarLayoutAsDefault = function () {
        var layout = angular.copy($scope.dashboardLayouts.defaultLayout);        
        var programId = $scope.selectedProgram && $scope.selectedProgram.id ? $scope.selectedProgram.id : 'DEFAULT';        
        layout[programId] = getCurrentDashboardLayout();
        delete layout.DEFAULT;
        DashboardLayoutService.saveLayout(layout, true);
    };

    $scope.toggleLockDashboard = function () {
        $scope.lockedList[$scope.selectedProgram.id] = !$scope.lockedList[$scope.selectedProgram.id];

        if($scope.selectedProgram && $scope.selectedProgram.id) {
            DashboardLayoutService.saveLockedList($scope.lockedList);
        } else {
            alert("No program selected.");
        }

    };

    //persist widget sorting
    $scope.applyWidgetsOrderChange = function(param){
        $scope.widgetsOrder = param;
        $scope.orderChanged = false;
        for (var i = 0; i < $scope.widgetsOrder.smallerWidgets.length; i++) {
            if ($scope.widgetsOrder.smallerWidgets.length === $scope.dashboardWidgetsOrder.smallerWidgets.length && $scope.widgetsOrder.smallerWidgets[i] !== $scope.dashboardWidgetsOrder.smallerWidgets[i]) {
                $scope.orderChanged = true;
            }

            if ($scope.widgetsOrder.smallerWidgets.length !== $scope.dashboardWidgetsOrder.smallerWidgets.length) {
                $scope.orderChanged = true;
            }
        }

        for (var i = 0; i < $scope.widgetsOrder.biggerWidgets.length; i++) {
            if ($scope.widgetsOrder.biggerWidgets.length === $scope.dashboardWidgetsOrder.biggerWidgets.length && $scope.widgetsOrder.biggerWidgets[i] !== $scope.dashboardWidgetsOrder.biggerWidgets[i]) {
                $scope.orderChanged = true;
            }

            if ($scope.widgetsOrder.biggerWidgets.length !== $scope.dashboardWidgetsOrder.biggerWidgets.length) {
                $scope.orderChanged = true;
            }
        }

        if ($scope.orderChanged) {
            saveDashboardLayout();
        }
    };

    $scope.$on('DataEntryMainMenuItemSelected', function (event) {
        $scope.dataEntryMainMenuItemSelected = true;
    });

    $scope.$on('ErollmentDeleted', function (args, data) {
        $scope.allEnrollments = data.enrollments;
        updateDashboard();
    });

    $scope.$on('DataEntryMainMenuVisibilitySet', function (event, data) {
        if (data.visible) {
            //hide all widgets except visibleItems in data
            angular.forEach($scope.dashboardWidgets, function (widget) {
                if (!data.visibleItems[widget.title]) {
                    $scope.temporaryHideWidgets[widget.title] = true;
                } else {
                    $scope.temporaryShowWidgets[widget.title] = true;
                }

            });
        } else if (data.closingStage) {//Palestine, show only closing stage

        } else {
            //show widgets, reset temporary settings
            $scope.temporaryHideWidgets = [];
            $scope.temporaryShowWidgets = [];

        }
    });
    
    $scope.applySelectedProgram = function (pr) {
        if (pr) {
            $scope.selectedProgram = pr;
        } else {
            $location.path('/dashboard').search({ou: $scope.selectedOrgUnit.id, tei: $scope.selectedTei.trackedEntityInstance});
        }
        $location.path('/dashboard').search({program: pr.id, ou: $scope.selectedOrgUnit.id, tei: $scope.selectedTei.trackedEntityInstance});
    };

    $scope.broadCastSelections = function (tei) {

        var selections = CurrentSelection.get();
        if (tei) {
            $scope.selectedTei = tei;
        } else {
            $scope.selectedTei = selections.tei;
        }

        $scope.trackedEntityType = selections.te;
        $scope.optionSets = selections.optionSets;
        $scope.selectedEnrollment = null;

        if ($scope.selectedProgram) {
            for (var i = 0; i < selections.enrollments.length; i++) {
                if (selections.enrollments[i].program === $scope.selectedProgram.id) {
                    $scope.selectedEnrollment = selections.enrollments[i];
                    break;
                }
            }
        }

        CurrentSelection.set({
            tei: $scope.selectedTei,
            te: $scope.trackedEntityType,
            prs: $scope.programs,
            pr: $scope.selectedProgram,
            prNames: $scope.programNames,
            prStNames: $scope.programStageNames,
            enrollments: selections.enrollments,
            selectedEnrollment: $scope.selectedEnrollment,
            optionSets: $scope.optionSets,
            orgUnit: $scope.selectedOrgUnit
        });
        $timeout(function () {
            $rootScope.$broadcast('selectedItems', {programExists: $scope.programs.length > 0});
        }, 500);
    };



    $scope.activiateTEI = function () {
        var st = !$scope.selectedTei.inactive || $scope.selectedTei.inactive === '' ? true : false;

        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: st ? 'deactivate' : 'activate',
            bodyText: 'are_you_sure_to_proceed'
        };

        ModalService.showModal({}, modalOptions).then(function (result) {

            $scope.selectedTei.inactive = st;
            TEIService.update($scope.selectedTei, $scope.optionSets, $scope.attributesById).then(function (data) {
                setInactiveMessage();
                $scope.broadCastSelections($scope.selectedTei);
            });
        }, function () {
        });
    };

    var canDeleteTei = function(){
        if($scope.trackedEntityType && $scope.trackedEntityType.access.data.write){
            if($scope.allEnrollments && $scope.allEnrollments.length > 0){
                if(!$scope.userAuthority.canCascadeDeleteTei) return false;
            }
            return true;
        }
        return false;
    }

    $scope.deleteTEI = function () {
        if(!canDeleteTei()){
            var bodyText = $translate.instant("cannot_delete_this_tei_because_it_already_contains_enrollments");
            var headerText = $translate.instant("delete_failed");
            NotificationService.showNotifcationDialog(headerText, bodyText);
            return;
        }
        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: 'delete',
            bodyText: $translate.instant('are_you_sure_to_proceed') + ' ' + $translate.instant('will_delete_all_data_associated') + ' ' + $scope.trackedEntityType.displayName
        };
        
        ModalService.showModal({}, modalOptions).then(function (result) {
            TEIService.delete($scope.selectedTeiId).then(function (response) {
                if( !response ){
                    var teis = CurrentSelection.getTrackedEntityTypes();                
                    if( teis && teis.rows && teis.rows.own && teis.rows.own.length > 0 ){
                        var index = -1;
                        for( var i=0; i<teis.rows.own.length && index === -1; i++ ){
                            if( teis.rows.own[i].id === $scope.selectedTeiId ){
                                index = i;
                            }
                        }

                        if( index !== -1 ){
                            teis.rows.own.splice(index, 1);
                            CurrentSelection.setTrackedEntityTypes(teis);
                        }
                    }
                }
                NotificationService.showNotifcationDialog($translate.instant('success'), $scope.trackedEntityType.displayName + ' ' + $translate.instant('deleted'));                
                $scope.back();                
            });
        });
    };

    $scope.back = function () {
        if (!$scope.dataEntryMainMenuItemSelected) {
            //reload OU tree
            selection.load();
            $location.path('/').search({program: $scope.selectedProgramId});
        } else {
            $rootScope.$broadcast('DashboardBackClicked');
            $scope.dataEntryMainMenuItemSelected = false;
        }
    };
            
    $scope.getBackButtonText = function () {
        if (!$scope.dataEntryMainMenuItemSelected) {
            return $translate.instant('back');
        } else {
            return $translate.instant('menu');
        }
    };
// custom change for intpart start
    $scope.eventmodel = function () {
        var addtomarque;
        var screen;
        var blood;
        var objbirth = [];
        var objfeeding = [];
        var objaefi = [];
        var objsixweeks = [];
        var objtenweeks = [];
        var objfourteenweeks = [];
        var objninemonth = [];
        var objsixteen24months = [];
        var sugar;
        var objvitamin = [];
        var count = 0;
        var Table = document.getElementById("table1");
        Table.innerHTML = "";
        var emptymarque = document.getElementById("marq");
        emptymarque.innerHTML = "";
        var url = window.location.href;
        var params = url.split('=');
        var per = params[1];
        var finper = per.split('&');
        var trackid = finper[0];

        var perr = params[2];
        var finperr = perr.split('&');
        var programidd = finperr[0];
        //alert(programidd);
        var npcdcsid = "jC8Gprj4pWV";
        if (programidd == npcdcsid) {
            /*$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=jC8Gprj4pWV&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data1) {
                var trackdata = data1;
                for (var j = 0; j < trackdata.events.length; j++) {
                        var screenoutcome = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#5BC0DE'><b>Screening Outcome<b></td>";
                    var bloodpressure = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:orange'><b>Blood Pressure<b></td>";
                    var sugarfastning = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#D9534F'><b>Sugar Fastning<b></td>";
                      // leng=eventdata.events.length;
                    var dateofvisit = trackdata.events[j].eventDate;  //
                    //  console.log(leng);
                    var dataval = trackdata.events[j].dataValues;
                    if (dataval.length > 1) {
                        count++;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;
                              if (id == "ObkhLek0zZf")// oral ca
                            {
                                screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>Oral Ca<b></td>";
                                  // var aa="you have oral ca";
                                //  $(".reporttt").append(first);
                                // $(".report").append(name);
                              }
                            else if (id == "xFhzzBJ4Z6K")// RF
                            {
                                screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>RF<b></td>";
                                  // var bb="you have RF";
                                  //  alert("you have RF");
                              }
                            else if (id == "C4YdSPG3Mr0")// Brease CA
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>Breast CA<b></td>";
                              }
                            else if (id == "gpJWjauP93y")// cervical CA
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>Cervical CA<b></td>";
                              }
                            else if (id == "Fay65bFZIkC")// CKD
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>CKD<b></td>";
                              }
                            else if (id == "doZmhIPTR2O")// COPD
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>COPD<b></td>";
                              }
                            else if (id == "GREEuTukX3P")// DM
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>DM<b></td>";
                              }
                            else if (id == "FSD6mDILc7l")// HTN
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>HTN<b></td>";
                              }
                            else if (id == "m63ulx9T3Ri")// CVD1
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>CVD1<b></td>";
                              }
                            else if (id == "bv7PMXbyOZD")// CA-other
                            {
                                  screenoutcome = screenoutcome + "<td style='border:1px solid black;text-align:center'><b>CA-Other<b></td>";
                              }
                            else if (id == "HQz8UUWfvo0")// systolic blood presure
                            {
                                var systol = dataval[q].value;
                                bloodpressure = bloodpressure + "<td style='border:1px solid black;text-align:center'><b>" + systol + "&nbsp&nbsp&nbspSystolic" + "<b></td>";
                                //  alert("hyy");
                            }
                            else if (id == "pTuKCcPRn9k")// diasitoli cblood presure
                            {
                                var diasit = dataval[q].value;
                                bloodpressure = bloodpressure + "<td style='border:1px solid black;text-align:center'><b>" + diasit + "&nbsp&nbspDiastolic" + "<b></td>";
                                // alert("hyy");
                            }
                            else if (id == "kfqBvvoWuzA")//FBS (mg/dl)
                            {
                                var fbs = dataval[q].value;
                                sugarfastning = sugarfastning + "<td style='border:1px solid black;text-align:center'><b>" + fbs + "&nbsp&nbspFBS(mg/dl)" + "<b></td>";
                                // alert("hyy");
                            }
                            else if (id == "XtI1MSP154r")// PPBS (mg/dl)
                            {
                                var ppbs = dataval[q].value;
                                sugarfastning = sugarfastning + "<td style='border:1px solid black;text-align:center'><b>" + ppbs + "&nbsp&nbspPPBS(mg/dl)" + "<b></td>";
                                // alert("hyy");
                            }
                            else if (id == "FHBrdgsPgDY")// RBS (mg/dl)
                            {
                                var rbs = dataval[q].value;
                                sugarfastning = sugarfastning + "<td style='border:1px solid black;text-align:center'><b>" + rbs + "&nbsp&nbspRBS(mg/dl)" + "<b></td>";
                                // alert("hyy");
                            }
                        }
                        screenoutcome = screenoutcome + "</tr>";
                        bloodpressure = bloodpressure + "</tr>"
                        sugarfastning = sugarfastning + "</tr>";
                        var visitnno = "<tr><td >Visit No: " + count + "</td><td>" + dateofvisit.substring(0, 10); +"</td></tr>";
                        var emptyRoww = "<tr class='emptyRow'><td height='35px'></td><tr>";
                        var blankmarque = "<td width='50px'></td>";
                        $(".reporttt").append(visitnno);
                        $(".reporttt").append(screenoutcome);
                        $(".reporttt").append(bloodpressure);
                        $(".reporttt").append(sugarfastning);
                        $(".reporttt").append(emptyRoww);
                        screen = screenoutcome;
                        screen = screen.slice(0, -5);
                        blood = bloodpressure;
                        blood = blood.slice(0, -5);
                        blood = blood.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        sugarfastning = sugarfastning.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        addtomarque = screen + blankmarque + blood + blankmarque + sugarfastning;
                    }
                  }
                    });
            // $("#myModal").modal();
            $("#myModal").modal('show');
            $("#myModal").on('hidden.bs.modal', function () {
                $("#marq").append(addtomarque);
                addtomarque = "";
            });*/

            var message;
            message = {
                "programMessages": [{
                    "recipients": {
                        "emailAddresses": ["dilroop.singh.ds@gmail.com", "ramgopal@gmail.com"]
                    },
                    "programInstance": {
                        "id": "jC8Gprj4pWV"
                    },
                    "deliveryChannels": ["EMAIL"],
                    "subject": "Test from dhis2",
                    "text": "this is working fine",
                    "storeCopy": false
                }]
            };
            MessagingService.sendMessage(message);
        } else if (programidd == "JdZ3gv6cx54") {
            // alert("found you");
            $.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=JdZ3gv6cx54&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data1) {
                var trackdata = data1;
                for (var j = 0; j < trackdata.events.length; j++) {

                    var Birth_Dose = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#5BC0DE'>Birth Dose</td>";
                    var ChildFeeding = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:orange'><b>Breast Feeding<b></td>";
                    var AEFI = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#D9534F'><b>AEFI<b></td>";
                    var immunistaion_at_sixweeks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#32CD32'><b>6 weeks<b></td>";
                    var immunistaion_at_tenweeks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#8B8682'><b>10 weeks<b></td>";
                    var immunistaion_at_fourteenweeks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#5BC0DE'><b>14 weeks<b></td>";
                    var immunistaion_at_ninemonths = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:orange'><b>9 months<b></td>";
                    var immunistaion_at_sixteen24months = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#D9534F'><b>16-24 months<b></td>";
                    var vitaminss = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td style='text-align:center;color:white;background-color:#32CD32'><b>Vitamins<b></td>";

                    var dateofvisit = trackdata.events[j].eventDate; //
                    //  console.log(leng);
                    var dataval = trackdata.events[j].dataValues;
                    if (dataval.length > 1) {
                        count++;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;

                            if (id == "KO9GNZ6bsvP") // Vit K(Birth Dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objbirth.push(vall);
                                    Birth_Dose = Birth_Dose + "<td style='border:1px solid black;text-align:center'><b>Vit K<b></td>";
                                }
                            } else if (id == "X0LM2G9QrRq") // BCG(Birth Dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objbirth.push(vall);
                                    Birth_Dose = Birth_Dose + "<td style='border:1px solid black;text-align:center'><b>BCG<b></td>";
                                }
                            } else if (id == "geB0cJnqUuw") //  OPV(Birth Dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objbirth.push(vall);
                                    Birth_Dose = Birth_Dose + "<td style='border:1px solid black;text-align:center'><b>OPV<b></td>";
                                }
                            } else if (id == "LomeCfySW2p") //HEP B(Birth Dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objbirth.push(vall);
                                    Birth_Dose = Birth_Dose + "<td style='border:1px solid black;text-align:center'><b>HEP B<b></td>";
                                }
                            } else if (id == "wNBq0a4HVG2") // breastfeeding was given upto 6 months
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfeeding.push(vall);
                                    ChildFeeding = ChildFeeding + "<td style='border:1px solid black;text-align:center'><b> breastfeeding given upto 6 months 	<b></td>";
                                }
                            } else if (id == "MmiNSPetHLN") // Complementary feeding after 6 months
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfeeding.push(vall);
                                    ChildFeeding = ChildFeeding + "<td style='border:1px solid black;text-align:center'><b>Complementary feeding after 6 months<b></td>";
                                }
                            } else if (id == "RsXNgPyCy8O") // AEFI
                            {
                                var vall = dataval[q].value;
                                var aefivalue = vall;
                                objaefi.push(aefivalue);
                                AEFI = AEFI + "<td style='border:1px solid black;text-align:center'><b>" + aefivalue + "<b></td>";
                            } else if (id == "Y70xDmi3Y7F") // Details of Vaccine
                            {
                                var vall = dataval[q].value;
                                var aefi_detail = vall;
                                objaefi.push(aefivalue);
                                AEFI = AEFI + "<td style='border:1px solid black;text-align:center'><b>" + aefi_detail + "<b></td>";
                            } else if (id == "RiTLb8I7Ko5") // OPV 1
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixweeks.push(vall);
                                    immunistaion_at_sixweeks = immunistaion_at_sixweeks + "<td style='border:1px solid black;text-align:center'><b>OPV 1<b></td>";
                                }
                            } else if (id == "pY9t6s0BPcx") // DPT/Penta 1
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixweeks.push(vall);
                                    immunistaion_at_sixweeks = immunistaion_at_sixweeks + "<td style='border:1px solid black;text-align:center'><b>DPT/Penta 1 <b></td>";
                                }
                            } else if (id == "UcWvna0WpdU") // IPV 1
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixweeks.push(vall);
                                    immunistaion_at_sixweeks = immunistaion_at_sixweeks + "<td style='border:1px solid black;text-align:center'><b>IPV 1<b></td>";
                                }
                            } else if (id == "Hb9dY5gedpI") // HEP B1
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixweeks.push(vall);
                                    immunistaion_at_sixweeks = immunistaion_at_sixweeks + "<td style='border:1px solid black;text-align:center'><b>HEP B1<b></td>";
                                }
                            } else if (id == "NV6p0JaJacm") // OPV 2
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objtenweeks.push(vall);
                                    immunistaion_at_tenweeks = immunistaion_at_tenweeks + "<td style='border:1px solid black;text-align:center'><b>OPV 2<b></td>";
                                }
                            } else if (id == "pqBNLJWicCs") //DPT/Penta 2
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objtenweeks.push(vall);
                                    immunistaion_at_tenweeks = immunistaion_at_tenweeks + "<td style='border:1px solid black;text-align:center'><b>DPT/Penta 2<b></td>";
                                }
                            } else if (id == "sRN7mG6Q0ky") //HEP B2
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objtenweeks.push(vall);
                                    immunistaion_at_tenweeks = immunistaion_at_tenweeks + "<td style='border:1px solid black;text-align:center'><b>HEP B2<b></td>";
                                }
                            } else if (id == "OBCz2WmQ0Wr") //OPV 3
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfourteenweeks.push(vall);
                                    immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks + "<td style='border:1px solid black;text-align:center'><b>OPV 3<b></td>";
                                }
                            } else if (id == "bLJEYJvjbtF") //DPT/Penta 3
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfourteenweeks.push(vall);
                                    immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks + "<td style='border:1px solid black;text-align:center'><b>DPT/Penta 3<b></td>";
                                }
                            } else if (id == "eC1dIDNQbib") //IPV 2
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfourteenweeks.push(vall);
                                    immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks + "<td style='border:1px solid black;text-align:center'><b>IPV 2<b></td>";
                                }
                            } else if (id == "GVx9H3VPQpb") //HEP B3
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objfourteenweeks.push(vall);
                                    immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks + "<td style='border:1px solid black;text-align:center'><b>HEP B3<b></td>";
                                }
                            } else if (id == "HS2ypHNwtWy") //JE (1st dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objninemonth.push(vall);
                                    immunistaion_at_ninemonths = immunistaion_at_ninemonths + "<td style='border:1px solid black;text-align:center'><b>JE(1st dose)<b></td>";
                                }
                            } else if (id == "kq5XBCko5id") //Measles (1st dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objninemonth.push(vall);
                                    immunistaion_at_ninemonths = immunistaion_at_ninemonths + "<td style='border:1px solid black;text-align:center'><b>Measles(1st dose)<b></td>";
                                }
                            } else if (id == "LGXWjlpx73G") //Diarrhoea (Measles)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objninemonth.push(vall);
                                    immunistaion_at_ninemonths = immunistaion_at_ninemonths + "<td style='border:1px solid black;text-align:center'><b>Diarrhoea(Measles)<b></td>";
                                }
                            } else if (id == "ajpdN9HB29Q") //DPT/Penta Booster
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>Diarrhoea(Measles)<b></td>";
                                }
                            } else if (id == "zSd4PVzkfp5") //Diarrhoea (DPT)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>Diarrhoea (DPT)<b></td>";
                                }
                            } else if (id == "mtHUBDF91KG") //Measles 2nd Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>Measles 2nd Dose<b></td>";
                                }
                            } else if (id == "h3SbGX4562o") //OPV Booster
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>OPV Booster<b></td>";
                                }
                            } else if (id == "EpAqK3hd4sV") //DPT Booster 2
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>DPT Booster 2<b></td>";
                                }
                            } else if (id == "ffFqPgSWpsn") //JE 2nd Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objsixteen24months.push(vall);
                                    immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "<td style='border:1px solid black;text-align:center'><b>JE 2nd Dose<b></td>";
                                }
                            } else if (id == "UjhLFpJ4ey9") //Vitamin A (1st dose)
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 1st dose<b></td>";
                                }
                            } else if (id == "N3ZcKrrj31O") //Vitamin A 2nd Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 2nd Dose<b></td>";
                                }
                            } else if (id == "oo5ImHAJJJv") //Vitamin A 3rd Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 3rd Dose<b></td>";
                                }
                            } else if (id == "iN7e1e5kNZa") //Vitamin A 4th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 4th Dose<b></td>";
                                }
                            } else if (id == "mAjCq0DOUA8") //Vitamin A 5th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 5th Dose<b></td>";
                                }
                            } else if (id == "jL8ONs5GQih") //Vitamin A 6th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 6th Dose<b></td>";
                                }
                            } else if (id == "jywcoFDCIhy") //Vitamin A 7th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 7th Dose<b></td>";
                                }
                            } else if (id == "sQk9YvQZ8az") //Vitamin A 8th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 8th Dose<b></td>";
                                }
                            } else if (id == "uv59WV60nJv") //Vitamin A 9th Dose
                            {
                                var vall = dataval[q].value;
                                if (vall == "true") {
                                    objvitamin.push(vall);
                                    vitaminss = vitaminss + "<td style='border:1px solid black;text-align:center'><b>Vitamin A 9th Dose<b></td>";
                                }
                            }
                        }
                        var visitnno = "<tr><td >Visit No: " + count + "</td><td>" + dateofvisit.substring(0, 10);+"</td></tr>";
                        $(".reporttt").append(visitnno);
                        if (objbirth.length > 0) {
                            //  BIRTH DOSE
                            var colspan = 1 + parseInt(objbirth.length);
                            var immunisationatbirh = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#5BC0DE'><b>Immunization at Birth<b></td></tr>";
                            $(".reporttt").append(immunisationatbirh);
                            Birth_Dose = Birth_Dose + "</tr>";
                            $(".reporttt").append(Birth_Dose);
                        }

                        if (objfeeding.length > 0) {
                            // CHILD FEEDING
                            var colspan = 1 + parseInt(objfeeding.length);
                            var childfeed = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:orange'><b>Child Feeding<b></td></tr>";
                            $(".reporttt").append(childfeed);
                            ChildFeeding = ChildFeeding + "</tr>";
                            $(".reporttt").append(ChildFeeding);
                        }
                        if (objaefi.length > 0) {
                            // AEFI
                            var colspan = 1 + parseInt(objaefi.length);
                            var aefii = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#D9534F'><b>AEFI<b></td></tr>";
                            $(".reporttt").append(aefii);
                            AEFI = AEFI + "</tr>";
                            $(".reporttt").append(AEFI);
                        }
                        if (objsixweeks.length > 0) {
                            // Immunization at 6 weeks
                            var colspan = 1 + parseInt(objsixweeks.length);
                            var sixweeks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#32CD32'><b>Immunization at 6 weeks<b></td></tr>";
                            $(".reporttt").append(sixweeks);
                            immunistaion_at_sixweeks = immunistaion_at_sixweeks + "</tr>";
                            $(".reporttt").append(immunistaion_at_sixweeks);
                        }
                        if (objtenweeks.length > 0) {
                            // Immunization at 10 weeks
                            var colspan = 1 + parseInt(objtenweeks.length);
                            var tenweeks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#8B8682'><b>Immunization at 10 weeks<b></td></tr>";
                            $(".reporttt").append(tenweeks);
                            immunistaion_at_tenweeks = immunistaion_at_tenweeks + "</tr>";
                            $(".reporttt").append(immunistaion_at_tenweeks);
                        }
                        if (objfourteenweeks.length > 0) {
                            // Immunization at 14 weeks
                            var colspan = 1 + parseInt(objfourteenweeks.length);
                            var fourteenweks = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#5BC0DE'><b>Immunization at 14 weeks<b></td></tr>";
                            $(".reporttt").append(fourteenweks);
                            immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks + "</tr>";
                            $(".reporttt").append(immunistaion_at_fourteenweeks);
                        }
                        if (objninemonth.length > 0) {
                            // Immunization at 9 months
                            var colspan = 1 + parseInt(objninemonth.length);
                            var nineemnth = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:orange'><b>Immunization at 9 months<b></td></tr>";
                            $(".reporttt").append(nineemnth);
                            immunistaion_at_ninemonths = immunistaion_at_ninemonths + "</tr>";
                            $(".reporttt").append(immunistaion_at_ninemonths);
                        }
                        if (objsixteen24months.length > 0) {
                            // Immunization at 16-24 months
                            var colspan = 1 + parseInt(objsixteen24months.length);
                            var sixteen24enth = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#D9534F'><b>Immunization at 16-24 months<b></td></tr>";
                            $(".reporttt").append(sixteen24enth);
                            immunistaion_at_sixteen24months = immunistaion_at_sixteen24months + "</tr>";
                            $(".reporttt").append(immunistaion_at_sixteen24months);
                        }
                        if (objvitamin.length > 0) {
                            // vitamins
                            var colspan = 1 + parseInt(objvitamin.length);
                            var vitaamins = "<tr  style='border:1px solid black;background-color:white;height:30px'>  <td colspan=" + colspan + " style='text-align:center;color:white;background-color:#32CD32'><b>vitamin A<b></td></tr>";
                            $(".reporttt").append(vitaamins);
                            vitaminss = vitaminss + "</tr>";
                            $(".reporttt").append(vitaminss);
                        }
                        //var visitnno ="<tr><td >Visit No: "+count+"</td><td>"+dateofvisit.substring(0, 10);+"</td></tr>";
                        var emptyRoww = "<tr class='emptyRow'><td height='35px'></td><tr>";
                        var blankmarque = "<td width='50px'></td>";

                        //  $(".reporttt").append(sugarfastning);
                        $(".reporttt").append(emptyRoww);
                        screen = Birth_Dose;
                        screen = screen.slice(0, -5);
                        blood = ChildFeeding;
                        blood = blood.slice(0, -5);
                        blood = blood.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        AEFI = AEFI.slice(0, -5);
                        AEFI = AEFI.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        immunistaion_at_sixweeks = immunistaion_at_sixweeks.slice(0, -5);
                        immunistaion_at_sixweeks = immunistaion_at_sixweeks.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        immunistaion_at_tenweeks = immunistaion_at_tenweeks.slice(0, -5);
                        immunistaion_at_tenweeks = immunistaion_at_tenweeks.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks.slice(0, -5);
                        immunistaion_at_fourteenweeks = immunistaion_at_fourteenweeks.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        immunistaion_at_ninemonths = immunistaion_at_ninemonths.slice(0, -5);
                        immunistaion_at_ninemonths = immunistaion_at_ninemonths.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        immunistaion_at_sixteen24months = immunistaion_at_sixteen24months.slice(0, -5);
                        immunistaion_at_sixteen24months = immunistaion_at_sixteen24months.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");
                        vitaminss = vitaminss.replace("<tr  style='border:1px solid black;background-color:white;height:30px'>", "");

                        addtomarque = screen + blankmarque + blood + blankmarque + AEFI + blankmarque + immunistaion_at_sixweeks + blankmarque + immunistaion_at_tenweeks + blankmarque + immunistaion_at_fourteenweeks + blankmarque + immunistaion_at_ninemonths + blankmarque + immunistaion_at_sixteen24months + blankmarque + vitaminss;
                        objbirth = [];
                        objfeeding = [];
                        objaefi = [];
                        objsixweeks = [];
                        objtenweeks = [];
                        objfourteenweeks = [];
                        objninemonth = [];
                        objsixteen24months = [];
                        objvitamin = [];
                    }
                }
            });
            // $("#myModal").modal();
            $("#myModal").modal('show');
            $("#myModal").on('hidden.bs.modal', function () {
                $("#marq").append(addtomarque);
                addtomarque = "";
            });
        } else {
            window.alert("Under Development for this program");
        }
    };

    $scope.chartmodel = function () {

        $.ajaxSetup({
            async: false
        });
        var datavalueofchart_systolic = [];
        var datavalueofchart_diastolic = [];
        var default_systolic = [];
        var default_diastolic = [];
        var orinalid = ["HQz8UUWfvo0", "pTuKCcPRn9k"];
        var dateofvisit = [];
        var objid = [];
        var url = window.location.href;
        var params = url.split('=');
        var per = params[1];
        var finper = per.split('&');
        var trackid = finper[0];

        $.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=jC8Gprj4pWV&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data1) {
            var trackdata = data1;
            for (var j = 0; j < trackdata.events.length; j++) {

                var dataval = trackdata.events[j].dataValues;
                if (dataval.length > 1) {
                    dateofvisit.push(trackdata.events[j].eventDate.substring(0, 10));
                    for (var q = 0; q < dataval.length; q++) {
                        var id = dataval[q].dataElement;

                        objid.push(id);
                        if (id == "HQz8UUWfvo0") // systolic blood presure
                        {
                            var systol = dataval[q].value;
                            datavalueofchart_systolic.push(systol);
                            default_systolic.push("140");
                        } else if (id == "pTuKCcPRn9k") // diasitoli cblood presure
                        {
                            var diasit = dataval[q].value;
                            datavalueofchart_diastolic.push(diasit);
                            default_diastolic.push("90");
                        }
                    }
                    var array3 = orinalid.filter(function (obj) {
                        return objid.indexOf(obj) == -1;
                    });
                    for (var t = 0; t < array3.length; t++) {
                        if (array3[t] == "HQz8UUWfvo0") datavalueofchart_systolic.push("0");else if (array3[t] == "pTuKCcPRn9k") datavalueofchart_diastolic.push("0");
                    }
                    objid = [];
                }
            }
        });

        var ctx = document.getElementById('myChart').getContext('2d');
        var myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateofvisit,
                responsive: true,
                datasets: [{
                    label: "Systolic(mmHg)",
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [5, 5],
                    data: datavalueofchart_systolic,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "Diastolic(mmHg)",
                    backgroundColor: '#0F75F7',
                    borderColor: '#0F75F7',
                    borderDash: [5, 5],
                    responsive: true,
                    data: datavalueofchart_diastolic,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "Systolic:Cut-off",
                    backgroundColor: '#024204',
                    borderColor: '#024204',
                    borderWidth: '5px',
                    responsive: true,
                    data: default_systolic,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "Diastolic:Cut-off",
                    backgroundColor: '#23B204',
                    borderColor: '#23B204',
                    borderWidth: '5px',
                    responsive: true,
                    data: default_diastolic,
                    fill: false,
                    lineTension: 0
                }]
            },
            options: {
                responsive: true,

                tooltips: {
                    position: 'nearest',
                    mode: 'index',
                    intersect: false,
                    yPadding: 10,
                    xPadding: 10,
                    caretSize: 8,
                    backgroundColor: '#FAFAFA',
                    titleFontColor: '#000',
                    bodyFontColor: '#000',
                    borderColor: 'rgba(0,0,0,1)',
                    borderWidth: 4
                }
            }
        });

        $("#myModalchart").modal('show');
    };

    $scope.chartmodeldm = function () {

        $.ajaxSetup({
            async: false
        });
        var obj_hb_gm_first = [];
        var reportdate_first = [];
        var mild = [];
        var moderate = [];
        var severe = [];
        var url = window.location.href;
        var params = url.split('=');
        var per = params[1];
        var finper = per.split('&');
        var trackid = finper[0];

        $.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=SUCUF657zNe&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data) {

            var trackdata = data;
            console.log(trackdata);

            for (var i = 0; i < trackdata.events.length; i++) {
                var matchevent = trackdata.events[i].programStage;

                if (matchevent == "aAmtHNAQo7g") {
                    //ANC First visist

                    if (trackdata.events[i].eventDate) {

                        var dataval = trackdata.events[i].dataValues;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;

                            if (id == "yka2bblmdbM") //hb value 1st visit
                            {

                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            } else if (id == "jTyiikEB6Vm") //hb value 1st visit
                            {

                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            }
                        }
                    }
                } else if (matchevent == "DwoQd5oIicL") {
                    //Additional ANC visit

                    if (trackdata.events[i].eventDate) {

                        var dataval = trackdata.events[i].dataValues;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;

                            if (id == "ojdgwkjVyOc") //hb value 1st visit
                            {

                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            } else if (id == "jTyiikEB6Vm") //hb(gm)
                            {

                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            }
                        }
                    }
                } else if (matchevent == "WMnWjG8PS58") {
                    // ANC SECOND VISIT
                    if (trackdata.events[i].eventDate) {
                        var dataval = trackdata.events[i].dataValues;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;

                            if (id == "XI9R4MyF4cP") // hb value 2nd visit
                            {
                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            } else if (id == "RMGf5pzvlGN") // hb value 3rd visit
                            {
                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            } else if (id == "HkOHsdUuQSl") // hb value 4th visit
                            {
                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            } else if (id == "jTyiikEB6Vm") //hb(gm)
                            {

                                var vall = dataval[q].value;
                                obj_hb_gm_first.push(vall);
                                reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                                mild.push("11");
                                moderate.push("9");
                                severe.push("7");
                            }
                        }
                    }
                }
            }
        });

        var ctx = document.getElementById('myChartdm').getContext('2d');
        var myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: reportdate_first,
                responsive: true,
                datasets: [{
                    label: "HB-Value(gm/dl)",
                    backgroundColor: '#0686F7',
                    borderColor: '#0686F7',
                    data: obj_hb_gm_first,
                    borderDash: [5, 5],
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "HB-Mild:Cut-off",
                    backgroundColor: '#5BC606',
                    borderColor: '#5BC606',
                    borderWidth: '5px',
                    data: mild,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "HB-Moderate:Cut-off",
                    backgroundColor: '#FCA150',
                    borderColor: '#FCA150',
                    borderWidth: '5px',
                    data: moderate,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "HB-Severe:Cut-off",
                    backgroundColor: '#FF0000',
                    borderColor: '#FF0000',
                    borderWidth: '5px',
                    data: severe,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }]
            },
            options: {
                responsive: true,

                tooltips: {
                    position: 'nearest',
                    mode: 'index',
                    intersect: false,
                    yPadding: 10,
                    xPadding: 10,
                    caretSize: 8,
                    backgroundColor: '#FAFAFA',
                    titleFontColor: '#000',
                    bodyFontColor: '#000',
                    borderColor: 'rgba(255,0,0)',
                    borderWidth: 4
                }
            }
        });

        $("#myModalchartdm").modal('show');
    };

    $scope.chartmodeldmm = function () {

        $.ajaxSetup({
            async: false
        });
        var obj_hb_gm_first = [];
        var default_dm = [];
        var reportdate_first = [];
        var url = window.location.href;
        var params = url.split('=');
        var per = params[1];
        var finper = per.split('&');
        var trackid = finper[0];

        $.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=jC8Gprj4pWV&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data) {

            var trackdata = data;
            console.log(trackdata);

            for (var i = 0; i < trackdata.events.length; i++) {

                if (trackdata.events[i].eventDate) {

                    var dataval = trackdata.events[i].dataValues;
                    for (var q = 0; q < dataval.length; q++) {
                        var id = dataval[q].dataElement;

                        if (id == "FHBrdgsPgDY") //RBS (mg/dl)
                        {

                            var vall = dataval[q].value;
                            obj_hb_gm_first.push(vall);
                            reportdate_first.push(trackdata.events[i].eventDate.substring(0, 10));
                            default_dm.push("200");
                        }
                    }
                }
            }
        });

        var ctx = document.getElementById('myChartdmm').getContext('2d');
        var myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: reportdate_first,
                responsive: true,
                datasets: [{
                    label: "RBS mg/dl-Value",
                    backgroundColor: '#0B2BF5',
                    borderColor: '#0B2BF5',
                    borderDash: [5, 5],
                    data: obj_hb_gm_first,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "RBS mg/dl:Cut-off",
                    backgroundColor: '#FF0000',
                    borderColor: '#FF0000',
                    borderWidth: '5px',
                    data: default_dm,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }]
            },
            options: {
                responsive: true,

                tooltips: {
                    position: 'nearest',
                    mode: 'index',
                    intersect: false,
                    yPadding: 10,
                    xPadding: 10,
                    caretSize: 8,
                    backgroundColor: '#FAFAFA',
                    titleFontColor: '#000',
                    bodyFontColor: '#000',
                    borderColor: '#0FFDD6',
                    borderWidth: 4
                }
            }
        });

        $("#myModalchartdmm").modal('show');
    };

    $scope.chartmodelchild = function () {

        $.ajaxSetup({
            async: false
        });
        var dobvalue;
        var obj_hb_gm_first = [];
        var obj_default_value = [];
        var reportdate_first = [];
        var url = window.location.href;
        var params = url.split('=');
        var per = params[1];
        var finper = per.split('&');
        var trackid = finper[0];

        $.get("../api/trackedEntityInstances/" + trackid + ".json?", function (data1) {
            var trackdata = data1;

            for (var i = 0; i < trackdata.attributes.length; i++) {

                var idd = trackdata.attributes[i].attribute;

                if (trackdata.attributes[i].displayName == "Date of birth") {
                    dobvalue = trackdata.attributes[i].value;
                }
            }
        });

        $.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=JdZ3gv6cx54&trackedEntityInstance=" + trackid + "&order=eventDate:asc", function (data) {

            var trackdata = data;
            console.log(trackdata);

            for (var i = 0; i < trackdata.events.length; i++) {

                if (trackdata.events[i].eventDate) {

                    var dataval = trackdata.events[i].dataValues;
                    for (var q = 0; q < dataval.length; q++) {
                        var id = dataval[q].dataElement;
                        //CALCULATE AGE FROM DOB AND EVENT DATE

                        if (id == "X0LM2G9QrRq") //BCG(Birth Dose)
                        {

                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("BCG(Birth Dose)");
                                obj_default_value.push("0");
                            }
                        } else if (id == "pY9t6s0BPcx") //DPT/Penta 1
                        {
                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("DPT/Penta 1");
                                obj_default_value.push("6");
                            }
                        } else if (id == "pqBNLJWicCs") //DPT/Penta 2
                        {
                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("DPT/Penta 2");
                                obj_default_value.push("10");
                            }
                        } else if (id == "bLJEYJvjbtF") //DPT/Penta 3
                        {
                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("DPT/Penta 3");
                                obj_default_value.push("14");
                            }
                        } else if (id == "kq5XBCko5id") //Measles (1st dose)
                        {
                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("Measles 1");
                                obj_default_value.push("39");
                            }
                        } else if (id == "mtHUBDF91KG") //Measles 2nd Dose
                        {
                            var vall = dataval[q].value;
                            if (vall == "true") {

                                var repodate = new Date(trackdata.events[i].eventDate.substring(0, 10)),
                                    dateantime = new Date(dobvalue);
                                var datediff = Math.abs((repodate.getTime() - dateantime.getTime()) / (1000 * 60 * 60 * 24));
                                obj_hb_gm_first.push(Math.round(datediff / 7));
                                reportdate_first.push("Measles 2");
                                obj_default_value.push("78");
                            }
                        }
                    }
                }
            }
        });

        var ctx = document.getElementById('myChartchild').getContext('2d');
        var myLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: reportdate_first,
                responsive: true,
                datasets: [{
                    label: "Vaccination(Weeks)",
                    backgroundColor: '#FA0715',
                    borderColor: '#FA0715',
                    borderDash: [5, 5],
                    data: obj_hb_gm_first,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }, {
                    label: "Ideal UIP(Weeks)",
                    backgroundColor: '#5EFF32',
                    borderColor: '#5EFF32',
                    borderWidth: '5px',
                    data: obj_default_value,
                    responsive: true,
                    fill: false,
                    lineTension: 0
                }]
            },
            options: {
                responsive: true,

                tooltips: {
                    position: 'nearest',
                    mode: 'index',
                    intersect: false,
                    yPadding: 10,
                    xPadding: 10,
                    caretSize: 8,
                    backgroundColor: '#FAFAFA',
                    titleFontColor: '#000',
                    bodyFontColor: '#000',
                    borderColor: '#5EFF32',
                    borderWidth: 4
                }
            }
        });

        $("#myModalchartchild").modal('show');
    };
// custom change for intpart end


    $scope.showEnrollment = function () {
        $scope.displayEnrollment = true;
    };

    $scope.removeWidget = function (widget) {
        var modalOptions = {
            closeButtonText: 'no',
            actionButtonText: 'yes',
            headerText: 'remove_widget',
            bodyText: 'remove_widget_info'
        };

        ModalService.showModal({}, modalOptions).then(function (result) {
            widget.show = false;
            saveDashboardLayout();

        }, function () {

        });
    };

    $scope.expandCollapse = function (widget) {
        widget.expand = !widget.expand;
        saveDashboardLayout();
    };

    $scope.showHideWidgets = function () {
        var modalInstance = $modal.open({
            templateUrl: "components/dashboard/dashboard-widgets.html",
            controller: "DashboardWidgetsController"
        });

        modalInstance.result.then(function () {
        });
    };

    $rootScope.closeOpenWidget = function () {
        saveDashboardLayout();
    };

    $rootScope.getCurrentWidget = function(scope){
        var widgetLoaderScope = scope.$parent.$parent;
        if(widgetLoaderScope.biggerWidget) return widgetLoaderScope.biggerWidget;
        if(widgetLoaderScope.smallerWidget) return widgetLoaderScope.smallerWidget;
        return null;
    }

    $scope.openTopBarSettings = function(){
        $scope.topBarConfig.openSettings().then(function(topBarSettings){
            $scope.topBarConfig.settings = topBarSettings;

            saveDashboardLayout();
        });
    }

    $scope.fetchTei = function (mode) {
        var current = $scope.sortedTeiIds.indexOf($scope.selectedTeiId);
        var pr = $scope.selectedProgram ? $scope.selectedProgram.id : ($location.search()).program;
        var tei = null;
        if (mode === 'NEXT') {
            tei = $scope.sortedTeiIds[current + 1];
        } else {
            tei = $scope.sortedTeiIds[current - 1];
        }
        $location.path('/dashboard').search({tei: tei, program: pr ? pr : null, ou: orgUnitUrl ? orgUnitUrl : null});
    };

    $scope.showManageTeiDropdown = function(){
        return $scope.trackedEntityType && $scope.trackedEntityType.access.data.write && $scope.selectedProgram && $scope.selectedProgram.access.data.write;
    }
});
