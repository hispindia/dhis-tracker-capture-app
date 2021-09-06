//trackerCapture.controller('ADDAttendanceController',
  var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('ADDAttendanceController',
    function ($rootScope,
              $scope,
              $modal,
              $timeout,
              SessionStorageService,
              $modalInstance,
              DHIS2EventFactory,
              AjaxCalls,
              utilityService) {


        $scope.teiAttributesMapAttendance = [];
        $scope.trackedEntityMap = [];
        $scope.checkedTrackedEntityInstancesMap = [];

        $scope.alreadyAttendedTEIMap = [];
        /*
        AjaxCalls.getEventsByTrackedEntityInstancesAndProgramStageUid( $modalInstance.selectedEventAttendance.programStage, $modalInstance.selectedEventAttendance.trackedEntityInstance ).then(function(attendEvents){

            if( attendEvents.events[0].event )
            {
                $scope.attendEvent = attendEvents.events[0].event;

                AjaxCalls.getEventMemberByEvent( $scope.attendEvent ).then(function( alreadyAttendedTEIs ){
                    $scope.attendTrackedEntityInstanceList = alreadyAttendedTEIs;

                    AjaxCalls.getEventsByTrackedEntityInstancesAndProgramStage( $modalInstance.selectedEventAttendance.trackedEntityInstance ).then(function(inviteEventMember){

                        $scope.inviteEventUid = inviteEventMember.events[0].event;

                        AjaxCalls.getEventMemberByEvent( $scope.inviteEventUid ).then(function(invitedTrackedEntityInstances){

                            $scope.invitedTrackedEntityInstanceList = invitedTrackedEntityInstances;

                            if( $scope.invitedTrackedEntityInstanceList.eventMembers )
                            {
                                if( $scope.attendTrackedEntityInstanceList.eventMembers )
                                {
                                    for (var i=0;i<$scope.invitedTrackedEntityInstanceList.eventMembers.length;i++)
                                    {
                                        for (var j=0;j<$scope.attendTrackedEntityInstanceList.eventMembers.length;j++)
                                        {
                                            if( $scope.invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance == $scope.attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance)
                                            {
                                                $scope.alreadyAttendedTEIMap[$scope.attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance] = true;

                                                //console.log(  " alreadyAttended -- " +  $scope.attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance );
                                                break;
                                            }
                                            else
                                            {
                                                $scope.alreadyAttendedTEIMap[$scope.invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance] = false;
                                                //console.log(  " invited -- " +  $scope.invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance );
                                            }
                                        }
                                    }
                                }
                            }

                        });

                    });
                });
            }

        });
        */

        $scope.eventMemberMap = [];

        $scope.updateEventTeiMap = function(event)
        {
            if( event.eventMembers )
            {
                for (var i=0;i<event.eventMembers.length;i++)
                {
                    $scope.eventMemberMap[event.eventMembers[i].trackedEntityInstance] = event.eventMembers[i];
                }
            }

        }
        $timeout(function(){
            $scope.updateEventTeiMap($modalInstance.selectedEventAttendance);
        });


        AjaxCalls.getEventsByTrackedEntityInstancesAndProgramStage( $modalInstance.selectedEventAttendance.trackedEntityInstance ).then(function(inviteEvents){

            //$scope.inviteTEI = $modalInstance.selectedEventAttendance.trackedEntityInstance;

            $scope.inviteEvent = inviteEvents.events[0].event;


            //get attributes for display in association widget
            AjaxCalls.getEventMemberByEvent( $scope.inviteEvent ).then(function(allTrackedEntityInstance){

                console.log(  " invite member list -- " +  allTrackedEntityInstance.eventMembers.length );

                $scope.trackedEntityInstanceList = allTrackedEntityInstance;
                $scope.TEtoEventTEIMap = [];
                $scope.TEWiseEventTEIs = [];

                /*
                if( $scope.trackedEntityInstanceList.trackedEntityInstances )
                {
                    for (var i=0;i<$scope.trackedEntityInstanceList.trackedEntityInstances.length;i++){

                        $scope.trackedEntityInstanceList.trackedEntityInstances[i].checkedValue = "";

                        if (!$scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.trackedEntityInstances[i].trackedEntity]){
                            $scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.trackedEntityInstances[i].trackedEntity] = [];
                        }

                        $scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.trackedEntityInstances[i].trackedEntity].push($scope.trackedEntityInstanceList.trackedEntityInstances[i]);

                    }

                    for (key in $scope.TEtoEventTEIMap){
                        var TEIList = [];
                        for (var j=0;j<$scope.TEtoEventTEIMap[key].length;j++) {
                            updateMap($scope.TEtoEventTEIMap[key][j]);
                            TEIList.push($scope.TEtoEventTEIMap[key][j])
                        }
                        $scope.TEWiseEventTEIs.push({
                            id: key,
                            trackedEntity: $scope.trackedEntityMap[key].displayName,
                            TEIList :TEIList});
                    }

                }
                */

                if( $scope.trackedEntityInstanceList.eventMembers )
                {

                    //$scope.alreadyAttendedTEIMap = utilityService.getAlreadyAttendedTEIMap( $modalInstance.selectedEventAttendance.programStage, $modalInstance.selectedEventAttendance.trackedEntityInstance );

                    utilityService.getAlreadyAttendedTEIMap($modalInstance.selectedEventAttendance.programStage, $modalInstance.selectedEventAttendance.trackedEntityInstance).then(function( responseMap ){

                        $scope.alreadyAttendedTEIMap = responseMap ;

                        console.log(  " Map length -- " +  responseMap.length );


                        for (var i=0;i<$scope.trackedEntityInstanceList.eventMembers.length;i++)
                        {
                            $scope.trackedEntityInstanceList.eventMembers[i].checkedValue = "";

                            if( $scope.alreadyAttendedTEIMap[$scope.trackedEntityInstanceList.eventMembers[i].trackedEntityInstance] )
                            {
                                $scope.trackedEntityInstanceList.eventMembers[i].checkedValue = true;
                            }
                            else
                            {
                                $scope.trackedEntityInstanceList.eventMembers[i].checkedValue = false;
                            }

                            //$scope.trackedEntityInstanceList.eventMembers[i].checkedValue = "";

                            if (!$scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.eventMembers[i].trackedEntity])
                            {
                                $scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.eventMembers[i].trackedEntity] = [];
                            }

                            $scope.TEtoEventTEIMap[$scope.trackedEntityInstanceList.eventMembers[i].trackedEntity].push($scope.trackedEntityInstanceList.eventMembers[i]);

                        }

                        for (var key in $scope.TEtoEventTEIMap){
                            var TEIList = [];
                            for (var j=0;j<$scope.TEtoEventTEIMap[key].length;j++) {
                                $scope.updateMap($scope.TEtoEventTEIMap[key][j]);
                                TEIList.push($scope.TEtoEventTEIMap[key][j])
                            }
                            $scope.TEWiseEventTEIs.push({
                                id: key,
                                trackedEntity: $scope.trackedEntityMap[key].displayName,
                                TEIList :TEIList});
                        }
                    });
                }

                else
                {
                    $scope.trackedEntityInstanceList = undefined;
                }

            });

        });


        //get attributes for display in association widget
        AjaxCalls.getInvitationAndAttendedWidgetAttributes().then(function(attendanceAttributes){
            $scope.attendanceAttributes = attendanceAttributes;
        });

        // get all tracked entities

        AjaxCalls.getTrackedEntities().then(function(data){
            if (data.trackedEntities)
                $scope.trackedEntityMap = utilityService.prepareIdToObjectMap(data.trackedEntities,"id");
        });

        // add trackedEntityInstance in attended programstageinstance members
        $scope.attended = function () {

            $scope.updateEventMember();

            /*
            $timeout(function() {

                updateEventMember();

                //restore previously selected org unit

                selection.setSelected($scope.previouslySelectedOrgUnitId);
                selection.load();
                SessionStorageService.set('SELECTED_OU', {id:$scope.previouslySelectedOrgUnitId});

                $rootScope.$broadcast('attendance-div', {event : $modalInstance.selectedEventAttendance , show :true});


            }, 200);
            $modalInstance.close();
            */

        };


        $scope.updateEventMember = function(){

            // Add selected event to TEI associations

            /*
            for (var i=0;i<$scope.trackedEntityInstanceList.trackedEntityInstances.length;i++)
            {
                if( $scope.trackedEntityInstanceList.trackedEntityInstances[i].checkedValue )
                {
                    console.log( i + " -- " + $scope.trackedEntityInstanceList.trackedEntityInstances[i] )
                }
            }
            */

            for (var i=0;i<$scope.trackedEntityInstanceList.eventMembers.length;i++)
            {
                if( $scope.trackedEntityInstanceList.eventMembers[i].checkedValue )
                {
                    console.log( i + " -- " + $scope.trackedEntityInstanceList.eventMembers[i].trackedEntityInstance );
                }
            }

            AjaxCalls.getEventbyId($modalInstance.selectedEventAttendance.event).then(function(event){

                /*
                for (var i=0;i<$scope.trackedEntityInstanceList.trackedEntityInstances.length;i++)
                {
                    if( $scope.trackedEntityInstanceList.trackedEntityInstances[i].checkedValue )
                    {
                        if (event.eventMembers)
                        {
                            event.eventMembers.push($scope.trackedEntityInstanceList.trackedEntityInstances[i]);
                        }
                        else
                        {
                            event.eventMembers = [];
                            event.eventMembers.push($scope.trackedEntityInstanceList.trackedEntityInstances[i]);
                        }

                    }
                }
                */

                //Add selected event to TEI attended

                event.eventMembers = [];

                for (var i=0;i<$scope.trackedEntityInstanceList.eventMembers.length;i++)
                {
                    if( $scope.trackedEntityInstanceList.eventMembers[i].checkedValue )
                    {
                        if (event.eventMembers)
                        {
                            event.eventMembers.push($scope.trackedEntityInstanceList.eventMembers[i]);
                        }
                        else
                        {
                            event.eventMembers = [];
                            event.eventMembers.push($scope.trackedEntityInstanceList.eventMembers[i]);
                        }

                    }
                }


                DHIS2EventFactory.update(event).then(function(response)
                {
                    if (response.httpStatus == "OK")
                    {
                        $scope.updateEventTeiMap(event);

                        selection.setSelected($scope.previouslySelectedOrgUnitId);
                        selection.load();
                        SessionStorageService.set('SELECTED_OU', {id:$scope.previouslySelectedOrgUnitId});

                        $rootScope.$broadcast('attendance-div', {event : $modalInstance.selectedEventAttendance , show :true});

                        //$scope.updateEventTeiMap(event);
                        $modalInstance.close();
                    }
                    else
                    {
                        alert("An unexpected thing occurred.");
                    }

                });

            });
            $modalInstance.close();
        };


        // close popUp Window

        $scope.closeWindowAttendance = function () {
            $modalInstance.close();
        };




        $scope.updateMap = function(tei){

            for (var i=0;i<tei.attributes.length;i++){

                if (!$scope.teiAttributesMapAttendance[tei.trackedEntityInstance]){
                    $scope.teiAttributesMapAttendance[tei.trackedEntityInstance] = []
                }
                $scope.teiAttributesMapAttendance[tei.trackedEntityInstance][tei.attributes[i].attribute] = tei.attributes[i].value;
            }
        };


        AjaxCalls.getRootOrgUnit().then(function(data){
            $scope.previouslySelectedOrgUnitId = selection.getSelected()[0];
            selection.setSelected(data.organisationUnits[0].id);
            selection.load();
        })

    });