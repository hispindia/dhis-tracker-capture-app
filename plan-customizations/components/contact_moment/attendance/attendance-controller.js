//trackerCapture.controller('AttendanceController',
  var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('AttendanceController',
    function ($rootScope,
              $scope,
              $modal,
              $timeout,
              AjaxCalls,
              SessionStorageService,
              ModalService,
			 CurrentSelection,
              DHIS2EventFactory,
              utilityService) {


        $scope.teiAttributesMapAttendance = [];
        $scope.trackedEntityMap = [];
		 //***************for csv export**************//
        $scope.attendanceAttributes=[];
        $scope.TEWiseEventTEIs = [];
        $scope.attendancelist=[];
        $scope.selections = CurrentSelection.get();
        $scope.attributes = [];
        $scope.selectedTei = angular.copy($scope.selections.tei);
        $scope.data=[];
        $scope.contactmomenttype=[];
        $scope.selections = CurrentSelection.get();
        $scope.selectedProgram = $scope.selections.pr;
        $scope.filename = "test";
        // *************csv export end*******************//
		

        $scope.$on('attendance-div', function (event, args) {

            $scope.TEtoEventTEIMap = [];
            $scope.TEWiseEventTEIs = [];
            
            if (args.show)
            {
                $scope.eventSelected = true;
                AjaxCalls.getEventbyId(args.event.event).then(function(event){
                    $scope.selectedEventAttendance = event;

                    if (event.eventMembers)
                        for (var i=0;i<event.eventMembers.length;i++){
                            if (!$scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity]){
                                $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity] = [];
                            }
                            $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity].push(event.eventMembers[i]);

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
                $scope.selectedEventAttendance = undefined;
            }

        });


        //get attributes for display in association widget
        AjaxCalls.getInvitationAndAttendedWidgetAttributes().then(function(attendanceAttributes){
            $scope.attendanceAttributes = attendanceAttributes;
			 // *********************for csv export*********************//
            if (angular.isUndefined($scope.selectedProgram.name))
            {
                $scope.attendancelist[5] = " ";}
            else {
                $scope.attendancelist[5] =$scope.selectedProgram.name;
            }
            if (angular.isUndefined($scope.selectedOrgUnit.name))
            {
                $scope.attendancelist[6] = " ";}
            else {
                $scope.attendancelist[6] =$scope.selectedOrgUnit.name;
            }
            if (angular.isUndefined( $scope.selectedTei.attributes[0].value)||(($scope.selectedTei.attributes[0].value).startsWith("PLAN")))
            {
                $scope.contactmomenttype[0] = " ";}
            else {
                $scope.contactmomenttype[0]=  $scope.selectedTei.attributes[0].value;
            }

            $scope.data = [{
                a:"Program:   "+$scope.attendancelist[5],
                b:"",
                c:"Enrolling organisation unit:"+ $scope.attendancelist[6],
                d:"",
                e:"Contact Moment Type:    "+$scope.contactmomenttype[0]}];
            $scope.data.length=2;
            $scope.data = $scope.data.concat ({
                a: attendanceAttributes[0]['displayName'],
                b:attendanceAttributes[1]['displayName'],
                c:attendanceAttributes[2]['displayName'],
                d:attendanceAttributes[3]['displayName'],
                e:attendanceAttributes[4]['displayName']	});
            // ***************************for csv export end**********************//
			 
			

        });

        // get all tracked entities

        AjaxCalls.getTrackedEntities().then(function(data){
            if (data.trackedEntities)
                $scope.trackedEntityMap = utilityService.prepareIdToObjectMap(data.trackedEntities,"id");
        });


        $scope.showAttendanceSelectionScreen = function () {
            //debugger
            var modalInstance = $modal.open({
                templateUrl: 'plan-customizations/components/contact_moment/attendance/addAttendance.html',
                controller: 'ADDAttendanceController',
                windowClass: 'modal-full-window',
                resolve: {

                }
            });
            modalInstance.selectedEventAttendance = $scope.selectedEventAttendance;
            modalInstance.result.then(function () {

            }, function () {
            });
        };


        $scope.updateMap = function(tei){
		 // *******************for csv export**************** //
            $scope.data.length=3;

            AjaxCalls.getInvitationAndAttendedWidgetAttributes().then(function(attendanceAttributes){
          // for csv export end  //
            for (var i=0;i<tei.attributes.length;i++){

                if (!$scope.teiAttributesMapAttendance[tei.trackedEntityInstance]){
                    $scope.teiAttributesMapAttendance[tei.trackedEntityInstance] = []
                }
                $scope.teiAttributesMapAttendance[tei.trackedEntityInstance][tei.attributes[i].attribute] = tei.attributes[i].value;
            }
			
			  // for csv export //
                $scope.attendanceAttributes = attendanceAttributes;
                for(var i =0;i<5;i++) {

                    if (angular.isUndefined($scope.teiAttributesMapAttendance[tei.trackedEntityInstance][attendanceAttributes[i]['id']])){
                    $scope.attendancelist[i] = " ";}
                    else{
                        $scope.attendancelist[i] = $scope.teiAttributesMapAttendance[tei.trackedEntityInstance][attendanceAttributes[i]['id']];
                    }

                }
                $scope.data = $scope.data.concat({
                    a:$scope.attendancelist[0],
                    b:$scope.attendancelist[1],
                    c:$scope.attendancelist[2],
                    d:$scope.attendancelist[3],
                    e:$scope.attendancelist[4]});
                // ************************ for csv export end *****************************//


            });

			
        };

        // delete Tracked Entity Instance From Event Attendance
        $scope.deleteTrackedEntityInstanceFromEventAttendance = function(trackedEntityInstance, attendanceEvent){

            var modalOptions = {
                closeButtonText: 'cancel',
                actionButtonText: 'delete',
                headerText: 'delete',
                bodyText: 'are_you_sure_to_delete'
            };

            ModalService.showModal({}, modalOptions).then(function(result){
                //alert( trackedEntityInstance  + "--" + attendanceEvent.eventMembers.length );
                if (attendanceEvent.eventMembers.length)
                {
                    for ( var i=0;i<attendanceEvent.eventMembers.length;i++ )
                    {
                        if (attendanceEvent.eventMembers[i].trackedEntityInstance == trackedEntityInstance)
                        {
                            attendanceEvent.eventMembers.splice(i,1);
                        }
                    }
                }

                if (attendanceEvent.eventMembers.length == 0)
                {
                    delete(attendanceEvent.eventMembers);
                }

                //update events list after delete tei

                DHIS2EventFactory.update(attendanceEvent).then(function(response)
                {
                    if (response.httpStatus == "OK")
                    {
                        $timeout(function () {
                            $rootScope.$broadcast('attendance-div', {event : attendanceEvent, show :true});
                        }, 200);
                    }
                    else
                    {
                        alert("An unexpected thing occurred.");
                    }
                });

            });
        };

    });
